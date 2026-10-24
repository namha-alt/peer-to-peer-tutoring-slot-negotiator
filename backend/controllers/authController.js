const jwt = require('jsonwebtoken');
const User = require('../model/User');

// Helper to sign JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'slotsync_secret_key', {
    expiresIn: '7d'
  });
};

// @desc    Register a new user (student or tutor)
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role, subjects, maxCapacity } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and role'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email is already registered'
      });
    }

    // Format tutor subjects
    let formattedSubjects = [];
    if (role === 'tutor') {
      if (Array.isArray(subjects) && subjects.length > 0) {
        formattedSubjects = subjects;
      } else if (typeof subjects === 'string' && subjects.trim()) {
        formattedSubjects = [subjects.trim()];
      } else {
        formattedSubjects = ['General'];
      }
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      subjects: formattedSubjects,
      maxCapacity: role === 'tutor' ? (Number(maxCapacity) || 1) : 1
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subjects: user.subjects,
        maxCapacity: user.maxCapacity,
        rating: user.rating
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subjects: user.subjects,
        maxCapacity: user.maxCapacity,
        rating: user.rating
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged in user profile
// @route   GET /api/auth/me
// @access  Private (Protected by JWT)
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subjects: user.subjects,
        maxCapacity: user.maxCapacity,
        rating: user.rating
      }
    });
  } catch (error) {
    next(error);
  }
};
