const asyncHandler = require('../utils/asyncHandler');
const { ok, created } = require('../utils/response');
const adminService = require('../services/admin.service');

exports.dashboard = asyncHandler(async (req, res) => ok(res, await adminService.dashboard()));

exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, address, password, role } = req.body;
  created(res, await adminService.createUser({ name, email, address, password, role }), 'User created');
});

exports.listUsers = asyncHandler(async (req, res) => {
  const { items, meta } = await adminService.listUsers(req.query);
  ok(res, items, meta);
});

exports.getUser = asyncHandler(async (req, res) => ok(res, await adminService.getUser(req.params.id)));

exports.createStore = asyncHandler(async (req, res) => {
  const { name, email, address, ownerId } = req.body;
  created(res, await adminService.createStore({ name, email, address, ownerId }), 'Store created');
});

exports.listStores = asyncHandler(async (req, res) => {
  const { items, meta } = await adminService.listStores(req.query);
  ok(res, items, meta);
});

exports.availableOwners = asyncHandler(async (req, res) => ok(res, await adminService.availableOwners()));
