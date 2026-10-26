const router = require('express').Router();

router.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok' } }));
router.use('/auth', require('./auth.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/stores', require('./store.routes'));
router.use('/owner', require('./owner.routes'));

module.exports = router;
