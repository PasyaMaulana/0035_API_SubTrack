const express = require('express');
const { authenticate } = require('../middlewares/auth');
const dashboardController = require('../controllers/dashboard.controller');

const router = express.Router();

router.get('/', authenticate, dashboardController.getDashboard);

module.exports = router;