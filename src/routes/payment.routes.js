const express = require('express');
const validate = require('../middlewares/validate');
const { createPaymentSchema, updatePaymentSchema } = require('../validations/payment.validation');
const paymentController = require('../controllers/payment.controller');

// mergeParams supaya :subscriptionId dari route induk bisa dibaca di sini
const router = express.Router({ mergeParams: true });

router.get('/', paymentController.list);
router.get('/:id', paymentController.detail);
router.post('/', validate(createPaymentSchema), paymentController.create);
router.put('/:id', validate(updatePaymentSchema), paymentController.update);
router.delete('/:id', paymentController.remove);

module.exports = router;