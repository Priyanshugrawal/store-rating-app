// validate(schema, 'body' | 'query' | 'params') - parsed (and stripped) data replaces the original.
// Unknown fields are removed, which protects against mass assignment.
module.exports = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) return next(result.error);
  req[source] = result.data;
  next();
};
