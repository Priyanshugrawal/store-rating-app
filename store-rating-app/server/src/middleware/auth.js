const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { jwtSecret } = require('../config/env');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/** Requires a valid "Authorization: Bearer <token>" header and loads the user. */
exports.authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw new AppError('Authentication required', 401);

  let payload;
  try {
    payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw new AppError('Your session has expired. Please log in again', 401);
    throw new AppError('Invalid authentication token', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: Number(payload.sub) },
    select: { id: true, name: true, email: true, address: true, role: true },
  });
  if (!user) throw new AppError('Account no longer exists', 401);
  req.user = user;
  next();
});

/** Role-based authorization: authorize('ADMIN') or authorize('USER', 'OWNER') */
exports.authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(new AppError('Authentication required', 401));
  if (!roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action', 403));
  }
  next();
};
