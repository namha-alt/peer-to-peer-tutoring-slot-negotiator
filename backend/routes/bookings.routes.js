const express = require('express');
const { createBooking, getMyBookings, updateBookingStatus, cancelBooking } = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

const bookingRoutes = express.Router();
// express.Router allows you to write routes
// outside of index.js file

bookingRoutes.post('/', protect, authorize('student'), createBooking);
bookingRoutes.get('/my', protect, getMyBookings);
bookingRoutes.patch('/:id/status', protect, authorize('tutor'), updateBookingStatus);
bookingRoutes.post('/:id/cancel', protect, cancelBooking);

module.exports = { bookingRoutes };