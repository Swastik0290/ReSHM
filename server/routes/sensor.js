const express = require('express');
const { body, validationResult, query } = require('express-validator');
const SensorReading = require('../models/SensorReading');
const Room = require('../models/Room');
const { authenticate, checkRoomAccess } = require('../middleware/auth');

const router = express.Router();

// Defaults for optional fields when device sends only GPS (e.g. phone as sensor)
const INGEST_DEFAULTS = {
  temperature: 22,
  humidity: 50,
  coSensor1: 0,
  coSensor2: 0,
  co2: 400,
  oxygen: 21,
  pulse: 72,
  smokeDetected: false,
  fireDetected: false,
  heat: false,
  altitude: null
};

// Global array to hold connected SSE clients
let sseClients = [];

// @route   GET /api/sensor/stream/:roomId
// @desc    SSE endpoint for real-time sensor updates for a room
// @access  Public (should be private in prod)
router.get('/stream/:roomId', (req, res) => {
  const { roomId } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Add this client to the global clients array
  const client = { id: Date.now(), roomId, res };
  sseClients.push(client);

  // Send an initial connected event
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  req.on('close', () => {
    // Remove client when connection is closed
    sseClients = sseClients.filter(c => c.id !== client.id);
  });
});

// Helper function to broadcast new reading
const broadcastReading = (roomId, reading) => {
  sseClients.forEach(client => {
    if (client.roomId === roomId.toString()) {
      client.res.write(`data: ${JSON.stringify(reading)}\n\n`);
    }
  });
};

// @route   POST /api/sensor/ingest
// @desc    Ingest reading by deviceId (LAN/4G). Accepts latitude, longitude + optional sensors. For phone-as-device.
// @access  Public
router.post('/ingest', [
  body('deviceId').notEmpty().trim().withMessage('deviceId is required'),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
  body('location.latitude').optional().isFloat({ min: -90, max: 90 }),
  body('location.longitude').optional().isFloat({ min: -180, max: 180 }),
  body('temperature').optional().isFloat(),
  body('humidity').optional().isFloat(),
  body('coSensor1').optional().isFloat(),
  body('coSensor2').optional().isFloat(),
  body('co2').optional().isFloat(),
  body('oxygen').optional().isFloat(),
  body('pulse').optional().isFloat(),
  body('smokeDetected').optional().isBoolean(),
  body('fireDetected').optional().isBoolean(),
  body('heat').optional().isBoolean(),
  body('altitude').optional().isFloat(),
  body('source').optional().isIn(['Modem', 'LAN', 'Unknown', 'WIFI'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { deviceId } = req.body;
    const lat = req.body.latitude ?? req.body.location?.latitude;
    const lon = req.body.longitude ?? req.body.location?.longitude;
    if (lat == null || lon == null || isNaN(parseFloat(lat)) || isNaN(parseFloat(lon))) {
      return res.status(400).json({ message: 'latitude and longitude (or location.latitude/longitude) are required' });
    }
    const location = { latitude: parseFloat(lat), longitude: parseFloat(lon) };

    const room = await Room.findOne({ deviceId: deviceId.trim() });
    if (!room) {
      return res.status(404).json({ message: 'Room not found for this deviceId. Add the device in Devices and set Device ID.' });
    }

    const payload = {
      roomId: room._id,
      location,
      temperature: req.body.temperature != null ? parseFloat(req.body.temperature) : INGEST_DEFAULTS.temperature,
      humidity: req.body.humidity != null ? parseFloat(req.body.humidity) : INGEST_DEFAULTS.humidity,
      coSensor1: req.body.coSensor1 != null ? parseFloat(req.body.coSensor1) : INGEST_DEFAULTS.coSensor1,
      coSensor2: req.body.coSensor2 != null ? parseFloat(req.body.coSensor2) : INGEST_DEFAULTS.coSensor2,
      co2: req.body.co2 != null ? parseFloat(req.body.co2) : INGEST_DEFAULTS.co2,
      oxygen: req.body.oxygen != null ? parseFloat(req.body.oxygen) : INGEST_DEFAULTS.oxygen,
      pulse: req.body.pulse != null ? parseFloat(req.body.pulse) : INGEST_DEFAULTS.pulse,
      smokeDetected: req.body.smokeDetected === true,
      fireDetected: req.body.fireDetected === true,
      heat: req.body.heat === true,
      altitude: req.body.altitude != null ? parseFloat(req.body.altitude) : INGEST_DEFAULTS.altitude,
      source: req.body.source || 'Unknown',
      timestamp: new Date()
    };

    const reading = new SensorReading(payload);
    reading.checkThresholds();
    await reading.save();

    // Populate the roomId so we can access its name/location below if needed
    await reading.populate('roomId', 'name location');

    // Broadcast the new reading to SSE clients
    broadcastReading(room._id, reading);

    res.status(201).json({
      message: 'Reading saved',
      reading: { timestamp: reading.timestamp, location: reading.location }
    });
  } catch (error) {
    console.error('Ingest error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/sensor/reading
// @desc    Create a new sensor reading
// @access  Public (for sensor devices) - In production, add device authentication
router.post('/reading', [
  body('roomId').notEmpty().withMessage('Room ID is required'),
  body('location.latitude').isFloat().withMessage('Valid latitude is required'),
  body('location.longitude').isFloat().withMessage('Valid longitude is required'),
  body('temperature').isFloat().withMessage('Temperature is required'),
  body('humidity').isFloat().withMessage('Humidity is required'),
  body('coSensor1').isFloat().withMessage('CO Sensor 1 reading is required'),
  body('coSensor2').isFloat().withMessage('CO Sensor 2 reading is required'),
  body('co2').isFloat().withMessage('CO₂ reading is required'),
  body('oxygen').isFloat().withMessage('Oxygen reading is required'),
  body('pulse').isFloat().withMessage('Pulse reading is required'),
  body('smokeDetected').isBoolean().withMessage('Smoke detection status is required'),
  body('fireDetected').isBoolean().withMessage('Fire detection status is required'),
  body('heat').isBoolean().withMessage('Heat status is required'),
  body('altitude').optional().isFloat(),
  body('source').optional().isIn(['Modem', 'LAN', 'Unknown', 'WIFI'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      roomId,
      location,
      temperature,
      humidity,
      coSensor1,
      coSensor2,
      co2,
      oxygen,
      pulse,
      smokeDetected,
      fireDetected,
      heat,
      altitude,
      source
    } = req.body;

    // Verify room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Create sensor reading
    const reading = new SensorReading({
      roomId,
      location,
      temperature,
      humidity,
      coSensor1,
      coSensor2,
      co2,
      oxygen,
      pulse,
      smokeDetected,
      fireDetected,
      heat,
      altitude,
      source: source || 'Unknown',
      timestamp: new Date()
    });

    // Check thresholds and generate alerts
    reading.checkThresholds();

    await reading.save();

    // Populate the roomId before broadcast
    await reading.populate('roomId', 'name location');

    // Broadcast the new reading to SSE clients
    broadcastReading(roomId, reading);

    res.status(201).json({
      message: 'Sensor reading saved successfully',
      reading
    });
  } catch (error) {
    console.error('Sensor reading error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/sensor/readings/:roomId
// @desc    Get sensor readings for a specific room
// @access  Private
router.get('/readings/:roomId', authenticate, checkRoomAccess, [
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
  query('skip').optional().isInt({ min: 0 }).withMessage('Skip must be a non-negative integer'),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid ISO date'),
  query('endDate').optional().isISO8601().withMessage('End date must be a valid ISO date')
], async (req, res) => {
  try {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const skip = parseInt(req.query.skip) || 0;
    let startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    let endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    if (endDate && req.query.endDate && req.query.endDate.length <= 10) {
      endDate.setHours(23, 59, 59, 999);
    }

    const query = { roomId };
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }

    const readings = await SensorReading.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .populate('roomId', 'name location');

    const total = await SensorReading.countDocuments(query);

    res.json({
      readings,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total
      }
    });
  } catch (error) {
    console.error('Get readings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/sensor/latest/:roomId
// @desc    Get latest sensor reading for a room
// @access  Private
router.get('/latest/:roomId', authenticate, checkRoomAccess, async (req, res) => {
  try {
    const { roomId } = req.params;

    const reading = await SensorReading.findOne({ roomId })
      .sort({ timestamp: -1 })
      .populate('roomId', 'name location');

    if (!reading) {
      return res.status(404).json({ message: 'No readings found for this room' });
    }

    res.json(reading);
  } catch (error) {
    console.error('Get latest reading error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/sensor/trends/:roomId
// @desc    Get time-series trend data for charts. period=today|yesterday|week|all
// @access  Private
router.get('/trends/:roomId', authenticate, checkRoomAccess, async (req, res) => {
  try {
    const { roomId } = req.params;
    const period = req.query.period || 'today';

    const now = new Date();
    let startDate, endDate;

    if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endDate = now;
    } else if (period === 'yesterday') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      startDate = new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 0, 0, 0, 0);
      endDate = new Date(yest.getFullYear(), yest.getMonth(), yest.getDate(), 23, 59, 59, 999);
    } else if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = now;
    } else {
      // 'all' — last 30 days max to keep response reasonable
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      endDate = now;
    }

    const readings = await SensorReading.find({
      roomId,
      timestamp: { $gte: startDate, $lte: endDate }
    })
      .sort({ timestamp: 1 })   // oldest → newest for chart left→right ordering
      .select('timestamp temperature humidity')
      .limit(500);

    // Compute real stats from the data (not sent separately, client calculates)
    res.json({
      period,
      startDate,
      endDate,
      count: readings.length,
      readings
    });
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/sensor/alerts/:roomId
// @desc    Get recent alerts for a room
// @access  Private
router.get('/alerts/:roomId', authenticate, checkRoomAccess, async (req, res) => {
  try {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const readings = await SensorReading.find({
      roomId,
      alerts: { $exists: true, $ne: [] }
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .select('timestamp alerts temperature humidity coSensor1 coSensor2 co2 oxygen pulse smokeDetected fireDetected heat');

    res.json(readings);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/sensor/dashboard/:roomId
// @desc    Get dashboard data for a room (latest reading + stats). Returns empty when no readings.
// @access  Private
router.get('/dashboard/:roomId', authenticate, checkRoomAccess, async (req, res) => {
  try {
    const { roomId } = req.params;

    const latestReading = await SensorReading.findOne({ roomId })
      .sort({ timestamp: -1 })
      .populate('roomId', 'name location');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentReadings = await SensorReading.find({
      roomId,
      timestamp: { $gte: sevenDaysAgo }
    })
      .sort({ timestamp: 1 })
      .select('timestamp temperature humidity coSensor1 coSensor2 co2 oxygen pulse smokeDetected fireDetected heat altitude')
      .limit(1000);

    res.json({
      latest: latestReading,
      trends: recentReadings || []
    });
  } catch (error) {
    console.error('Get dashboard data error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
