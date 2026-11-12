'use strict';

const { Router } = require('express');
const { verifyToken } = require('../middleware/auth');
const { getBotReply } = require('../utils/chatbot');
const Referral = require('../models/Referral');
const User     = require('../models/User');

const router = Router();

// ── Chatbot ────────────────────────────────────────────────────────────────────
router.post('/chat', verifyToken, (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });
  const reply = getBotReply(message, req.user.role);
  res.json({ reply, timestamp: new Date().toISOString() });
});

// ── Smart search suggestions ───────────────────────────────────────────────────
router.get('/search/suggestions', verifyToken, async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ suggestions: [] });

  const isAdmin = req.user.role === 'admin';
  const query   = isAdmin ? {} : { referredBy: req.user.userId };
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex   = new RegExp(escaped, 'i');

  try {
    const [byName, byCourse, byInstitution] = await Promise.all([
      Referral.find({ ...query, studentName: regex }).select('studentName').limit(5),
      Referral.distinct('course', { ...query, course: regex }),
      Referral.distinct('institution', { ...query, institution: regex }),
    ]);

    const suggestions = [
      ...byName.map((r) => ({ type: 'student', label: r.studentName, icon: '👤' })),
      ...byCourse.slice(0, 3).map((c) => ({ type: 'course', label: c, icon: '📚' })),
      ...byInstitution.slice(0, 3).map((i) => ({ type: 'institution', label: i, icon: '🏫' })),
    ].slice(0, 8);

    res.json({ suggestions });
  } catch { res.json({ suggestions: [] }); }
});

// ── Personalized recommendations ──────────────────────────────────────────────
router.get('/recommendations', verifyToken, async (req, res) => {
  const userId  = req.user.userId;
  const isAdmin = req.user.role === 'admin';

  try {
    if (isAdmin) {
      // Admin: show pending referrals that need attention
      const pending = await Referral.countDocuments({ status: 'pending' });
      const oldest  = await Referral.findOne({ status: 'pending' }).sort({ timestamp: 1 }).populate('referredBy', 'name role');
      const recent  = await Referral.find({ status: 'pending' }).sort({ timestamp: -1 }).limit(3).populate('referredBy', 'name role');

      res.json({
        type: 'admin',
        insights: [
          pending > 0 ? { icon: '⏳', text: `${pending} referral${pending > 1 ? 's' : ''} awaiting your review`, action: '/status', priority: 'high' } : null,
          oldest ? { icon: '🕐', text: `Oldest pending: ${oldest.studentName} (referred by ${oldest.referredBy?.name})`, action: '/status', priority: 'medium' } : null,
        ].filter(Boolean),
        pendingReferrals: recent,
      });
    } else {
      // User: show personalized tips based on their activity
      const myReferrals = await Referral.find({ referredBy: userId });
      const approved    = myReferrals.filter((r) => r.status === 'approved').length;
      const pending     = myReferrals.filter((r) => r.status === 'pending').length;
      const rejected    = myReferrals.filter((r) => r.status === 'rejected').length;
      const total       = myReferrals.length;

      // Most referred course
      const courseCounts = {};
      myReferrals.forEach((r) => { courseCounts[r.course] = (courseCounts[r.course] || 0) + 1; });
      const topCourse = Object.entries(courseCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

      // User credits
      const user = await User.findById(userId).select('credits totalReferrals');

      const insights = [];
      if (total === 0) insights.push({ icon: '🚀', text: 'Submit your first referral to earn 20 credits!', action: '/submit', priority: 'high' });
      if (pending > 0) insights.push({ icon: '⏳', text: `${pending} referral${pending > 1 ? 's' : ''} pending admin review`, action: '/status', priority: 'medium' });
      if (rejected > 0) insights.push({ icon: '💡', text: `${rejected} referral${rejected > 1 ? 's were' : ' was'} rejected — check remarks to improve`, action: '/status', priority: 'medium' });
      if (approved >= 1 && total < 5) insights.push({ icon: '⭐', text: 'Keep referring! Each approval earns 10 more credits', action: '/submit', priority: 'low' });
      if (topCourse) insights.push({ icon: '📚', text: `Your most referred course: ${topCourse}`, action: '/leaderboard', priority: 'low' });

      res.json({
        type: 'user',
        stats: { total, approved, pending, rejected, credits: user?.credits || 0 },
        insights,
        topCourse,
      });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// ── AI Analytics ──────────────────────────────────────────────────────────────
router.get('/analytics', verifyToken, async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const baseQuery = isAdmin ? {} : { referredBy: req.user.userId };

  try {
    const [total, approved, rejected, pending] = await Promise.all([
      Referral.countDocuments(baseQuery),
      Referral.countDocuments({ ...baseQuery, status: 'approved' }),
      Referral.countDocuments({ ...baseQuery, status: 'rejected' }),
      Referral.countDocuments({ ...baseQuery, status: 'pending' }),
    ]);

    // Course distribution
    const courseAgg = await Referral.aggregate([
      { $match: baseQuery },
      { $group: { _id: '$course', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyAgg = await Referral.aggregate([
      { $match: { ...baseQuery, timestamp: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$timestamp' }, month: { $month: '$timestamp' } }, count: { $sum: 1 }, approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Role distribution (admin only)
    let roleAgg = [];
    if (isAdmin) {
      roleAgg = await Referral.aggregate([
        { $lookup: { from: 'users', localField: 'referredBy', foreignField: '_id', as: 'referrer' } },
        { $unwind: '$referrer' },
        { $group: { _id: '$referrer.role', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);
    }

    // AI insights
    const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
    const insights = [];
    if (approvalRate >= 70) insights.push({ type: 'positive', text: `Strong approval rate of ${approvalRate}% — excellent referral quality!` });
    else if (approvalRate >= 40) insights.push({ type: 'neutral', text: `Approval rate is ${approvalRate}% — there's room for improvement.` });
    else if (total > 0) insights.push({ type: 'warning', text: `Low approval rate of ${approvalRate}% — review rejection remarks for guidance.` });
    if (pending > 5) insights.push({ type: 'warning', text: `${pending} referrals are pending — admin review needed.` });
    if (courseAgg[0]) insights.push({ type: 'info', text: `Most popular course: ${courseAgg[0]._id} (${courseAgg[0].count} referrals)` });

    const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const trend = monthlyAgg.map((m) => ({
      month: MONTH_NAMES[m._id.month - 1],
      referrals: m.count,
      approved: m.approved,
    }));

    res.json({
      summary: { total, approved, rejected, pending, approvalRate },
      courseDistribution: courseAgg.map((c) => ({ name: c._id || 'Unknown', value: c.count })),
      monthlyTrend: trend,
      roleDistribution: roleAgg.map((r) => ({ role: r._id, count: r.count })),
      insights,
    });
  } catch (err) {
    res.status(500).json({ error: 'Analytics failed' });
  }
});

module.exports = router;
