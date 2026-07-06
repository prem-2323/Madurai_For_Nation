const express = require('express');
const { getAlerts, createAlert, updateAlertStatus } = require('../controllers/alertController');
const protect = require('../middleware/auth');

const router = express.Router();

router.get('/', getAlerts);
router.post('/', protect, createAlert);
router.patch('/:id', protect, updateAlertStatus);

module.exports = router;
