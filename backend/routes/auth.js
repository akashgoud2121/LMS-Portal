const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { auth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');

const router = express.Router();

// Validate JWT_SECRET on module load
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'your_super_secret_jwt_key_change_this_in_production') {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL ERROR: JWT_SECRET must be set in production environment!');
    process.exit(1);
  } else {
    console.warn('WARNING: JWT_SECRET is not set or using default value. Please set a secure JWT_SECRET in your .env file.');
  }
}

// Generate JWT Token
const generateToken = (userId) => {
  const secret = JWT_SECRET || 'your_super_secret_jwt_key_change_this_in_production';
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
};

// @route   POST /api/auth/register/:role
// @desc    Register a new user (student or instructor only)
router.post('/register/:role', authLimiter, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role } = req.params;
    if (!['student', 'instructor', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Only student, instructor, or admin registration allowed.' });
    }

    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create user with pending approval status
    // Admins also need approval from master admin
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role,
      approvalStatus: 'pending', // All roles need approval
      isActive: true,
      isMasterAdmin: false // New registrations are never master admin
    });

    const approvalMessage = role === 'admin' 
      ? 'Registration successful! Your admin account is pending approval from the master admin.'
      : 'Registration successful! Your account is pending approval from admin.';

    res.status(201).json({
      message: approvalMessage,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        approvalStatus: user.approvalStatus
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user (works for all roles)
router.post('/login', authLimiter, [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(400).json({ message: 'Account is inactive. Please contact admin.' });
    }

    // Check approval status - Master admin and approved admins can always login
    // Regular admins also need approval, but master admin bypasses this check
    if (!user.isMasterAdmin && user.approvalStatus !== 'approved') {
      return res.status(403).json({ 
        message: user.approvalStatus === 'pending' 
          ? `Your ${user.role} account is pending approval from the master admin. Please wait for approval.` 
          : 'Your account has been rejected. Please contact admin.',
        approvalStatus: user.approvalStatus,
        rejectionReason: user.rejectionReason
      });
    }

    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        approvalStatus: user.approvalStatus,
        isMasterAdmin: user.isMasterAdmin || false
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        approvalStatus: user.approvalStatus,
        isActive: user.isActive,
        isMasterAdmin: user.isMasterAdmin || false
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
