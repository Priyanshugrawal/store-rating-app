const { z } = require('zod');
const c = require('./common');

exports.listStoresForUserQuery = z.object({
  ...c.paginationShape,
  sortBy: z.enum(['name', 'address', 'rating']).default('name'),
  search: c.optionalText,
  ratedByMe: z.enum(['true', 'false']).optional().transform((v) => v === 'true'),
});

exports.ratingBody = z.object({ rating: c.rating });
