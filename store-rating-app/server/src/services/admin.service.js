const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const { hashPassword, publicUser } = require('./auth.service');
const { listStores } = require('./store.service');
const { toSkipTake, buildMeta, escapeLike } = require('../utils/pagination');
const { roundAvg } = require('../utils/rating');

exports.dashboard = async () => {
  const days = 14;
  const [totalUsers, totalStores, totalRatings, roleGroups, ratingGroups, avg, perDayRows, topRows, recent] = await Promise.all([
    prisma.user.count(),
    prisma.store.count(),
    prisma.rating.count(),
    prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
    prisma.rating.groupBy({ by: ['rating'], _count: { _all: true } }),
    prisma.rating.aggregate({ _avg: { rating: true } }),
    prisma.$queryRaw`
      SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
      FROM ratings
      WHERE created_at >= date_trunc('day', now()) - ${days - 1} * interval '1 day'
      GROUP BY 1`,
    prisma.$queryRaw`
      SELECT s.id, s.name, AVG(r.rating)::float8 AS "averageRating", COUNT(r.id)::int AS "ratingCount"
      FROM stores s JOIN ratings r ON r.store_id = s.id
      GROUP BY s.id
      ORDER BY "averageRating" DESC, "ratingCount" DESC, s.id ASC
      LIMIT 24`,
    prisma.rating.findMany({
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      take: 8,
      include: { user: { select: { id: true, name: true } }, store: { select: { id: true, name: true } } },
    }),
  ]);

  const usersByRole = { ADMIN: 0, USER: 0, OWNER: 0 };
  for (const g of roleGroups) usersByRole[g.role] = g._count._all;
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const g of ratingGroups) distribution[g.rating] = g._count._all;

  // one entry per day for the last 14 days, including days with no ratings
  const counts = new Map(perDayRows.map((r) => [r.day, r.count]));
  const ratingsPerDay = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    ratingsPerDay.push({ date: key, count: counts.get(key) || 0 });
  }

  return {
    totalUsers,
    totalStores,
    totalRatings,
    averageRating: roundAvg(avg._avg.rating),
    usersByRole,
    distribution,
    ratingsPerDay,
    topStores: topRows.map((r) => ({ id: r.id, name: r.name, averageRating: roundAvg(r.averageRating), ratingCount: r.ratingCount })),
    recentRatings: recent.map((r) => ({ id: r.id, rating: r.rating, at: r.updatedAt, user: r.user, store: r.store })),
  };
};

exports.createUser = async ({ name, email, address, password, role }) => {
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({ data: { name, email, address, passwordHash, role } });
  return publicUser(user);
};

// escapeLike makes %, _ and \ match literally (Prisma does not escape them for us)
const contains = (v) => ({ contains: escapeLike(v), mode: 'insensitive' });

/** Average rating of each given store id, as a Map(storeId -> { avg, count }) */
const ratingStats = async (storeIds) => {
  if (!storeIds.length) return new Map();
  const groups = await prisma.rating.groupBy({
    by: ['storeId'],
    where: { storeId: { in: storeIds } },
    _avg: { rating: true },
    _count: { rating: true },
  });
  return new Map(groups.map((g) => [g.storeId, { avg: roundAvg(g._avg.rating), count: g._count.rating }]));
};

exports.listUsers = async (q) => {
  const where = {};
  if (q.name) where.name = contains(q.name);
  if (q.email) where.email = contains(q.email);
  if (q.address) where.address = contains(q.address);
  if (q.role) where.role = q.role;

  const { skip, take } = toSkipTake(q);
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: [{ [q.sortBy]: q.order }, { id: 'asc' }],
      skip,
      take,
      include: { ownedStore: { select: { id: true, name: true } } },
    }),
  ]);

  const stats = await ratingStats(users.filter((u) => u.ownedStore).map((u) => u.ownedStore.id));
  const items = users.map((u) => {
    const base = publicUser(u);
    if (u.role !== 'OWNER') return base;
    const s = u.ownedStore ? stats.get(u.ownedStore.id) : null;
    return {
      ...base,
      store: u.ownedStore,
      storeRating: s ? s.avg : null, // average rating of the owner's store
    };
  });
  return { items, meta: buildMeta(q, total) };
};

exports.getUser = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { ownedStore: true, _count: { select: { ratings: true } } },
  });
  if (!user) throw new AppError('User not found', 404);
  const result = { ...publicUser(user), ratingsGiven: user._count.ratings };
  if (user.role === 'OWNER') {
    if (user.ownedStore) {
      const stats = (await ratingStats([user.ownedStore.id])).get(user.ownedStore.id);
      result.store = {
        id: user.ownedStore.id,
        name: user.ownedStore.name,
        email: user.ownedStore.email,
        address: user.ownedStore.address,
        averageRating: stats ? stats.avg : null,
        ratingCount: stats ? stats.count : 0,
      };
    } else {
      result.store = null;
    }
  }
  return result;
};

exports.createStore = async ({ name, email, address, ownerId }) => {
  const owner = await prisma.user.findUnique({ where: { id: ownerId }, include: { ownedStore: true } });
  if (!owner) throw new AppError('Selected owner does not exist', 400, { ownerId: 'Selected owner does not exist' });
  if (owner.role === 'ADMIN') throw new AppError('An administrator cannot own a store', 400, { ownerId: 'An administrator cannot own a store' });
  if (owner.ownedStore) throw new AppError('This owner already has a store', 409, { ownerId: 'This owner already has a store' });
  // A normal member who is given a store becomes its Store Owner (and keeps every shopper feature).
  const store = await prisma.$transaction(async (tx) => {
    if (owner.role !== 'OWNER') await tx.user.update({ where: { id: ownerId }, data: { role: 'OWNER' } });
    return tx.store.create({ data: { name, email, address, ownerId } });
  });
  return { id: store.id, name: store.name, email: store.email, address: store.address, ownerId: store.ownerId, createdAt: store.createdAt };
};

exports.listStores = (q) => listStores(q);

/** Member accounts that do not have a store yet (for the "Add store" owner dropdown). */
exports.availableOwners = () =>
  prisma.user.findMany({
    where: { role: { in: ['USER', 'OWNER'] }, ownedStore: null },
    select: { id: true, name: true, email: true },
    orderBy: { name: 'asc' },
  });
