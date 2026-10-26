const asyncHandler = require('../utils/asyncHandler');
const { ok, created } = require('../utils/response');
const authService = require('../services/auth.service');

exports.register = asyncHandler(async (req, res) => {
  const { name, email, address, password } = req.body; // explicit pick = no mass assignment
  const result = await authService.register({ name, email, address, password });
  return created(res, result, 'Account created successfully');
});

exports.login = asyncHandler(async (req, res) => {
  const result = await authService.login({ email: req.body.email, password: req.body.password });
  return ok(res, result);
});

exports.me = asyncHandler(async (req, res) => ok(res, { user: req.user }));

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, { currentPassword, newPassword });
  return ok(res, { message: 'Password changed successfully' });
});
