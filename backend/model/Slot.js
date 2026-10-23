const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  day: { type: String, required: true },
  date: { type: String, required: true },
  startHour: { type: Number, required: true },
  endHour: { type: Number, required: true },
  status: { type: String, default: 'available' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Slot', slotSchema);
