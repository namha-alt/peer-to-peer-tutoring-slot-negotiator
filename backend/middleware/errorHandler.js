// Centralized Error Handling Middleware (Topic 39)
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error stack for developer
  console.error('\x1b[31m[ERROR HANDLER]\x1b[0m', err.name || 'Error:', err.message);

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid ID format: ${err.value}`;
    return res.status(404).json({ success: false, errorType: 'CastError', message });
  }

  // Mongoose Duplicate Key (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for ${field}. Please use another value.`;
    return res.status(400).json({ success: false, errorType: 'DuplicateKeyError', message });
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val) => val.message).join(', ');
    return res.status(400).json({ success: false, errorType: 'ValidationError', message });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, errorType: 'AuthError', message: 'Invalid token. Authorization denied.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, errorType: 'AuthError', message: 'Token has expired. Please log in again.' });
  }

  // Fallback 500 Server Error
  res.status(err.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error'
  });
};

module.exports = errorHandler;
