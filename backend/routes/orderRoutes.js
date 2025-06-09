const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Route for submitting a new research order
// POST /api/orders/research/create
router.post('/research/create', orderController.submitResearchOrder);


// --- Store Order Routes ---
// POST /api/orders/store/checkout - Initiate a new store order (checkout)
router.post('/store/checkout', orderController.checkoutStoreOrder);


// Add other order-related routes here later (e.g., get order status, list orders for both types)

module.exports = router;
