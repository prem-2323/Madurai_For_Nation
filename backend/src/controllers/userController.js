const User = require('../models/User');
const Report = require('../models/Report');
const Alert = require('../models/Alert');
const { successResponse, errorResponse } = require('../utils/response');

exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query;
    const query = {};

    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    successResponse(res, { users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return errorResponse(res, 'User not found', 404);
    successResponse(res, user);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, status } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!user) return errorResponse(res, 'User not found', 404);
    successResponse(res, user, 'User updated successfully');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return errorResponse(res, 'User not found', 404);
    successResponse(res, null, 'User deleted successfully');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

exports.getAdminAnalytics = async (req, res) => {
  try {
    const totalCitizens = await User.countDocuments({ role: 'citizen' });
    const totalOfficers = await User.countDocuments({ role: 'officer' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalReports = await Report.countDocuments();
    const resolvedReports = await Report.countDocuments({ status: 'resolved' });
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const inProgressReports = await Report.countDocuments({ status: 'in_progress' });
    const activeAlerts = await Alert.countDocuments({ status: { $ne: 'Resolved' } });
    const totalAlerts = await Alert.countDocuments();

    const reportsThisWeek = await Report.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    const avgAqiResult = await Report.aggregate([
      { $match: { AQI: { $ne: null } } },
      { $group: { _id: null, avgAQI: { $avg: '$AQI' } } }
    ]);
    const averageAQI = avgAqiResult.length > 0 ? Math.round(avgAqiResult[0].avgAQI * 10) / 10 : 0;

    const topCategoryResult = await Report.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    const topCategory = topCategoryResult.length > 0 ? topCategoryResult[0]._id : 'N/A';

    const categoryStats = await Report.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
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

    const severityStats = await Report.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    const statusStats = await Report.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    successResponse(res, {
      users: { totalCitizens, totalOfficers, totalAdmins },
      reports: { totalReports, resolvedReports, pendingReports, inProgressReports },
      alerts: { activeAlerts, totalAlerts },
      reportsThisWeek,
      averageAQI,
      topCategory,
      categoryStats,
      monthlyStats,
      severityStats,
      statusStats
    });
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};