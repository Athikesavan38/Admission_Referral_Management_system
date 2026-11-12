'use strict';

const path    = require('path');
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes     = require('./routes/auth.routes');
const referralRoutes = require('./routes/referral.routes');
const sseRoutes      = require('./routes/sse.routes');
const aiRoutes       = require('./routes/ai.routes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Security headers (relax CSP for uploaded images served locally)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS — allow frontend origin
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// JSON body parser with explicit size limit
app.use(express.json({ limit: '1mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,                   // 15 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

// Route mounts with rate limiting
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/referrals', apiLimiter, referralRoutes);
app.use('/api', sseRoutes);
app.use('/api/ai', apiLimiter, aiRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

module.exports = app;

