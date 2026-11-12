'use strict';

const Referral = require('../models/Referral');

// In-memory OTP store (use Redis in production)
const otpStore = new Map(); // key: aadhaar → { otp, expiresAt, verified }

// ── Aadhaar format validation ──────────────────────────────────────────────────

/**
 * Validates Aadhaar number format.
 * Rules:
 * - Exactly 12 digits
 * - Cannot start with 0 or 1 (UIDAI rule)
 * - Cannot be all same digits (e.g. 111111111111)
 * - Passes Verhoeff checksum algorithm
 */
function validateAadhaarFormat(aadhaar) {
  const errors = [];

  if (!aadhaar) {
    return { valid: false, errors: ['Aadhaar number is required'] };
  }

  const cleaned = String(aadhaar).replace(/\s/g, '');

  // Must be exactly 12 digits
  if (!/^\d{12}$/.test(cleaned)) {
    errors.push('Aadhaar must be exactly 12 digits');
  }

  // Cannot start with 0 or 1
  if (/^[01]/.test(cleaned)) {
    errors.push('Aadhaar number cannot start with 0 or 1');
  }

  // Cannot be all same digits
  if (/^(\d)\1{11}$/.test(cleaned)) {
    errors.push('Aadhaar number cannot have all identical digits');
  }

  // Verhoeff checksum validation
  if (cleaned.length === 12 && !verhoeffCheck(cleaned)) {
    errors.push('Invalid Aadhaar number (checksum failed)');
  }

  return { valid: errors.length === 0, errors, cleaned };
}

/**
 * Verhoeff algorithm checksum for Aadhaar validation.
 * UIDAI uses this to validate Aadhaar numbers.
 */
function verhoeffCheck(num) {
  const d = [
    [0,1,2,3,4,5,6,7,8,9],
    [1,2,3,4,0,6,7,8,9,5],
    [2,3,4,0,1,7,8,9,5,6],
    [3,4,0,1,2,8,9,5,6,7],
    [4,0,1,2,3,9,5,6,7,8],
    [5,9,8,7,6,0,4,3,2,1],
    [6,5,9,8,7,1,0,4,3,2],
    [7,6,5,9,8,2,1,0,4,3],
    [8,7,6,5,9,3,2,1,0,4],
    [9,8,7,6,5,4,3,2,1,0],
  ];
  const p = [
    [0,1,2,3,4,5,6,7,8,9],
    [1,5,7,6,2,8,3,0,9,4],
    [5,8,0,3,7,9,6,1,4,2],
    [8,9,1,6,0,4,3,5,2,7],
    [9,4,5,3,1,2,6,8,7,0],
    [4,2,8,6,5,7,3,9,0,1],
    [2,7,9,3,8,0,6,4,1,5],
    [7,0,4,6,9,1,3,2,5,8],
  ];
  const inv = [0,4,3,2,1,9,8,7,6,5];

  let c = 0;
  const reversed = num.split('').reverse();
  for (let i = 0; i < reversed.length; i++) {
    c = d[c][p[i % 8][parseInt(reversed[i])]];
  }
  return c === 0;
}

// ── Duplicate check ────────────────────────────────────────────────────────────

/**
 * Check if Aadhaar already exists in database.
 * Returns { isDuplicate, referral } if found.
 */
async function checkDuplicateAadhaar(aadhaar) {
  const existing = await Referral.findOne({ aadhaar })
    .populate('referredBy', 'name role')
    .select('aadhaar studentName timestamp referredBy status');

  if (existing) {
    return {
      isDuplicate: true,
      message: 'This Aadhaar number has already been referred.',
      referral: {
        studentName:  existing.studentName,
        referredBy:   existing.referredBy?.name || 'Unknown',
        referrerRole: existing.referredBy?.role || 'unknown',
        submittedOn:  existing.timestamp,
        status:       existing.status,
      },
    };
  }
  return { isDuplicate: false };
}

// ── OTP simulation ─────────────────────────────────────────────────────────────

/**
 * Generate and store a simulated OTP for Aadhaar verification.
 * In production, integrate with UIDAI API or a real OTP service.
 */
function generateAadhaarOTP(aadhaar) {
  const { valid, errors } = validateAadhaarFormat(aadhaar);
  if (!valid) return { success: false, errors };

  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  otpStore.set(aadhaar, { otp, expiresAt, verified: false });

  // In production: send OTP via SMS to Aadhaar-linked mobile
  // For simulation: log to console
  console.log(`[AADHAAR OTP] Aadhaar: ${aadhaar} | OTP: ${otp} | Expires: ${new Date(expiresAt).toISOString()}`);

  return {
    success: true,
    message: 'OTP sent to Aadhaar-linked mobile number (simulated)',
    // In dev mode, return OTP for testing
    ...(process.env.NODE_ENV !== 'production' && { devOtp: otp }),
  };
}

/**
 * Verify OTP for Aadhaar.
 */
function verifyAadhaarOTP(aadhaar, otp) {
  const record = otpStore.get(aadhaar);

  if (!record) {
    return { success: false, error: 'No OTP found for this Aadhaar. Please request a new OTP.' };
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(aadhaar);
    return { success: false, error: 'OTP has expired. Please request a new OTP.' };
  }

  if (record.otp !== String(otp)) {
    return { success: false, error: 'Invalid OTP. Please try again.' };
  }

  // Mark as verified
  record.verified = true;
  otpStore.set(aadhaar, record);

  return { success: true, message: 'Aadhaar verified successfully.' };
}

/**
 * Check if Aadhaar OTP has been verified.
 */
function isAadhaarVerified(aadhaar) {
  const record = otpStore.get(aadhaar);
  return record?.verified === true && Date.now() <= record.expiresAt;
}

/**
 * Clear OTP after use.
 */
function clearAadhaarOTP(aadhaar) {
  otpStore.delete(aadhaar);
}

module.exports = {
  validateAadhaarFormat,
  checkDuplicateAadhaar,
  generateAadhaarOTP,
  verifyAadhaarOTP,
  isAadhaarVerified,
  clearAadhaarOTP,
};
