const express = require('express');
const { getStats, getRecentReports } = require('../controllers/dashboardController');
const protect = require('../middleware/auth');

const router = express.Router();

router.get('/stats', protect, getStats);
router.get('/recent-reports', protect, getRecentReports);

module.exports = router;
