const rateLimit = require('express-rate-limit');
const { isTest } = require('../config/env');

// Limits brute-force attempts on login / register. Disabled while running automated tests.
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTest,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
});
