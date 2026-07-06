const { build24HourPrediction } = require('../services/predictionService');
const { successResponse, errorResponse } = require('../utils/response');

exports.getPrediction = async (req, res) => {
  try {
    const latitude = req.query.lat ? parseFloat(req.query.lat) : undefined;
    const longitude = req.query.lng ? parseFloat(req.query.lng) : undefined;

    const prediction = await build24HourPrediction({ latitude, longitude });

    successResponse(res, prediction, '24-hour prediction generated successfully');
  } catch (error) {
    errorResponse(res, error.message || 'Failed to generate prediction', 500);
  }
};