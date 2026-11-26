const express = require('express');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { createGroupSchema, updateGroupSchema } = require('../validations/group.validation');
const groupController = require('../controllers/group.controller');

const router = express.Router();

router.use(authenticate); // setiap user hanya mengelola grup miliknya

router.get('/', groupController.list);
router.get('/:id', groupController.detail);
router.post('/', validate(createGroupSchema), groupController.create);
router.put('/:id', validate(updateGroupSchema), groupController.update);
router.delete('/:id', groupController.remove);

module.exports = router;