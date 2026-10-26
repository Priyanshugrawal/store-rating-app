const router = require('express').Router();
const c = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimit');
const v = require('../validators/auth.validators');

router.post('/register', authLimiter, validate(v.registerSchema), c.register);
router.post('/login', authLimiter, validate(v.loginSchema), c.login);
router.get('/me', authenticate, c.me);
router.patch('/change-password', authenticate, validate(v.changePasswordSchema), c.changePassword);

module.exports = router;
