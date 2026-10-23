const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  day: { type: String, required: true },
  date: { type: String, required: true },
  startHour: { type: Number, required: true },
  endHour: { type: Number, required: true },
  topic: { type: String, default: 'General Tutoring' },
  specifics: { type: String, default: '' },
  attachmentUrl: { type: String, default: '' },
  attachmentOriginalName: { type: String, default: '' },
  status: { type: String, default: 'pending' }, // pending, confirmed, rejected, cancelled
  cancelledBy: { type: String, default: null },
  cancelReason: { type: String, default: '' },
  requestedAt: { type: Date, default: Date.now },
  confirmedAt: { type: Date },
  rejectedAt: { type: Date },
  cancelledAt: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
