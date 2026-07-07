const express = require('express');
const mongoose = require('mongoose');
const { createReport, getReports, getReportById, updateReport, deleteReport, updateReportStatus } = require('../controllers/reportController');
const protect = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const { officerOnly, citizenOnly, authorize } = require('../middleware/rbac');
const Report = require('../models/Report');

const router = express.Router();

router.post('/', protect, citizenOnly, createReport);
router.get('/my', protect, citizenOnly, getReports);
router.get('/', optionalAuth, getReports);

router.get('/:id/image', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid report ID' });
    }
    const report = await Report.findById(req.params.id).select('imageData imageMimeType');
    if (!report || !report.imageData) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }
    res.set('Content-Type', report.imageMimeType || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(report.imageData);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to serve image' });
  }
});

router.get('/:id', protect, getReportById);
router.put('/:id', protect, officerOnly, updateReport);
router.delete('/:id', protect, authorize('officer'), deleteReport);
router.patch('/:id/status', protect, officerOnly, updateReportStatus);

module.exports = router;
