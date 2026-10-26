// Applies all migrations to the TEST database once before the tests run.
const { execSync } = require('child_process');
require('dotenv').config({ quiet: true });

module.exports = async () => {
  if (!process.env.TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL is not set');
  execSync('npx prisma migrate deploy', {
    stdio: 'ignore',
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
  });
};
