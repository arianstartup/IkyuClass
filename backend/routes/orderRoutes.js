const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyFirebaseToken, checkRole } = require('../middleware/authMiddleware');

// --- Research Order Routes ---

// POST /api/orders/research/create - Submit a new research order (Authenticated User)
router.post(
    '/research/create',
    verifyFirebaseToken, // Any authenticated user can create
    // checkRole(['student', 'university_student', 'teacher', 'admin']), // Or more specific roles
    orderController.submitResearchOrder
);

// GET /api/orders/research/:orderId/download - Download a completed research paper (User who owns it, or Admin)
router.post( // Changed to POST in subtask 17 to easily pass userId, consider reverting to GET with proper auth
    '/research/:orderId/download',
    verifyFirebaseToken,
    // Role/ownership check is done inside controller
    orderController.downloadResearchOrderFile
);

// GET /api/orders/research/my-orders - Get all research orders for the logged-in user
router.get(
    '/research/my-orders',
    verifyFirebaseToken,
    // Controller will use req.user.uid
    orderController.getMyResearchOrders
);


// --- Store Order Routes ---

// POST /api/orders/store/checkout - Initiate a new store order (checkout) (Authenticated User)
router.post(
    '/store/checkout',
    verifyFirebaseToken, // Any authenticated user can checkout
    orderController.checkoutStoreOrder
);


// Add other order-related routes here later (e.g., get order status, list orders for both types)
// Example: GET /api/orders/:orderId (for any type, with ownership check in controller)
// router.get('/:orderId', verifyFirebaseToken, orderController.getOrderDetails);

module.exports = router;
