const express = require('express');
const { getAvailableSlots, getMySlots, toggleSlot, deleteSlot } = require('../controllers/slotController');
const { protect, authorize } = require('../middleware/auth');

const slotRoutes = express.Router();
// express.Router allows you to write routes
// outside of index.js file

slotRoutes.get('/available', getAvailableSlots);
slotRoutes.get('/my', protect, authorize('tutor'), getMySlots);
slotRoutes.post('/toggle', protect, authorize('tutor'), toggleSlot);
slotRoutes.delete('/:id', protect, authorize('tutor'), deleteSlot);

module.exports = { slotRoutes };