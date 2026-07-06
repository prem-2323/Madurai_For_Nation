const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    const allowedRole = role === 'officer' || role === 'admin' ? 'citizen' : (role || 'citizen');
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 'Email already registered', 400);
    }

    const user = await User.create({ name, email, password, role: allowedRole });
    const token = user.generateAuthToken();

    successResponse(res, { user, token }, 'User registered successfully', 201);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    if (user.status === 'suspended') {
      return errorResponse(res, 'Account has been suspended. Contact administrator.', 403);
    }

    if (user.status === 'inactive') {
      return errorResponse(res, 'Account is inactive. Contact administrator.', 403);
    }

    const token = user.generateAuthToken();
    successResponse(res, { user, token }, 'Login successful');
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    successResponse(res, user);
  } catch (error) {
    errorResponse(res, error.message, 500);
  }
};