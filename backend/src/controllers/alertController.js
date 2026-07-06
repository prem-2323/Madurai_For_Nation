const Alert = require('../models/Alert');
const { successResponse, errorResponse } = require('../utils/response');

exports.getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find().populate('reportId').sort({ createdAt: -1 });
    successResponse(res, alerts);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

exports.createAlert = async (req, res) => {
  try {
    const alert = await Alert.create(req.body);
    successResponse(res, alert, 'Alert created successfully', 201);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

exports.updateAlertStatus = async (req, res) => {
  try {
    const { status, assignedTeam } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (assignedTeam) updateData.assignedTeam = assignedTeam;

    const alert = await Alert.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!alert) return errorResponse(res, 'Alert not found', 404);
    successResponse(res, alert, 'Alert updated successfully');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

exports.deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    if (!alert) return errorResponse(res, 'Alert not found', 404);
    successResponse(res, null, 'Alert deleted successfully');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};
