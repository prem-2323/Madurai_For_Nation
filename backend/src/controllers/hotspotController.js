const Hotspot = require('../models/Hotspot');
const { successResponse, errorResponse } = require('../utils/response');

exports.getHotspots = async (req, res) => {
  try {
    const hotspots = await Hotspot.find({ status: 'Active' }).sort({ createdAt: -1 });
    successResponse(res, hotspots);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

exports.updateHotspot = async (req, res) => {
  try {
    const { assignedTeam, status, location, recommendedAction } = req.body;
    const updateData = {};
    if (assignedTeam !== undefined) updateData.assignedTeam = assignedTeam;
    if (status !== undefined) updateData.status = status;
    if (location !== undefined) updateData.location = location;
    if (recommendedAction !== undefined) updateData.recommendedAction = recommendedAction;

    const hotspot = await Hotspot.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!hotspot) return errorResponse(res, 'Hotspot not found', 404);
    successResponse(res, hotspot, 'Hotspot updated successfully');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

exports.updateHotspotStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Active', 'In Progress', 'Resolved'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 'Invalid status value', 400);
    }

    const hotspot = await Hotspot.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!hotspot) return errorResponse(res, 'Hotspot not found', 404);
    successResponse(res, hotspot, 'Hotspot status updated successfully');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

exports.deleteHotspot = async (req, res) => {
  try {
    const hotspot = await Hotspot.findByIdAndDelete(req.params.id);
    if (!hotspot) return errorResponse(res, 'Hotspot not found', 404);
    successResponse(res, null, 'Hotspot deleted successfully');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};
