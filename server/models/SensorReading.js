const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  location: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    }
  },
  altitude: {
    type: Number,
    default: null   // metres above sea level; optional
  },
  temperature: {
    type: Number,
    required: true,
    min: -50,
    max: 100
  },
  humidity: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  coSensor1: {
    type: Number,
    required: true,
    min: 0
  },
  coSensor2: {
    type: Number,
    required: true,
    min: 0
  },
  co2: {
    type: Number,
    required: true,
    min: 0
  },
  oxygen: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  pulse: {
    type: Number,
    required: true,
    min: 0,
    max: 300
  },
  smokeDetected: {
    type: Boolean,
    default: false,
    required: true
  },
  fireDetected: {
    type: Boolean,
    default: false,
    required: true
  },
  heat: {
    type: Boolean,
    default: false,
    required: true
  },
  alerts: {
    type: [String],
    default: []
  },
  source: {
    type: String,
    enum: ['Modem', 'LAN', 'Unknown', 'WIFI'],
    default: 'Unknown'
  }
}, {
  timestamps: true
});

// Index for efficient queries
sensorReadingSchema.index({ roomId: 1, timestamp: -1 });
sensorReadingSchema.index({ timestamp: -1 });

// Method to check thresholds and generate alerts
sensorReadingSchema.methods.checkThresholds = function () {
  const alerts = [];

  // Indian safety thresholds
  const thresholds = {
    coSensor1: { critical: 50, warning: 30 }, // ppm
    coSensor2: { critical: 50, warning: 30 }, // ppm
    co2: { critical: 1000, warning: 800 }, // ppm
    oxygen: { critical: 19.5, warning: 20.5 }, // percentage
    pulse: { criticalHigh: 120, warningHigh: 100, criticalLow: 40, warningLow: 50 }, // BPM
    temperature: { critical: 35, warning: 30 }, // Celsius
    humidity: { critical: 80, warning: 70 } // percentage
  };

  if (this.coSensor1 >= thresholds.coSensor1.critical) {
    alerts.push('CRITICAL: High CO in Sensor 1!');
  } else if (this.coSensor1 >= thresholds.coSensor1.warning) {
    alerts.push('WARNING: Elevated CO in Sensor 1');
  }

  if (this.coSensor2 >= thresholds.coSensor2.critical) {
    alerts.push('CRITICAL: High CO in Sensor 2!');
  } else if (this.coSensor2 >= thresholds.coSensor2.warning) {
    alerts.push('WARNING: Elevated CO in Sensor 2');
  }

  if (this.co2 >= thresholds.co2.critical) {
    alerts.push('CRITICAL: High CO₂ levels!');
  } else if (this.co2 >= thresholds.co2.warning) {
    alerts.push('WARNING: Elevated CO₂ levels');
  }

  if (this.oxygen <= thresholds.oxygen.critical) {
    alerts.push('CRITICAL: Low oxygen levels!');
  } else if (this.oxygen <= thresholds.oxygen.warning) {
    alerts.push('WARNING: Low oxygen levels');
  }

  if (this.pulse >= thresholds.pulse.criticalHigh) {
    alerts.push('CRITICAL: Extremely high heart rate!');
  } else if (this.pulse >= thresholds.pulse.warningHigh) {
    alerts.push('WARNING: Elevated heart rate');
  } else if (this.pulse <= thresholds.pulse.criticalLow) {
    alerts.push('CRITICAL: Extremely low heart rate!');
  } else if (this.pulse <= thresholds.pulse.warningLow) {
    alerts.push('WARNING: Low heart rate');
  }

  // Temperature alerts disabled
  // if (this.temperature >= thresholds.temperature.critical) {
  //   alerts.push('CRITICAL: High temperature!');
  // } else if (this.temperature >= thresholds.temperature.warning) {
  //   alerts.push('WARNING: Elevated temperature');
  // }

  if (this.humidity >= thresholds.humidity.critical) {
    alerts.push('CRITICAL: High humidity!');
  } else if (this.humidity >= thresholds.humidity.warning) {
    alerts.push('WARNING: Elevated humidity');
  }

  if (this.smokeDetected && this.heat) {
    alerts.push('CRITICAL: Fire detected!');
  } else if (this.smokeDetected) {
    alerts.push('CRITICAL: Smoke detected!');
  } else if (this.heat) {
    alerts.push('CRITICAL: Extreme heat detected!');
  }

  this.alerts = alerts;
  return alerts;
};

module.exports = mongoose.model('SensorReading', sensorReadingSchema);
