const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse } = require('../utils/response');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return errorResponse(res, 'Not authorized', 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return errorResponse(res, 'User not found', 401);
    }

    next();
  } catch (error) {
    return errorResponse(res, 'Invalid token', 401);
  }
};

module.exports = protect;
