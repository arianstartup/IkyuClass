const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/send-verification-code - Send OTP to phone number
router.post('/send-verification-code', authController.sendVerificationCode);

// POST /api/auth/verify-otp-code - Verify OTP code
router.post('/verify-otp-code', authController.verifyOtpCode);

// Future routes:
// POST /api/auth/register (after OTP verification, using the temporary token)
// POST /api/auth/login (with password, or passwordless with OTP)
// POST /api/auth/refresh-token
// GET /api/auth/me (get current user profile based on JWT)

module.exports = router;
