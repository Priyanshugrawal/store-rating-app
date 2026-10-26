const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const ownerService = require('../services/owner.service');

exports.dashboard = asyncHandler(async (req, res) => ok(res, await ownerService.dashboard(req.user.id)));

exports.createStore = asyncHandler(async (req, res) => ok(res, await ownerService.createOwnStore(req.user.id, req.body), undefined, 201));

exports.ratings = asyncHandler(async (req, res) => {
  const { items, meta } = await ownerService.listRatings(req.user.id, req.query);
  ok(res, items, meta);
});
