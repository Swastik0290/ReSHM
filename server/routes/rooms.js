const express = require('express');
const { body, validationResult } = require('express-validator');
const Room = require('../models/Room');
const { authenticate, isAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/rooms
// @desc    Get all rooms (admin) or assigned room (limited user)
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    let rooms;
    
    if (req.user.role === 'admin') {
      // Admin can see all rooms
      rooms = await Room.find().sort({ createdAt: -1 });
    } else {
      // Limited users can only see their assigned room
      if (!req.user.assignedRoom) {
        return res.json([]);
      }
      rooms = await Room.find({ _id: req.user.assignedRoom });
    }

    res.json(rooms);
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/rooms/:id
// @desc    Get a specific room
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check access
    if (req.user.role === 'limited' && req.user.assignedRoom?.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(room);
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/rooms
// @desc    Create a new room
// @access  Private (Admin only)
router.post('/', authenticate, isAdmin, [
  body('name').trim().notEmpty().withMessage('Room name is required'),
  body('location.latitude').isFloat().withMessage('Valid latitude is required'),
  body('location.longitude').isFloat().withMessage('Valid longitude is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, location, deviceId } = req.body;

    const room = new Room({
      name,
      description,
      location,
      deviceId
    });

    await room.save();

    res.status(201).json(room);
  } catch (error) {
    console.error('Create room error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Device ID already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/rooms/:id
// @desc    Update a room
// @access  Private (Admin only)
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { name, description, location, deviceId, isActive } = req.body;

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { name, description, location, deviceId, isActive },
      { new: true, runValidators: true }
    );

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/rooms/:id
// @desc    Delete a room
// @access  Private (Admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
