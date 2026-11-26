const express = require('express');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');
const { createServiceSchema, updateServiceSchema } = require('../validations/service.validation');
const serviceController = require('../controllers/service.controller');

const router = express.Router();

router.use(authenticate); // semua endpoint katalog wajib login

router.get('/', serviceController.list);
router.get('/:id', serviceController.detail);
router.post('/', authorize('ADMIN'), validate(createServiceSchema), serviceController.create);
router.put('/:id', authorize('ADMIN'), validate(updateServiceSchema), serviceController.update);
router.delete('/:id', authorize('ADMIN'), serviceController.remove);

module.exports = router;