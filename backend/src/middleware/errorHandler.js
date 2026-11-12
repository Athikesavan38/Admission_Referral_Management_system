'use strict';

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate key error', details: err.keyValue });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Validation failed', details });
  }

  // Custom operational AppError
  if (err.isOperational) {
    return res.status(err.statusCode).json({ error: err.message, details: err.details || [] });
  }

  // Unexpected error — log stack, don't expose internals
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
};

module.exports = { errorHandler };
