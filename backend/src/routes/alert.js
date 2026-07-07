const express = require('express');
const { getAlerts, createAlert, updateAlertStatus, deleteAlert } = require('../controllers/alertController');
const protect = require('../middleware/auth');
const { officerOnly, authorize } = require('../middleware/rbac');

const router = express.Router();

router.get('/', getAlerts);
router.post('/', protect, createAlert);
router.patch('/:id', protect, officerOnly, updateAlertStatus);
router.delete('/:id', protect, authorize('officer'), deleteAlert);

module.exports = router;
