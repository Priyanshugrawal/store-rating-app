const prisma = require('../config/db');
const AppError = require('../utils/AppError');
const { toSkipTake, buildMeta } = require('../utils/pagination');
const { roundAvg } = require('../utils/rating');

// The owner is always resolved from the logged-in user - never from a client-supplied id.
const getOwnStore = async (ownerId) => {
  const store = await prisma.store.findUnique({ where: { ownerId } });
  if (!store) throw new AppError('You do not have a store yet', 404);
  return store;
};

/**
 * A member opens their own store. The account becomes a Store Owner (it keeps every
 * shopper feature). The role change and the store are saved together, or not at all.
 */
exports.createOwnStore = async (userId, { name, email, address }) => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.store.findUnique({ where: { ownerId: userId } });
    if (existing) throw new AppError('You already have a store', 409);
    await tx.user.update({ where: { id: userId }, data: { role: 'OWNER' } });
    const store = await tx.store.create({ data: { name, email, address, ownerId: userId } });
    return { id: store.id, name: store.name, email: store.email, address: store.address, createdAt: store.createdAt };
  });
};

exports.dashboard = async (ownerId) => {
  const store = await getOwnStore(ownerId);
  const [agg, groups] = await Promise.all([
    prisma.rating.aggregate({ where: { storeId: store.id }, _avg: { rating: true }, _count: { rating: true } }),
    prisma.rating.groupBy({ by: ['rating'], where: { storeId: store.id }, _count: { rating: true } }),
  ]);
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const g of groups) distribution[g.rating] = g._count.rating;
  return {
    store: { id: store.id, name: store.name, email: store.email, address: store.address },
    averageRating: roundAvg(agg._avg.rating),
    ratingCount: agg._count.rating,
    distribution,
  };
};

const SORTS = {
  userName: (o) => ({ user: { name: o } }),
  userEmail: (o) => ({ user: { email: o } }),
  rating: (o) => ({ rating: o }),
  createdAt: (o) => ({ updatedAt: o }), // "submission date" = last time the rating was set
};

exports.listRatings = async (ownerId, q) => {
  const store = await getOwnStore(ownerId);
  const where = { storeId: store.id };
  const { skip, take } = toSkipTake(q);
  const [total, rows] = await Promise.all([
    prisma.rating.count({ where }),
    prisma.rating.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: [SORTS[q.sortBy](q.order), { id: 'asc' }],
      skip,
      take,
    }),
  ]);
  const items = rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    submittedAt: r.updatedAt,
    user: r.user,
  }));
  return { items, meta: buildMeta(q, total) };
};
