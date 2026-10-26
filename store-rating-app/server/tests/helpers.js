const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../src/app');
const prisma = require('../src/config/db');

exports.app = app;
exports.prisma = prisma;
exports.api = () => request(app);

exports.PASSWORD = 'Passw0rd!';
let counter = 0;
const uniq = () => `${Date.now()}${counter++}`;

exports.resetDb = async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "ratings", "stores", "users" RESTART IDENTITY CASCADE');
};

exports.makeUser = async (role = 'USER', overrides = {}) => {
  const n = uniq();
  return prisma.user.create({
    data: {
      name: `Test ${role} Person Number ${n}`.slice(0, 60).padEnd(20, 'x'),
      email: `${role.toLowerCase()}${n}@example.com`,
      address: '1 Test Street',
      role,
      passwordHash: await bcrypt.hash(exports.PASSWORD, 4),
      ...overrides,
    },
  });
};

exports.makeStore = async (owner, overrides = {}) => {
  const n = uniq();
  return prisma.store.create({
    data: {
      name: `Test Store Number ${n}`.padEnd(20, 'x').slice(0, 60),
      email: `store${n}@example.com`,
      address: '99 Market Road',
      ownerId: owner ? owner.id : null,
      ...overrides,
    },
  });
};

exports.login = async (user) => {
  const res = await request(app).post('/api/auth/login').send({ email: user.email, password: exports.PASSWORD });
  return res.body.data.token;
};
exports.bearer = (token) => ({ Authorization: `Bearer ${token}` });
