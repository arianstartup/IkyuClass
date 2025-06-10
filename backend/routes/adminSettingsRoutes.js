const express = require('express');
const router = express.Router();
const adminSettingsController = require('../controllers/adminSettingsController');
const { verifyFirebaseToken, checkRole } = require('../middleware/authMiddleware'); // New middlewares

// GET /api/admin/settings - Get platform settings (Admin only)
router.get('/', verifyFirebaseToken, checkRole(['admin']), adminSettingsController.getPlatformSettings);

// PUT /api/admin/settings - Update platform settings (Admin only)
router.put('/', verifyFirebaseToken, checkRole(['admin']), adminSettingsController.updatePlatformSettings);

module.exports = router;
