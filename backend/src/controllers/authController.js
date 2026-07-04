const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 'Email already registered', 400);
    }

    const user = await User.create({ name, email, password, role });
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