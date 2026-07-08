const express = require('express');
const protect = require('../middleware/auth');
const { officerOnly } = require('../middleware/rbac');
const Report = require('../models/Report');
const Hotspot = require('../models/Hotspot');
const { successResponse, errorResponse } = require('../utils/response');

const router = express.Router();

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

router.get('/report/:id', protect, officerOnly, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate('reportedBy', 'name email');
    if (!report) return errorResponse(res, 'Report not found', 404);
    successResponse(res, report);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
});

router.patch('/report/:id/status', protect, officerOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status, $push: { reviewHistory: { officer: req.user._id, action: 'status', value: status, reviewedAt: new Date() } } },
      { new: true }
    ).populate('reportedBy', 'name email');
    if (!report) return errorResponse(res, 'Report not found', 404);
    successResponse(res, report, 'Status updated');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
});

router.patch('/report/:id/priority', protect, officerOnly, async (req, res) => {
  try {
    const { priority } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { priority, $push: { reviewHistory: { officer: req.user._id, action: 'priority', value: priority, reviewedAt: new Date() } } },
      { new: true }
    ).populate('reportedBy', 'name email');
    if (!report) return errorResponse(res, 'Report not found', 404);
    successResponse(res, report, 'Priority updated');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
});

router.patch('/report/:id/remarks', protect, officerOnly, async (req, res) => {
  try {
    const { officerRemarks } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { officerRemarks, $push: { reviewHistory: { officer: req.user._id, action: 'remarks', value: officerRemarks, reviewedAt: new Date() } } },
      { new: true }
    ).populate('reportedBy', 'name email');
    if (!report) return errorResponse(res, 'Report not found', 404);
    successResponse(res, report, 'Remarks updated');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
});

router.get('/hotspots', protect, officerOnly, async (req, res) => {
  try {
    const { generateHotspots } = require('../services/hotspotEngine');
    await generateHotspots();
    const hotspots = await Hotspot.find().sort({ createdAt: -1 });
    successResponse(res, hotspots);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
});

router.get('/profile', protect, officerOnly, async (req, res) => {
  try {
    const reportsReviewed = await Report.countDocuments({ 'reviewHistory.officer': req.user._id });
    successResponse(res, {
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      department: req.user.department || 'Environmental Monitoring',
      createdAt: req.user.createdAt,
      reportsReviewed
    });
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
});

router.get('/analytics', protect, officerOnly, async (req, res) => {
  try {
    const totalReports = await Report.countDocuments();
    const resolvedReports = await Report.countDocuments({ status: 'resolved' });
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const inProgressReports = await Report.countDocuments({ status: 'in_progress' });
    const activeAlerts = await require('../models/Alert').countDocuments({ status: { $ne: 'Resolved' } });

    const reportsThisWeek = await Report.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    const avgAqiResult = await Report.aggregate([
      { $match: { AQI: { $ne: null } } },
      { $group: { _id: null, avgAQI: { $avg: '$AQI' } } }
    ]);
    const averageAQI = avgAqiResult.length > 0 ? Math.round(avgAqiResult[0].avgAQI * 10) / 10 : 0;

    const categoryStats = await Report.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const reportsPerDay = await Report.aggregate([
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const aqiTrend = await Report.aggregate([
      { $match: { AQI: { $ne: null } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, avgAQI: { $avg: '$AQI' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const severityStats = await Report.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    const statusStats = await Report.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const topPollutedAreas = await Report.aggregate([
      { $match: { location: { $ne: '', $exists: true } } },
      { $group: { _id: '$location', count: { $sum: 1 }, avgAQI: { $avg: '$AQI' } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    successResponse(res, {
      reports: { totalReports, resolvedReports, pendingReports, inProgressReports },
      alerts: { activeAlerts },
      reportsThisWeek,
      averageAQI,
      categoryStats,
      reportsPerDay,
      aqiTrend,
      severityStats,
      statusStats,
      topPollutedAreas
    });
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
});

router.get('/fix-report-coords', protect, officerOnly, async (req, res) => {
  try {
    const MADURAI_LAT = 9.9252;
    const MADURAI_LNG = 78.1198;
    const MADURAI_LOC = 'Meenakshi Amman Temple Area, Madurai';

    const result = await Report.updateMany(
      {
        $or: [
          { latitude: { $lt: 8 } },
          { latitude: { $gt: 11 } },
          { longitude: { $lt: 77 } },
          { longitude: { $gt: 79 } },
        ],
      },
      {
        $set: {
          latitude: MADURAI_LAT,
          longitude: MADURAI_LNG,
          location: MADURAI_LOC,
        },
      }
    );

    // Regenerate hotspots after fixing coordinates
    const { generateHotspots } = require('../services/hotspotEngine');
    await generateHotspots();

    successResponse(res, {
      modifiedCount: result.modifiedCount,
      message: `Fixed ${result.modifiedCount} report(s) with Madurai coordinates`,
    });
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
});

module.exports = router;
