const { z } = require('zod');
const c = require('./common');

exports.createOwnStoreSchema = z.object({
  name: c.name,
  email: c.email,
  address: c.address,
});

exports.ownerRatingsQuery = z.object({
  ...c.paginationShape,
  sortBy: z.enum(['userName', 'userEmail', 'rating', 'createdAt']).default('createdAt'),
});
