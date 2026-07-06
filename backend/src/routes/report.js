const express = require('express');
const { createReport, getReports, getReportById, updateReport, deleteReport } = require('../controllers/reportController');
const protect = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createReport);
router.get('/', protect, getReports);
router.get('/:id', protect, getReportById);
router.put('/:id', protect, updateReport);
router.delete('/:id', protect, deleteReport);

module.exports = router;
