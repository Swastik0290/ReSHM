const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public (in production, this should be admin-only)
router.post('/register', [
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'limited']).withMessage('Role must be admin or limited')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role, assignedRoom } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      role: role || 'limited',
      assignedRoom: role === 'admin' ? null : assignedRoom
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        verified: user.verified !== false,
        assignedRoom: user.assignedRoom
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user (supports email or username as identifier)
// @access  Public
router.post('/login', [
  body('email').notEmpty().withMessage('Email or username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email: identifier, password } = req.body;
    const isEmail = identifier.includes('@');

    // Find user by email or username
    const query = isEmail ? { email: identifier.toLowerCase() } : { username: identifier };
    const user = await User.findOne(query).populate('assignedRoom');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        verified: user.verified !== false,
        assignedRoom: user.assignedRoom
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    const message = process.env.NODE_ENV === 'development'
      ? `Server error: ${error.message}`
      : 'Server error during login';
    res.status(500).json({ message, ...(process.env.NODE_ENV === 'development' && { error: error.message }) });
  }
});

// @route   POST /api/auth/google
// @desc    Login or register with Google
// @access  Public
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }
    if (!googleClient) {
      return res.status(503).json({
        message: 'Google login is not configured. Set GOOGLE_CLIENT_ID in server .env'
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    let user = await User.findOne({ googleId }).populate('assignedRoom');
    if (!user) {
      user = await User.findOne({ email: email?.toLowerCase() }).populate('assignedRoom');
      if (user) {
        user.googleId = googleId;
        await user.save();
      }
    }
    if (!user) {
      const username = (name || email?.split('@')[0] || `user_${googleId.slice(-6)}`)
        .replace(/\s+/g, '_')
        .toLowerCase()
        .slice(0, 20);
      let uniqueUsername = username;
      let n = 0;
      while (await User.findOne({ username: uniqueUsername })) {
        uniqueUsername = `${username}${++n}`;
      }
      user = new User({
        username: uniqueUsername,
        email: email.toLowerCase(),
        googleId,
        role: 'limited',
        verified: false
      });
      await user.save();
      user = await User.findById(user._id).populate('assignedRoom');
    }

    const token = generateToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        verified: user.verified,
        assignedRoom: user.assignedRoom
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    const message = process.env.NODE_ENV === 'development'
      ? `Google login failed: ${error.message}`
      : 'Google login failed';
    res.status(500).json({ message, ...(process.env.NODE_ENV === 'development' && { error: error.message }) });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').populate('assignedRoom');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
