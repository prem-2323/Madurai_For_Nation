const Report = require('../models/Report');
const { analyzeImage } = require('../services/geminiVision');
const { normalizeSeverity } = require('../utils/pollutionPrompt');
const { successResponse, errorResponse } = require('../utils/response');

exports.analyzePollution = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return errorResponse(res, 'Gemini API key is not configured', 500);
    }

    if (!req.file) {
      return errorResponse(res, 'Image file is required', 400);
    }

    const latitude = parseFloat(req.body.latitude);
    const longitude = parseFloat(req.body.longitude);
    const description = req.body.description?.trim() || '';

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return errorResponse(res, 'Valid latitude and longitude are required', 400);
    }

    const analysis = await analyzeImage(
      req.file.path,
      req.file.mimetype,
      description
    );

    const imagePath = `uploads/${req.file.filename}`;
    const locationLabel =
      req.body.location?.trim() ||
      `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;

    const report = await Report.create({
      reportedBy: req.user?.id || null,
      image: imagePath,
      images: [imagePath],
      category: analysis.pollutionType,
      description: description || analysis.reason || `AI-detected ${analysis.pollutionType}`,
      severity: normalizeSeverity(analysis.severity),
      confidence: analysis.confidence,
      healthRisk: analysis.healthRisk,
      recommendation: analysis.recommendation,
      location: locationLabel,
      latitude,
      longitude,
      pollutionDetected: analysis.pollutionDetected,
      reason: analysis.reason,
      estimatedPM25Impact: analysis.estimatedPM25Impact,
      estimatedPM10Impact: analysis.estimatedPM10Impact,
      emergencyLevel: analysis.emergencyLevel,
      needsMunicipalAction: analysis.needsMunicipalAction,
      possibleSource: analysis.possibleSource,
      priority: analysis.priority,
      status: 'pending'
    });

    successResponse(
      res,
      {
        analysis,
        report: {
          id: report._id,
          image: `/uploads/${req.file.filename}`,
          latitude,
          longitude,
          location: locationLabel,
          createdAt: report.createdAt
        }
      },
      'Image analyzed successfully',
      201
    );
  } catch (error) {
    console.error('Analyze error:', error.message);
    errorResponse(res, error.message || 'Failed to analyze image', 500);
  }
};
