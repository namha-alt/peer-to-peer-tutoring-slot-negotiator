const express = require('express');
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const authRoutes = express.Router();
// express.Router allows you to write routes
// outside of index.js file

authRoutes.post('/register', registerUser);
authRoutes.post('/login', loginUser);
authRoutes.get('/me', protect, getMe);

module.exports = { authRoutes };