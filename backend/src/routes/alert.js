const express = require('express');
const { getAlerts, createAlert, updateAlertStatus, deleteAlert } = require('../controllers/alertController');
const protect = require('../middleware/auth');
const { officerOrAdmin, adminOnly } = require('../middleware/rbac');

const router = express.Router();

router.get('/', getAlerts);
router.post('/', protect, createAlert);
router.patch('/:id', protect, officerOrAdmin, updateAlertStatus);
router.delete('/:id', protect, adminOnly, deleteAlert);

module.exports = router;
