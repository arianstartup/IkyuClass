const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const adminDashboardController = require('../controllers/adminDashboardController');
const adminUserController = require('../controllers/adminUserController');
const { verifyFirebaseToken, checkRole } = require('../middleware/authMiddleware'); // New middlewares

// --- Admin Dashboard Routes ---
// GET /api/admin/dashboard/stats - Get dashboard statistics
router.get('/dashboard/stats', verifyFirebaseToken, checkRole(['admin']), adminDashboardController.getDashboardStats);


// --- Admin Order Management Routes ---
// POST /api/admin/research-orders/:orderId/generate-content - Generate AI content for a research order
router.post(
  '/research-orders/:orderId/generate-content',
  verifyFirebaseToken,
  checkRole(['admin']),
  orderController.generateResearchOrderContent
);

// Add other admin-specific order management routes here later if needed
// e.g., manually updating order status, assigning teachers to research orders, etc.


// --- Admin User Management Routes ---
// GET /api/admin/users - Get list of users (teachers, verified phone users)
router.get('/users', verifyFirebaseToken, checkRole(['admin']), adminUserController.getAllUsers);

// PUT /api/admin/users/:userId/role - Update a user's role (Admin)
router.put('/users/:userId/role', verifyFirebaseToken, checkRole(['admin']), adminUserController.updateUserRole);


module.exports = router;
