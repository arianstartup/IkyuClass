const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Route for submitting a new research order
// POST /api/orders/research/create
router.post('/research/create', orderController.submitResearchOrder);

// Add other order-related routes here later (e.g., get order status, list orders)

module.exports = router;
