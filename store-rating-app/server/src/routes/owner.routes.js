const router = require('express').Router();
const c = require('../controllers/owner.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const v = require('../validators/owner.validators');

// "My store" area for every member account. A member without a store can create one here.
router.use(authenticate, authorize('USER', 'OWNER'));

router.get('/dashboard', c.dashboard);
router.get('/ratings', validate(v.ownerRatingsQuery, 'query'), c.ratings);
router.post('/store', validate(v.createOwnStoreSchema), c.createStore);

module.exports = router;
