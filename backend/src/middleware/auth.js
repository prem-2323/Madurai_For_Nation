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
    console.log('[KEY] AUTH MIDDLEWARE: JWT decoded - userId:', decoded.userId, '| role in JWT:', decoded.role);
    
    // Use userId from JWT (or fallback to id for backward compatibility)
    const userId = decoded.userId || decoded.id;
    
    req.user = await User.findById(userId);
    console.log('[KEY] AUTH MIDDLEWARE: User fetched from DB - userId:', req.user?._id, '| role in DB:', req.user?.role);

    if (!req.user) {
      console.warn('[WARN] AUTH MIDDLEWARE: User not found in database for userId:', userId);
      return errorResponse(res, 'User not found', 401);
    }

    next();
  } catch (error) {
    console.error('[ERROR] AUTH MIDDLEWARE ERROR:', error.message);
    return errorResponse(res, 'Invalid token', 401);
  }
};

module.exports = protect;

