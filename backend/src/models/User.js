'use strict';

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── Counter model for collision-free referral IDs ──────────────────────────────
const counterSchema = new mongoose.Schema({
  _id:  { type: String, required: true },
  seq:  { type: Number, default: 0 },
});
const Counter = mongoose.model('Counter', counterSchema);

/**
 * Generate a unique referral ID using an auto-incrementing counter.
 * Format: REF-YYYY-00042
 */
async function generateReferralId() {
  const year = new Date().getFullYear();
  try {
    const counter = await Counter.findByIdAndUpdate(
      'referralId',
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    return `REF-${year}-${String(counter.seq).padStart(5, '0')}`;
  } catch {
    // Fallback: timestamp-based ID (extremely unlikely collision)
    const ts = Date.now().toString(36);
    return `REF-${year}-${ts}`;
  }
}

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String, required: true,
      enum: ['admin', 'student_referrer', 'faculty', 'alumni', 'external_consultant'],
    },
    // Unique referral ID assigned on registration
    referralId: {
      type: String,
      unique: true,
      sparse: true,
    },
    // Credit system
    credits: { type: Number, default: 0 },
    totalReferrals: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Auto-generate referralId before saving (non-admin users only)
userSchema.pre('save', async function (next) {
  // Hash password if modified
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  // Assign referralId on first save for non-admin users
  if (this.isNew && this.role !== 'admin' && !this.referralId) {
    this.referralId = await generateReferralId();
  }
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

