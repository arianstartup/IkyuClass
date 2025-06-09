const express = require('express');
const router = express.Router();
const adminSettingsController = require('../controllers/adminSettingsController');
const { isAdmin } = require('../middleware/authMiddleware'); // Import the admin middleware

// GET /api/admin/settings - Get platform settings (Admin only)
router.get('/', isAdmin, adminSettingsController.getPlatformSettings);

// PUT /api/admin/settings - Update platform settings (Admin only)
router.put('/', isAdmin, adminSettingsController.updatePlatformSettings);

module.exports = router;
