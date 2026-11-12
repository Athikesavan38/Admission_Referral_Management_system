'use strict';

const https = require('https');
const querystring = require('querystring');

/**
 * SMS Service — Vonage (free €2 credit on signup, no payment needed)
 * Fallback: Fast2SMS, then console log
 *
 * Setup:
 * 1. Sign up free at https://dashboard.nexmo.com/sign-up
 * 2. Get API Key and API Secret from dashboard
 * 3. Add to .env: VONAGE_API_KEY, VONAGE_API_SECRET, VONAGE_FROM
 */

// ── Vonage (Nexmo) ─────────────────────────────────────────────────────────────
async function sendVonageSMS({ phone, message }) {
  return new Promise((resolve) => {
    const apiKey    = process.env.VONAGE_API_KEY;
    const apiSecret = process.env.VONAGE_API_SECRET;
    const from      = process.env.VONAGE_FROM || 'CIET';

    if (!apiKey || !apiSecret) {
      return resolve({ success: false, error: 'Vonage credentials not set' });
    }

    const cleanPhone = String(phone).replace(/\D/g, '');
    // Add country code if not present (91 for India)
    const toNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const payload = querystring.stringify({
      api_key:    apiKey,
      api_secret: apiSecret,
      to:         toNumber,
      from,
      text:       message,
      type:       'text',
    });

    const options = {
      hostname: 'rest.nexmo.com',
      path:     '/sms/json',
      method:   'POST',
      headers: {
        'Content-Type':   'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const msg = parsed.messages?.[0];
          if (msg?.status === '0') {
            console.log(`[SMS] Vonage sent to ${toNumber} — ID: ${msg['message-id']}`);
            resolve({ success: true, provider: 'vonage', id: msg['message-id'] });
          } else {
            const errText = msg?.['error-text'] || 'Unknown error';
            console.error(`[SMS] Vonage failed: ${errText}`);
            resolve({ success: false, provider: 'vonage', error: errText });
          }
        } catch (e) {
          resolve({ success: false, error: 'Invalid Vonage response' });
        }
      });
    });

    req.on('error', (err) => {
      console.error('[SMS] Vonage error:', err.message);
      resolve({ success: false, error: err.message });
    });

    req.write(payload);
    req.end();
  });
}

// ── Fast2SMS (India) ───────────────────────────────────────────────────────────
async function sendFast2SMS({ phone, message }) {
  return new Promise((resolve) => {
    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) return resolve({ success: false, error: 'FAST2SMS_API_KEY not set' });

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    const payload = JSON.stringify({
      route: 'q', message, language: 'english', flash: 0, numbers: cleanPhone,
    });

    const options = {
      hostname: 'www.fast2sms.com',
      path:     '/dev/bulkV2',
      method:   'POST',
      headers: {
        authorization:  apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.return === true) {
            console.log(`[SMS] Fast2SMS sent to ${cleanPhone}`);
            resolve({ success: true, provider: 'fast2sms' });
          } else {
            resolve({ success: false, provider: 'fast2sms', error: parsed.message });
          }
        } catch { resolve({ success: false, error: 'Invalid Fast2SMS response' }); }
      });
    });
    req.on('error', (e) => resolve({ success: false, error: e.message }));
    req.write(payload);
    req.end();
  });
}

// ── Message templates ──────────────────────────────────────────────────────────
const TEMPLATES = {
  referral_submitted: (studentName, course) =>
    `CIET: Your referral for ${studentName} (${course}) submitted successfully. You will be notified on status update.`,

  referral_approved: (studentName, course) =>
    `CIET: Congratulations! Referral for ${studentName} (${course}) APPROVED. Credits awarded to your account.`,

  referral_rejected: (studentName, course, remarks) =>
    `CIET: Referral for ${studentName} (${course}) REJECTED. Reason: ${remarks || 'Contact admin for details'}.`,

  duplicate_referral: (aadhaar) =>
    `CIET: Referral failed. Aadhaar ${aadhaar} already referred by another user.`,

  admin_new_referral: (studentName, referrerName, course) =>
    `CIET Admin: New referral - Student: ${studentName}, Course: ${course}, By: ${referrerName}. Login to review.`,
};

// ── Main reusable send function ────────────────────────────────────────────────
/**
 * Send SMS — tries providers in order based on SMS_PROVIDER env var.
 * Never throws — always resolves.
 */
async function sendSMS({ phone, message }) {
  if (!phone || !message) {
    console.warn('[SMS] Missing phone or message');
    return { success: false, error: 'Missing phone or message' };
  }

  const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
  if (cleanPhone.length !== 10) {
    console.warn(`[SMS] Invalid phone: ${phone}`);
    return { success: false, error: 'Invalid phone number' };
  }

  const provider = process.env.SMS_PROVIDER || 'vonage';

  let result;

  if (provider === 'vonage') {
    result = await sendVonageSMS({ phone: cleanPhone, message });
    if (!result.success && process.env.FAST2SMS_API_KEY) {
      console.log('[SMS] Vonage failed, trying Fast2SMS...');
      result = await sendFast2SMS({ phone: cleanPhone, message });
    }
  } else if (provider === 'fast2sms') {
    result = await sendFast2SMS({ phone: cleanPhone, message });
  } else {
    // auto: try both
    result = await sendVonageSMS({ phone: cleanPhone, message });
    if (!result.success) result = await sendFast2SMS({ phone: cleanPhone, message });
  }

  // Always log to console so admin can see SMS content even if delivery fails
  if (!result.success) {
    console.log(`[SMS LOG] To: +91${cleanPhone} | ${message}`);
  }

  return result;
}

// ── Convenience wrappers ───────────────────────────────────────────────────────
const smsReferralSubmitted  = ({ phone, studentName, course }) =>
  sendSMS({ phone, message: TEMPLATES.referral_submitted(studentName, course) });

const smsReferralApproved   = ({ phone, studentName, course }) =>
  sendSMS({ phone, message: TEMPLATES.referral_approved(studentName, course) });

const smsReferralRejected   = ({ phone, studentName, course, remarks }) =>
  sendSMS({ phone, message: TEMPLATES.referral_rejected(studentName, course, remarks) });

const smsDuplicateReferral  = ({ phone, aadhaar }) =>
  sendSMS({ phone, message: TEMPLATES.duplicate_referral(aadhaar) });

const smsAdminNewReferral   = ({ phone, studentName, referrerName, course }) =>
  sendSMS({ phone, message: TEMPLATES.admin_new_referral(studentName, referrerName, course) });

module.exports = {
  sendSMS,
  smsReferralSubmitted,
  smsReferralApproved,
  smsReferralRejected,
  smsDuplicateReferral,
  smsAdminNewReferral,
  TEMPLATES,
};
