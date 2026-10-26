const { PrismaClient } = require('@prisma/client');

// A single shared Prisma client for the whole app.
const prisma = new PrismaClient();

module.exports = prisma;
