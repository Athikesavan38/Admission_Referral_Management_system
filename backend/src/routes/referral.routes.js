'use strict';

const { Router } = require('express');
const { verifyToken }             = require('../middleware/auth');
const { requireRole }             = require('../middleware/rbac');
const { uploadReferralFiles, normalizeContactDetails } = require('../middleware/upload');
const { submitReferralValidator, updateStatusValidator } = require('../validators/referral.validator');
const {
  submitReferral,
  getReferrals,
  getReferralByAadhaar,
  updateStatus,
  exportCSV,
  getLeaderboard,
} = require('../controllers/referral.controller');

const router = Router();

router.post('/', verifyToken, uploadReferralFiles, normalizeContactDetails, submitReferralValidator, submitReferral);
router.get('/', verifyToken, getReferrals);
router.get('/export',      verifyToken, requireRole('admin'), exportCSV);
router.get('/leaderboard', verifyToken, getLeaderboard);
router.get('/:aadhaar',    verifyToken, getReferralByAadhaar);
router.put('/status',      verifyToken, requireRole('admin'), updateStatusValidator, updateStatus);

module.exports = router;
