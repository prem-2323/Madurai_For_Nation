const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    console.log('📝 REGISTER: Received role from frontend:', role);
    
    // Validate role: only allow 'citizen' or 'officer'
    const allowedRole = (role === 'citizen' || role === 'officer') ? role : 'citizen';
    console.log('✓ REGISTER: Validated role as:', allowedRole);
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 'Email already registered', 400);
    }

    // Create user with the selected role
    const user = await User.create({ 
      name, 
      email, 
      password, 
      role: allowedRole  // Ensure role is saved correctly
    });
    console.log('✓ REGISTER: User created in DB with role:', user.role, '| User ID:', user._id);
    
    const token = user.generateAuthToken();
    
    // Return complete user object including role
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,  // Include role in response
      status: user.status,
      createdAt: user.createdAt
    };
    console.log('✓ REGISTER: Sending response with role:', userResponse.role);

    successResponse(res, { user: userResponse, token }, 'User registered successfully', 201);
  } catch (error) {
    console.error('❌ REGISTER ERROR:', error.message);
    errorResponse(res, error.message, 500);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 LOGIN: Attempting login for email:', email);

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    console.log('✓ LOGIN: User found with role:', user.role, '| User ID:', user._id);

    if (user.status === 'suspended') {
      return errorResponse(res, 'Account has been suspended. Contact administrator.', 403);
    }

    if (user.status === 'inactive') {
      return errorResponse(res, 'Account is inactive. Contact administrator.', 403);
    }

    const token = user.generateAuthToken();
    
    // Return complete user object including role
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,  // Include role in response
      status: user.status,
      createdAt: user.createdAt
    };
    
    console.log('✓ LOGIN: Sending response with role:', userResponse.role);

    successResponse(res, { user: userResponse, token }, 'Login successful');
  } catch (error) {
    console.error('❌ LOGIN ERROR:', error.message);
    errorResponse(res, error.message, 500);
  }
};

exports.getMe = async (req, res) => {
  try {
    // req.user is already populated by auth middleware
    // Return the authenticated user with all fields including role
    if (!req.user) {
      console.warn('⚠️ GETME: No user found in request context');
      return errorResponse(res, 'User not found', 401);
    }
    
    console.log('👤 GETME: Fetching profile for user ID:', req.user._id, '| Role in memory:', req.user.role);
    
    const userResponse = {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,  // Always include role
      status: req.user.status,
      createdAt: req.user.createdAt
    };
    
    console.log('✓ GETME: Returning user with role:', userResponse.role);
    
    successResponse(res, userResponse);
  } catch (error) {
    console.error('❌ GETME ERROR:', error.message);
    errorResponse(res, error.message, 500);
  }
};