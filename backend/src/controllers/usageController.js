const { getUsage } = require('../services/usageService');
const { successResponse, errorResponse } = require('../utils/response');

exports.getGeminiUsage = async (req, res) => {
  try {
    const usage = await getUsage();
    successResponse(res, usage);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};
