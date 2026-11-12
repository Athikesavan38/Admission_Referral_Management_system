'use strict';

const mongoose = require('mongoose');

const auditTrailSchema = new mongoose.Schema(
  {
    action:         { type: String },
    performedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    previousStatus: { type: String },
    newStatus:      { type: String },
    timestamp:      { type: Date, default: Date.now },
  },
  { _id: false }
);

const referralSchema = new mongoose.Schema({
  aadhaar: {
    type: String, required: true, unique: true,
    match: /^\d{12}$/, immutable: true,
  },
  studentName: { type: String, required: true, trim: true },

  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true,
  },

  contactDetails: {
    phone: { type: String, required: true, match: /^\d{10}$/ },
    email: { type: String, required: true, lowercase: true, trim: true },
    parentsPhone: { type: String, default: null, match: /^\d{10}$/ },
  },

  // New fields
  institution:   { type: String, required: true, trim: true },
  marks10:       { type: String, required: true, trim: true },   // percentage or grade
  marks12:       { type: String, required: true, trim: true },   // percentage or grade
  cutoffMark:    { type: String, default: null, trim: true },    // cutoff mark (optional)
  address:       { type: String, required: true, trim: true },
  country:       { type: String, required: true, trim: true },
  state:         { type: String, required: true, trim: true },
  city:          { type: String, required: true, trim: true },

  course: { type: String, required: true, trim: true },

  // File uploads
  photo: { type: String, default: null },          // relative path to profile photo
  documents: [{ type: String }],                   // array of relative paths to uploaded docs

  referredBy: {
    type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true,
  },
  timestamp: { type: Date, default: Date.now, immutable: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  remarks: { type: String, default: null, trim: true }, // rejection/approval remarks by admin
  auditTrail: [auditTrailSchema],
});

referralSchema.index({ referredBy: 1 });
referralSchema.index({ status: 1 });
referralSchema.index({ timestamp: -1 });

module.exports = mongoose.model('Referral', referralSchema);
