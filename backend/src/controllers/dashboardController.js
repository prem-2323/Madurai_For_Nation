const Report = require('../models/Report');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

exports.getStats = async (req, res) => {
  try {
    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const inProgressReports = await Report.countDocuments({ status: 'in_progress' });
    const resolvedReports = await Report.countDocuments({ status: 'resolved' });
    const totalUsers = await User.countDocuments();

    const categoryStats = await Report.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const monthlyStats = await Report.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    successResponse(res, {
      totalReports,
      pendingReports,
      inProgressReports,
      resolvedReports,
      totalUsers,
      categoryStats,
      monthlyStats
    });
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

exports.getRecentReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);
    successResponse(res, reports);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};