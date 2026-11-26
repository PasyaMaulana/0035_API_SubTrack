const express = require('express');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { createSubscriptionSchema, updateSubscriptionSchema } = require('../validations/subscription.validation');
const subscriptionController = require('../controllers/subscription.controller');

const router = express.Router();

router.use(authenticate); // setiap user hanya mengelola langganannya sendiri

router.get('/', subscriptionController.list);
router.get('/:id', subscriptionController.detail);
router.post('/', validate(createSubscriptionSchema), subscriptionController.create);
router.put('/:id', validate(updateSubscriptionSchema), subscriptionController.update);
router.delete('/:id', subscriptionController.remove);

module.exports = router;