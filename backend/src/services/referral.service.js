'use strict';

const Referral = require('../models/Referral');
const User     = require('../models/User');
const AppError = require('../utils/AppError');
const { createAuditEntry } = require('../utils/auditLog');
const {
  sendReferralSubmittedEmail,
  sendStatusChangedEmail,
  sendAdminNewReferralAlert,
} = require('../utils/emailService');
const sseManager = require('../utils/sseManager');
const {
  smsReferralApproved,
  smsReferralRejected,
} = require('../utils/smsService');

// Escape user input before passing to RegExp to prevent ReDoS attacks
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Credit rules
const FIRST_REFERRAL_CREDITS    = 20;
const SUBSEQUENT_REFERRAL_CREDITS = 10;

const submitReferral = async (payload, userId) => {
  const existing = await Referral.findOne({ aadhaar: payload.aadhaar });
  if (existing) {
    throw new AppError('Duplicate Referral: this candidate has already been referred.', 409);
  }

  const referral = await Referral.create({
    ...payload,
    referredBy: userId,
    status: 'pending',
    auditTrail: [createAuditEntry({ action: 'SUBMITTED', performedBy: userId })],
  });

  // Track total referrals (credits awarded only on approval)
  const user = await User.findById(userId);
  if (user && user.role !== 'admin') {
    user.totalReferrals += 1;
    await user.save();
  }

  // Fire-and-forget emails
  const referrer = await User.findById(userId).select('name email');
  if (referrer) {
    sendReferralSubmittedEmail({
      referrerEmail: referrer.email,
      referrerName:  referrer.name,
      studentName:   payload.studentName,
      aadhaar:       payload.aadhaar,
      course:        payload.course,
    });
    const admins = await User.find({ role: 'admin' }).select('email');
    admins.forEach((admin) => {
      sendAdminNewReferralAlert({
        adminEmail:   admin.email,
        studentName:  payload.studentName,
        referrerName: referrer.name,
        course:       payload.course,
        city:         payload.city || '',
        country:      payload.country || '',
      });
    });

    // SMS to referrer on submission (use referrer's info, not the student's)
    // Note: contactDetails.phone belongs to the referred student;
    // ideally the referrer's phone should come from User profile.
    // For now, log and skip SMS to avoid messaging the wrong person.
    // TODO: Add phone field to User model so SMS goes to the referrer.
  }

  // Push real-time SSE to all admins
  sseManager.sendToAdmins({
    type:         'new_referral',
    title:        'New Referral Received',
    message:      `${payload.studentName} referred for ${payload.course}`,
    studentName:  payload.studentName,
    referrerName: referrer?.name || 'Unknown',
    referrerRole: user?.role || 'unknown',
    course:       payload.course,
    aadhaar:      payload.aadhaar,
    link:         '/status',
    time:         new Date().toISOString(),
  });

  return referral;
};

/**
 * Get referrals with filters and pagination.
 */
const getReferrals = async ({
  userId,
  role,
  page = 1,
  limit = 20,
  status,
  course,
  startDate,
  endDate,
  search,
} = {}) => {
  const query = {};

  if (role !== 'admin') {
    query.referredBy = userId;
  }

  if (status) {
    query.status = status;
  }

  if (course) {
    query.course = new RegExp(escapeRegExp(course), 'i');
  }

  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = new Date(startDate);
    if (endDate) query.timestamp.$lte = new Date(endDate);
  }

  if (search) {
    const regex = new RegExp(escapeRegExp(search), 'i');
    query.$or = [
      { studentName: regex },
      { 'contactDetails.email': regex },
    ];
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [data, total] = await Promise.all([
    Referral.find(query)
      .populate('referredBy', 'name email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum),
    Referral.countDocuments(query),
  ]);

  return { data, total, page: pageNum, limit: limitNum };
};

/**
 * Get a single referral by Aadhaar.
 * Non-admins can only access their own referrals.
 */
const getReferralByAadhaar = async (aadhaar, requestingUser) => {
  const referral = await Referral.findOne({ aadhaar }).populate('referredBy', 'name email role');

  if (!referral) {
    throw new AppError('Referral not found.', 404);
  }

  if (requestingUser.role !== 'admin') {
    const referredById = referral.referredBy._id
      ? referral.referredBy._id.toString()
      : referral.referredBy.toString();

    if (referredById !== requestingUser.userId) {
      throw new AppError('You are not authorised to view this referral.', 403);
    }
  }

  return referral;
};

/**
 * Update referral status (admin only).
 * Appends an audit entry for the status change.
 */
const updateReferralStatus = async ({ aadhaar, status, remarks, adminUser }) => {
  const referral = await Referral.findOne({ aadhaar }).populate('referredBy', 'name email role referralId credits totalReferrals');

  if (!referral) {
    throw new AppError('Referral not found.', 404);
  }

  const previousStatus = referral.status;

  referral.auditTrail.push(
    createAuditEntry({
      action: 'STATUS_CHANGED',
      performedBy: adminUser.userId,
      previousStatus,
      newStatus: status,
    })
  );

  referral.status  = status;
  referral.remarks = remarks || null;
  await referral.save();

  // Award/deduct credits based on approval decision
  const referrer = await User.findById(referral.referredBy._id || referral.referredBy);
  if (referrer && referrer.role !== 'admin') {
    if (status === 'approved' && previousStatus !== 'approved') {
      // Award credits: 20 for first approved, 10 for rest
      const approvedCount = await Referral.countDocuments({
        referredBy: referrer._id,
        status: 'approved',
      });
      // approvedCount already includes this one since we saved above
      const isFirst = approvedCount === 1;
      referrer.credits += isFirst ? FIRST_REFERRAL_CREDITS : SUBSEQUENT_REFERRAL_CREDITS;
      await referrer.save();
    } else if (status === 'rejected' && previousStatus === 'approved') {
      // Reverse credits if previously approved then rejected
      const approvedCount = await Referral.countDocuments({
        referredBy: referrer._id,
        status: 'approved',
      });
      const creditsToRemove = approvedCount === 0 ? FIRST_REFERRAL_CREDITS : SUBSEQUENT_REFERRAL_CREDITS;
      referrer.credits = Math.max(0, referrer.credits - creditsToRemove);
      await referrer.save();
    }
  }

  // Fire-and-forget status change email to referrer
  const populated = await Referral.findById(referral._id).populate('referredBy', 'name email role');
  if (populated?.referredBy) {
    sendStatusChangedEmail({
      referrerEmail: populated.referredBy.email,
      referrerName:  populated.referredBy.name,
      studentName:   referral.studentName,
      status,
      course:        referral.course,
    });

    // Push real-time SSE to the referrer
    const isApproved = status === 'approved';
    sseManager.sendToUser(String(populated.referredBy._id), {
      type:        isApproved ? 'admission_confirmed' : 'admission_rejected',
      title:       isApproved ? '🎉 Admission Confirmed!' : '❌ Referral Rejected',
      message:     isApproved
        ? `${referral.studentName}'s referral for ${referral.course} has been approved!`
        : `${referral.studentName}'s referral for ${referral.course} has been rejected.`,
      studentName: referral.studentName,
      course:      referral.course,
      aadhaar:     referral.aadhaar,
      link:        '/status',
      time:        new Date().toISOString(),
      referrerRole: populated.referredBy.role,
    });

    // SMS to referrer on status change
    const referrerPhone = referral.contactDetails?.phone;
    if (referrerPhone) {
      if (isApproved) {
        smsReferralApproved({ phone: referrerPhone, studentName: referral.studentName, course: referral.course });
      } else {
        smsReferralRejected({ phone: referrerPhone, studentName: referral.studentName, course: referral.course, remarks: referral.remarks });
      }
    }
  }

  return referral;
};

/**
 * Get leaderboard — ranked users by credits.
 * filter: 'highest' | 'lowest' | 'none' (no credits)
 * year: optional year filter (defaults to current year)
 *
 * Uses a single aggregation pipeline instead of N+1 queries.
 */
const getLeaderboard = async ({ filter = 'highest', year } = {}) => {
  const targetYear = parseInt(year) || new Date().getFullYear();
  const yearStart  = new Date(`${targetYear}-01-01`);
  const yearEnd    = new Date(`${targetYear}-12-31T23:59:59.999Z`);

  // Build user filter
  const userMatch = { role: { $ne: 'admin' } };
  if (filter === 'none')   userMatch.credits = 0;
  if (filter === 'lowest') userMatch.credits = { $gt: 0 };

  const sortDir = filter === 'lowest' ? 1 : -1;

  // Single aggregation: users + left-join referrals for year count
  const leaderboard = await User.aggregate([
    { $match: userMatch },
    { $sort: { credits: sortDir } },
    {
      $lookup: {
        from: 'referrals',
        let: { uid: '$_id' },
        pipeline: [
          { $match: { $expr: { $and: [
            { $eq: ['$referredBy', '$$uid'] },
            { $gte: ['$timestamp', yearStart] },
            { $lte: ['$timestamp', yearEnd] },
          ]}}},
          { $count: 'count' },
        ],
        as: 'yearRef',
      },
    },
    {
      $project: {
        name:           1,
        email:          1,
        role:           1,
        referralId:     1,
        credits:        1,
        totalReferrals: 1,
        yearReferrals:  { $ifNull: [{ $arrayElemAt: ['$yearRef.count', 0] }, 0] },
      },
    },
  ]);

  // Add rank
  leaderboard.forEach((u, idx) => { u.rank = idx + 1; });

  // Find top performer of the year
  const topOfYear = leaderboard.reduce((top, u) =>
    u.yearReferrals > (top?.yearReferrals ?? -1) ? u : top, null);

  return { leaderboard, topOfYear, year: targetYear };
};

module.exports = {
  submitReferral,
  getReferrals,
  getReferralByAadhaar,
  updateReferralStatus,
  getLeaderboard,
};
