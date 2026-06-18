const express = require('express');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

// Dashboard routes
router.get('/metrics', dashboardController.getDashboardMetrics);
router.get('/insights', dashboardController.getDashboardInsights);
router.get('/trends', dashboardController.getApplicationTrends);
router.get('/health', dashboardController.getSystemHealth);

module.exports = router;
