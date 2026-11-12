'use strict';

const { Router } = require('express');
const { registerValidator, loginValidator } = require('../validators/auth.validator');
const { register, login, loginAdmin, loginUserOnly } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth');

const router = Router();

router.post('/register',    registerValidator, register);
router.post('/login',       loginValidator,    login);
router.post('/login/admin', loginValidator,    loginAdmin);
router.post('/login/user',  loginValidator,    loginUserOnly);

// Verify token and return current user profile — used by frontend on app load
router.get('/me', verifyToken, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.userId)
      .select('name email role referralId credits totalReferrals');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      _id:            user._id,
      userId:         user._id,
      name:           user.name,
      email:          user.email,
      role:           user.role,
      referralId:     user.referralId || null,
      credits:        user.credits || 0,
      totalReferrals: user.totalReferrals || 0,
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

module.exports = router;
