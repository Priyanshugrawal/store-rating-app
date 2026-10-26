const { Prisma } = require('@prisma/client');
const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const { escapeLike, toSkipTake, buildMeta } = require('../utils/pagination');
const { roundAvg } = require('../utils/rating');

// Whitelist: query-string value -> SQL expression. User input is NEVER put into SQL text.
const SORT_COLUMNS = {
  name: 's.name',
  email: 's.email',
  address: 's.address',
  rating: '"averageRating"',
  createdAt: 's.created_at',
};

const like = (text) => `%${escapeLike(text)}%`;

/**
 * Lists stores with average rating (calculated from the ratings table),
 * rating count and - when viewerId is given - that viewer's own rating.
 * All user input is passed as bound parameters (tagged template), so it is injection-safe.
 */
exports.listStores = async (query, { viewerId, storeId } = {}) => {
  const conditions = [Prisma.sql`TRUE`];
  if (storeId) conditions.push(Prisma.sql`s.id = ${storeId}`);
  if (query.search) {
    conditions.push(Prisma.sql`(s.name ILIKE ${like(query.search)} OR s.address ILIKE ${like(query.search)})`);
  }
  if (query.name) conditions.push(Prisma.sql`s.name ILIKE ${like(query.name)}`);
  if (query.email) conditions.push(Prisma.sql`s.email ILIKE ${like(query.email)}`);
  if (query.address) conditions.push(Prisma.sql`s.address ILIKE ${like(query.address)}`);
  if (query.ratedByMe && viewerId) {
    conditions.push(Prisma.sql`EXISTS (SELECT 1 FROM ratings x WHERE x.store_id = s.id AND x.user_id = ${viewerId})`);
  }
  const where = Prisma.join(conditions, ' AND ');

  const sortExpr = SORT_COLUMNS[query.sortBy] || SORT_COLUMNS.name;
  const direction = query.order === 'desc' ? 'DESC' : 'ASC';
  const orderBy = Prisma.raw(`${sortExpr} ${direction} NULLS LAST, s.id ASC`);

  const page = query.page || 1;
  const limit = query.limit || 10;
  const { skip, take } = toSkipTake({ page, limit });

  const rows = await prisma.$queryRaw`
    SELECT s.id, s.name, s.email, s.address,
           s.owner_id AS "ownerId", o.name AS "ownerName", s.created_at AS "createdAt",
           AVG(r.rating)::float8 AS "averageRating",
           COUNT(r.id)::int AS "ratingCount",
           mr.rating AS "myRating"
    FROM stores s
    LEFT JOIN users o ON o.id = s.owner_id
    LEFT JOIN ratings r ON r.store_id = s.id
    LEFT JOIN ratings mr ON mr.store_id = s.id AND mr.user_id = ${viewerId || 0}
    WHERE ${where}
    GROUP BY s.id, o.name, mr.rating
    ORDER BY ${orderBy}
    LIMIT ${take} OFFSET ${skip}`;

  const countRows = await prisma.$queryRaw`SELECT COUNT(*)::int AS total FROM stores s WHERE ${where}`;
  const total = countRows[0].total;

  const items = rows.map((r) => ({ ...r, averageRating: roundAvg(r.averageRating) }));
  return { items, meta: buildMeta({ page, limit }, total) };
};

exports.getStoreForUser = async (storeId, viewerId) => {
  const { items } = await exports.listStores({ page: 1, limit: 1 }, { viewerId, storeId });
  if (!items.length) throw new AppError('Store not found', 404);
  return items[0];
};

// The store must exist, and nobody may rate their own store.
const ensureStoreExists = async (storeId, userId) => {
  const store = await prisma.store.findUnique({ where: { id: storeId }, select: { id: true, ownerId: true } });
  if (!store) throw new AppError('Store not found', 404);
  if (userId && store.ownerId === userId) throw new AppError('You cannot rate your own store', 403);
};

/** Create the user's rating, or update it when one already exists (never creates a duplicate). */
exports.submitRating = async (userId, storeId, rating) => {
  await ensureStoreExists(storeId, userId);
  const saved = await prisma.rating.upsert({
    where: { userId_storeId: { userId, storeId } },
    create: { userId, storeId, rating },
    update: { rating },
  });
  const created = saved.createdAt.getTime() === saved.updatedAt.getTime();
  const store = await exports.getStoreForUser(storeId, userId);
  return { rating: { id: saved.id, rating: saved.rating, storeId, updatedAt: saved.updatedAt }, store, created };
};

/** Update ONLY the caller's own rating (the lookup key contains the caller's id). */
exports.updateRating = async (userId, storeId, rating) => {
  await ensureStoreExists(storeId, userId);
  const existing = await prisma.rating.findUnique({ where: { userId_storeId: { userId, storeId } } });
  if (!existing) throw new AppError('You have not rated this store yet. Submit a rating first.', 404);
  const saved = await prisma.rating.update({ where: { id: existing.id }, data: { rating } });
  const store = await exports.getStoreForUser(storeId, userId);
  return { rating: { id: saved.id, rating: saved.rating, storeId, updatedAt: saved.updatedAt }, store };
};
