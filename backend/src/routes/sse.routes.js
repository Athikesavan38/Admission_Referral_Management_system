'use strict';

const { Router } = require('express');
const jwt = require('jsonwebtoken');
const { addClient, removeClient } = require('../utils/sseManager');

const router = Router();

router.get('/events', (req, res) => {
  const token = req.query.token || (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const userId = String(decoded.userId);

  res.setHeader('Content-Type',      'text/event-stream');
  res.setHeader('Cache-Control',     'no-cache');
  res.setHeader('Connection',        'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Register with role so sseManager can target by role
  addClient(userId, decoded.role, res);

  res.write(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`);

  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch { clearInterval(heartbeat); }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeClient(userId);
  });
});

module.exports = router;
