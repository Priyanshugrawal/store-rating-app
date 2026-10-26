const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const storeService = require('../services/store.service');

exports.list = asyncHandler(async (req, res) => {
  const { items, meta } = await storeService.listStores(req.query, { viewerId: req.user.id });
  ok(res, items, meta);
});

exports.get = asyncHandler(async (req, res) => ok(res, await storeService.getStoreForUser(req.params.id, req.user.id)));

exports.submitRating = asyncHandler(async (req, res) => {
  const result = await storeService.submitRating(req.user.id, req.params.id, req.body.rating);
  return ok(res, result, undefined, result.created ? 201 : 200);
});

exports.updateRating = asyncHandler(async (req, res) => {
  ok(res, await storeService.updateRating(req.user.id, req.params.id, req.body.rating));
});
