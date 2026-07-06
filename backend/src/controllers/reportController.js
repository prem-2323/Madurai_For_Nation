const Report = require('../models/Report');
const { successResponse, errorResponse } = require('../utils/response');

exports.createReport = async (req, res) => {
  try {
    const report = await Report.create({
      ...req.body,
      reportedBy: req.user.id,
      images: req.files?.map(f => f.path) || []
    });
    successResponse(res, report, 'Report created successfully', 201);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

exports.getReports = async (req, res) => {
  try {
    const { status, category, page = 1, limit = 10, map } = req.query;
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;

    if (map === 'true') {
      const reports = await Report.find(query)
        .populate('reportedBy', 'name email')
        .sort({ createdAt: -1 })
        .select(
          '_id latitude longitude category severity AQI aqiLevel image createdAt status recommendation location description confidence healthRisk reportedBy'
        );

      const mapReports = reports
        .filter((r) => r.latitude && r.longitude)
        .map((r) => ({
          _id: r._id,
          latitude: r.latitude,
          longitude: r.longitude,
          category: r.category,
          severity: r.severity,
          aqi: r.AQI,
          aqiLevel: r.aqiLevel,
          image: r.image,
          createdAt: r.createdAt,
          status: r.status,
          recommendation: r.recommendation,
          location: r.location,
          description: r.description,
          confidence: r.confidence,
          healthRisk: r.healthRisk,
          reporter: r.reportedBy?.name || 'Anonymous',
        }));

      return successResponse(res, mapReports);
    }

    const reports = await Report.find(query)
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);
    successResponse(res, { reports, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate('reportedBy', 'name email');
    if (!report) return errorResponse(res, 'Report not found', 404);
    successResponse(res, report);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

exports.updateReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!report) return errorResponse(res, 'Report not found', 404);
    successResponse(res, report, 'Report updated successfully');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) return errorResponse(res, 'Report not found', 404);
    successResponse(res, null, 'Report deleted successfully');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};