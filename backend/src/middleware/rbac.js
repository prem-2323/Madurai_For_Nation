const { errorResponse } = require('../utils/response');

const authorize = (allowedRole) => (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 'Not authorized', 401);
  }
  if (req.user.role !== allowedRole) {
    return errorResponse(res, 'Access denied. Insufficient permissions.', 403);
  }
  if (req.user.status === 'suspended' || req.user.status === 'inactive') {
    return errorResponse(res, 'Account is suspended or inactive', 403);
  }
  next();
};

const officerOnly = authorize('officer');
const citizenOnly = authorize('citizen');

module.exports = { officerOnly, citizenOnly, authorize };