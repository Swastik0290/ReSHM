const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Middleware to check room access (admin can access all, limited users only their assigned room)
const checkRoomAccess = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    
    // Admin can access all rooms
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Limited users can only access their assigned room
    if (req.user.role === 'limited') {
      if (!req.user.assignedRoom || req.user.assignedRoom.toString() !== roomId) {
        return res.status(403).json({ message: 'Access denied. You do not have access to this room.' });
      }
    }
    
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking room access', error: error.message });
  }
};

module.exports = { authenticate, isAdmin, checkRoomAccess };
