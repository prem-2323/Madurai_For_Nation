const jwt = require('jsonwebtoken');
const User = require('../models/User');

const optionalAuth = async (req, _res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const userId = decoded.userId || decoded.id;
    if (userId) {
      req.user = await User.findById(userId).select('-password');
    }
  } catch (_error) {
    // Ignore invalid tokens for optional auth routes
  }

  next();
};

module.exports = optionalAuth;
