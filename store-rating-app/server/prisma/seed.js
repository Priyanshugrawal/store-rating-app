// Creates the FIRST system administrator from environment variables (no credentials in code).
// Usage: npm run seed
require('dotenv').config({ quiet: true });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { z } = require('zod');
const c = require('../src/validators/common');

const prisma = new PrismaClient();

async function main() {
  const schema = z.object({
    ADMIN_NAME: c.name,
    ADMIN_EMAIL: c.email,
    ADMIN_ADDRESS: c.address,
    ADMIN_PASSWORD: c.password,
  });
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Cannot create the administrator. Fix these values in your .env file:');
    for (const i of parsed.error.issues) console.error(` - ${i.path.join('.')}: ${i.message}`);
    process.exit(1);
  }
  const d = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: d.ADMIN_EMAIL } });
  if (existing) {
    console.log(`An account with ${d.ADMIN_EMAIL} already exists. Nothing to do.`);
    return;
  }
  const passwordHash = await bcrypt.hash(d.ADMIN_PASSWORD, Number(process.env.BCRYPT_ROUNDS) || 10);
  await prisma.user.create({
    data: { name: d.ADMIN_NAME, email: d.ADMIN_EMAIL, address: d.ADMIN_ADDRESS, passwordHash, role: 'ADMIN' },
  });
  console.log(`Administrator created: ${d.ADMIN_EMAIL}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
