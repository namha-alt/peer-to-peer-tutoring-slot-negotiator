const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route Imports
const { authRoutes } = require('./routes/auth.routes');
const { slotRoutes } = require('./routes/slots.routes');
const { bookingRoutes } = require('./routes/bookings.routes');
const { userRoutes } = require('./routes/users.routes');
const { getHealth } = require('./controllers/systemController');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Serve Frontend Static Files (Fixes "Cannot GET /" in browser)
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.get('/api/system/health', getHealth);

// Centralized Error Handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});

module.exports = app;