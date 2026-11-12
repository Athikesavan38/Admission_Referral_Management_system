'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });

const registerUser = async ({ name, email, password, role }) => {
  if (role === 'admin') {
    throw new AppError('Admin accounts cannot be self-registered.', 403);
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('Email already in use', 409);
  }

  const user = await User.create({ name, email, password, role });

  const token = signToken({ userId: user._id, role: user.role });

  return {
    token,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, referralId: user.referralId || null, credits: user.credits || 0 },
  };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid credentials', 401);
  }

  const token = signToken({ userId: user._id, role: user.role });

  return {
    token,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, referralId: user.referralId || null, credits: user.credits || 0 },
  };
};

// Admin-only login — rejects if account is not admin role
const loginAdmin = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid admin credentials', 401);
  }

  if (user.role !== 'admin') {
    throw new AppError('Access denied. This login is for administrators only.', 403);
  }

  const token = signToken({ userId: user._id, role: user.role });

  return {
    token,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, referralId: user.referralId || null, credits: user.credits || 0 },
  };
};

// User login — rejects if account IS admin (admins must use admin login)
const loginUserOnly = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid credentials', 401);
  }

  if (user.role === 'admin') {
    throw new AppError('Admin accounts must use the Admin Login tab.', 403);
  }

  const token = signToken({ userId: user._id, role: user.role });

  return {
    token,
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, referralId: user.referralId || null, credits: user.credits || 0 },
  };
};

module.exports = { registerUser, loginUser, loginAdmin, loginUserOnly };
