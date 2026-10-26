const router = require('express').Router();
const c = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const v = require('../validators/admin.validators');
const { idParam } = require('../validators/common');

router.use(authenticate, authorize('ADMIN'));

router.get('/dashboard', c.dashboard);
router.post('/users', validate(v.createUserSchema), c.createUser);
router.get('/users', validate(v.listUsersQuery, 'query'), c.listUsers);
router.get('/users/:id', validate(idParam, 'params'), c.getUser);
router.post('/stores', validate(v.createStoreSchema), c.createStore);
router.get('/stores', validate(v.listStoresQuery, 'query'), c.listStores);
router.get('/owners/available', c.availableOwners);

module.exports = router;
