const express = require('express');
const { createReport, getReports, getReportById, updateReport, deleteReport, updateReportStatus } = require('../controllers/reportController');
const protect = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const { officerOrAdmin, adminOnly } = require('../middleware/rbac');

const router = express.Router();

router.post('/', protect, createReport);
router.get('/', optionalAuth, getReports);
router.get('/:id', protect, getReportById);
router.put('/:id', protect, officerOrAdmin, updateReport);
router.delete('/:id', protect, adminOnly, deleteReport);
router.patch('/:id/status', protect, officerOrAdmin, updateReportStatus);

module.exports = router;
