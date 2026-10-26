// Runs before each test file: point the app at the TEST database (never your real one).
require('dotenv').config({ quiet: true });
if (!process.env.TEST_DATABASE_URL) {
  throw new Error('TEST_DATABASE_URL is not set. See server/.env.example');
}
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_test_secret_test_secret_123456';
process.env.BCRYPT_ROUNDS = '4';
