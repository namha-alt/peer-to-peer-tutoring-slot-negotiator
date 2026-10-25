const express = require('express');
const { getTutors, updateTutorCapacity, getUserStats } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const userRoutes = express.Router();
// express.Router allows you to write routes
// outside of index.js file

userRoutes.get('/tutors', getTutors);
userRoutes.put('/tutor/capacity', protect, authorize('tutor'), updateTutorCapacity);
userRoutes.get('/stats', protect, getUserStats);

module.exports = { userRoutes };