// Consistent JSON envelope: { success, message?, data?, meta? }
exports.ok = (res, data, meta, status = 200) => {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
};
exports.created = (res, data, message) => {
  const body = { success: true, data };
  if (message) body.message = message;
  return res.status(201).json(body);
};
