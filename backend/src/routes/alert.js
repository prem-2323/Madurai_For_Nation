const express = require('express');
const { getAlerts, updateAlertStatus } = require('../controllers/alertController');
const protect = require('../middleware/auth');
const { officerOnly } = require('../middleware/rbac');

const router = express.Router();

router.get('/', getAlerts);
router.patch('/:id', protect, officerOnly, updateAlertStatus);
// Delete & create removed — alerts are auto-generated only

module.exports = router;
