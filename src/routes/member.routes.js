const express = require('express');
const validate = require('../middlewares/validate');
const { createMemberSchema, updateMemberSchema } = require('../validations/member.validation');
const memberController = require('../controllers/member.controller');

// mergeParams supaya :groupId dari route induk bisa dibaca di sini
const router = express.Router({ mergeParams: true });

router.get('/', memberController.list);
router.get('/:id', memberController.detail);
router.post('/', validate(createMemberSchema), memberController.create);
router.put('/:id', validate(updateMemberSchema), memberController.update);
router.delete('/:id', memberController.remove);

module.exports = router;