const express = require('express');
const protect = require('../middleware/auth');
const { officerOnly } = require('../middleware/rbac');
const Report = require('../models/Report');
const { successResponse, errorResponse } = require('../utils/response');

const router = express.Router();

router.get('/reports', protect, officerOnly, async (req, res) => {
  try {
    const { status, severity, location } = req.query;
    const query = {};
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (location) query.location = { $regex: location, $options: 'i' };

    const reports = await Report.find(query)
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });

    successResponse(res, reports);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
});

router.patch('/report/:id/status', protect, officerOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const report = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('reportedBy', 'name email');
    if (!report) return errorResponse(res, 'Report not found', 404);
    successResponse(res, report, 'Status updated');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
});

router.patch('/report/:id/priority', protect, officerOnly, async (req, res) => {
  try {
    const { priority } = req.body;
    const report = await Report.findByIdAndUpdate(req.params.id, { priority }, { new: true }).populate('reportedBy', 'name email');
    if (!report) return errorResponse(res, 'Report not found', 404);
    successResponse(res, report, 'Priority updated');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
});

router.patch('/report/:id/remarks', protect, officerOnly, async (req, res) => {
  try {
    const { officerRemarks } = req.body;
    const report = await Report.findByIdAndUpdate(req.params.id, { officerRemarks }, { new: true }).populate('reportedBy', 'name email');
    if (!report) return errorResponse(res, 'Report not found', 404);
    successResponse(res, report, 'Remarks updated');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
});

router.get('/dashboard', protect, officerOnly, async (req, res) => {
  try {
    const [total, pending, verified, inProgress, resolved, highPriority, criticalPriority, today] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: 'verified' }),
      Report.countDocuments({ status: 'in_progress' }),
      Report.countDocuments({ status: 'resolved' }),
      Report.countDocuments({ priority: { $regex: 'high', $options: 'i' } }),
      Report.countDocuments({ priority: { $regex: 'critical', $options: 'i' } }),
      Report.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
    ]);

    successResponse(res, { total, pending, verified, inProgress, resolved, highPriority, criticalPriority, today });
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
});

module.exports = router;
