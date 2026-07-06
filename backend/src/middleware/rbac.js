const { errorResponse } = require('../utils/response');

const officerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 'Not authorized', 401);
  }
  if (req.user.role !== 'officer' && req.user.role !== 'admin') {
    return errorResponse(res, 'Access denied. Officer or Admin role required.', 403);
  }
  if (req.user.status === 'suspended' || req.user.status === 'inactive') {
    return errorResponse(res, 'Account is suspended or inactive', 403);
  }
  next();
};

const adminOnly = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 'Not authorized', 401);
  }
  if (req.user.role !== 'admin') {
    return errorResponse(res, 'Access denied. Admin role required.', 403);
  }
  if (req.user.status === 'suspended' || req.user.status === 'inactive') {
    return errorResponse(res, 'Account is suspended or inactive', 403);
  }
  next();
};

module.exports = { officerOrAdmin, adminOnly };