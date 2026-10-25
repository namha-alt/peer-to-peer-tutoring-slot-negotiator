const mongoose = require('mongoose');
const User = require('../model/User');
const Slot = require('../model/Slot');
const Booking = require('../model/Booking');

// @desc    System health & database status
// @route   GET /api/system/health
// @access  Public
exports.getHealth = (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];

  res.status(200).json({
    success: true,
    status: 'ONLINE',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      type: 'MongoDB',
      host: mongoose.connection.host || 'localhost',
      name: mongoose.connection.name || 'slotsync_db',
      state: states[dbState] || 'Unknown'
    }
  });
};
