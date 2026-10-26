const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { jwtSecret, jwtExpiresIn, bcryptRounds } = require('../config/env');
const AppError = require('../utils/AppError');

// Never return password hashes
const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  address: u.address,
  role: u.role,
  createdAt: u.createdAt,
});
exports.publicUser = publicUser;

exports.hashPassword = (plain) => bcrypt.hash(plain, bcryptRounds);

const signToken = (user) => jwt.sign({ role: user.role }, jwtSecret, { subject: String(user.id), expiresIn: jwtExpiresIn, algorithm: 'HS256' });

// Used to keep response time similar when the email does not exist
const DUMMY_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8.4Lw5wGkG0r9iJ6j6n1o9X1X2uKQa';

/** Public self-registration: ALWAYS creates a Normal User (role in body is ignored). */
exports.register = async ({ name, email, address, password }) => {
  const passwordHash = await exports.hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, address, passwordHash, role: 'USER' },
  });
  return { user: publicUser(user), token: signToken(user) };
};

exports.login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  const valid = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !valid) throw new AppError('Invalid email or password', 401);
  return { user: publicUser(user), token: signToken(user) };
};

exports.changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('Account no longer exists', 401);
  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) throw new AppError('Current password is incorrect', 400, { currentPassword: 'Current password is incorrect' });
  if (currentPassword === newPassword) {
    throw new AppError('New password must be different from the current password', 400, {
      newPassword: 'New password must be different from the current password',
    });
  }
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await exports.hashPassword(newPassword) } });
};
