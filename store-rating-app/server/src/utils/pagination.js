/** Converts validated page/limit into Prisma/SQL skip & take, plus response meta. */
exports.toSkipTake = ({ page, limit }) => ({ skip: (page - 1) * limit, take: limit });

exports.buildMeta = ({ page, limit }, total) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

/** Escape % and _ so user text is matched literally inside ILIKE patterns. */
exports.escapeLike = (text) => String(text).replace(/[\\%_]/g, '\\$&');
