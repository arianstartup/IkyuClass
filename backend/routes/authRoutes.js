const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/send-verification-code - Send OTP to phone number
router.post('/send-verification-code', authController.sendVerificationCode);

const { verifyFirebaseToken } = require('../middleware/authMiddleware'); // Import verifyFirebaseToken

// POST /api/auth/verify-otp-code - Verify OTP code
router.post('/verify-otp-code', authController.verifyOtpCode);

// POST /api/auth/logout - Logout user (revoke refresh tokens)
router.post('/logout', verifyFirebaseToken, authController.logoutUser);


// Future routes:
// POST /api/auth/register (after OTP verification, using the temporary token) - This is effectively what registerTeacherFinal and registerStudentFinal do
// POST /api/auth/login (with password, or passwordless with OTP) - Needs implementation
// POST /api/auth/refresh-token - Needs implementation if using short-lived ID tokens and need to refresh session
// GET /api/auth/me (get current user profile based on JWT) - Needs implementation

module.exports = router;
