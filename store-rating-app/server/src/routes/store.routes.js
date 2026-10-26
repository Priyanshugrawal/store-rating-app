const router = require('express').Router();
const c = require('../controllers/store.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const v = require('../validators/store.validators');
const { idParam } = require('../validators/common');

// Every member account can browse and rate. A member who owns a store is still a shopper elsewhere.
router.use(authenticate, authorize('USER', 'OWNER'));

router.get('/', validate(v.listStoresForUserQuery, 'query'), c.list);
router.get('/:id', validate(idParam, 'params'), c.get);
router.post('/:id/ratings', validate(idParam, 'params'), validate(v.ratingBody), c.submitRating);
router.patch('/:id/ratings', validate(idParam, 'params'), validate(v.ratingBody), c.updateRating);

module.exports = router;
