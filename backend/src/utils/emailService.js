'use strict';

const nodemailer = require('nodemailer');

// Create transporter — uses env vars, falls back to Ethereal for dev
function createTransporter() {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS &&
      process.env.EMAIL_USER !== 'your_email@example.com') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
  }
  // Dev fallback — logs to console, no actual send
  return null;
}

const transporter = createTransporter();

async function sendMail({ to, subject, html }) {
  if (!transporter) {
    console.log(`[EMAIL DEV] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({
      from: `"Admission Referral Portal" <${process.env.EMAIL_USER}>`,
      to, subject, html,
    });
  } catch (err) {
    console.error('[EMAIL ERROR]', err.message);
    // Non-fatal — don't crash the request
  }
}

// ── Email templates ────────────────────────────────────────────────────────────

function baseTemplate(content) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8"/>
    <style>
      body { font-family: 'Inter', Arial, sans-serif; background: #f0f2f9; margin: 0; padding: 0; }
      .wrapper { max-width: 560px; margin: 32px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
      .header { background: linear-gradient(135deg, #1e2a78, #4f46e5); padding: 28px 32px; }
      .header h1 { color: #fff; margin: 0; font-size: 20px; font-weight: 800; }
      .header p { color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 13px; }
      .body { padding: 28px 32px; color: #374151; font-size: 14px; line-height: 1.7; }
      .badge { display: inline-block; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 700; }
      .badge-pending  { background: #fef3c7; color: #92400e; }
      .badge-approved { background: #d1fae5; color: #065f46; }
      .badge-rejected { background: #fee2e2; color: #991b1b; }
      .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
      .info-label { color: #9ca3af; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
      .info-value { color: #111827; font-weight: 600; font-size: 13px; }
      .footer { background: #f9fafb; padding: 16px 32px; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #f3f4f6; }
      .btn { display: inline-block; margin-top: 20px; padding: 12px 28px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="header">
        <h1>🎓 Admission Referral Portal</h1>
        <p>Automated notification</p>
      </div>
      <div class="body">${content}</div>
      <div class="footer">This is an automated message. Please do not reply directly to this email.</div>
    </div>
  </body>
  </html>`;
}

// Email 1: Referral submitted — to the referrer
async function sendReferralSubmittedEmail({ referrerEmail, referrerName, studentName, aadhaar, course }) {
  await sendMail({
    to: referrerEmail,
    subject: `✅ Referral Submitted — ${studentName}`,
    html: baseTemplate(`
      <p>Hi <strong>${referrerName}</strong>,</p>
      <p>Your referral has been successfully submitted and is now under review.</p>
      <div style="margin: 20px 0;">
        <div class="info-row"><span class="info-label">Student</span><span class="info-value">${studentName}</span></div>
        <div class="info-row"><span class="info-label">Aadhaar</span><span class="info-value" style="font-family:monospace">${aadhaar}</span></div>
        <div class="info-row"><span class="info-label">Course</span><span class="info-value">${course}</span></div>
        <div class="info-row"><span class="info-label">Status</span><span class="badge badge-pending">Pending</span></div>
      </div>
      <p>You will be notified when the status changes.</p>
    `),
  });
}

// Email 2: Status changed — to the referrer
async function sendStatusChangedEmail({ referrerEmail, referrerName, studentName, status, course }) {
  const isApproved = status === 'approved';
  await sendMail({
    to: referrerEmail,
    subject: `${isApproved ? '🎉' : '❌'} Referral ${isApproved ? 'Approved' : 'Rejected'} — ${studentName}`,
    html: baseTemplate(`
      <p>Hi <strong>${referrerName}</strong>,</p>
      <p>The status of your referral for <strong>${studentName}</strong> has been updated.</p>
      <div style="margin: 20px 0;">
        <div class="info-row"><span class="info-label">Student</span><span class="info-value">${studentName}</span></div>
        <div class="info-row"><span class="info-label">Course</span><span class="info-value">${course}</span></div>
        <div class="info-row"><span class="info-label">New Status</span><span class="badge badge-${status}">${status.toUpperCase()}</span></div>
      </div>
      ${isApproved
        ? '<p>🎉 Congratulations! The candidate has been approved for admission consideration.</p>'
        : '<p>Unfortunately, this referral has been rejected. Please contact the admin for more details.</p>'
      }
    `),
  });
}

// Email 3: New referral alert — to admin
async function sendAdminNewReferralAlert({ adminEmail, studentName, referrerName, course, city, country }) {
  await sendMail({
    to: adminEmail,
    subject: `🔔 New Referral Submitted — ${studentName}`,
    html: baseTemplate(`
      <p>A new referral has been submitted and requires your review.</p>
      <div style="margin: 20px 0;">
        <div class="info-row"><span class="info-label">Student</span><span class="info-value">${studentName}</span></div>
        <div class="info-row"><span class="info-label">Referred By</span><span class="info-value">${referrerName}</span></div>
        <div class="info-row"><span class="info-label">Course</span><span class="info-value">${course}</span></div>
        <div class="info-row"><span class="info-label">Location</span><span class="info-value">${city}, ${country}</span></div>
        <div class="info-row"><span class="info-label">Status</span><span class="badge badge-pending">Pending Review</span></div>
      </div>
      <p>Please log in to the admin dashboard to review and take action.</p>
    `),
  });
}

module.exports = {
  sendReferralSubmittedEmail,
  sendStatusChangedEmail,
  sendAdminNewReferralAlert,
};
