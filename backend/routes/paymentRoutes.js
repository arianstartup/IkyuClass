const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
// const bookingController = require('../controllers/bookingController'); // If initiate part is there

// This route could also be part of bookingRoutes.js, e.g., POST /api/bookings/:bookingId/initiate-payment
// For separation of concerns, keeping payment initiation and verification in paymentRoutes.

// POST /api/payments/bookings/:bookingId/pay - Initiate payment for a booking
router.post('/bookings/:bookingId/pay', paymentController.initiateBookingPayment);

// POST /api/payments/store-orders/:orderId/pay - Initiate payment for a store order
router.post('/store-orders/:orderId/pay', paymentController.initiateStoreOrderPayment);


// GET /api/payments/zarinpal/verify - Callback URL for Zarinpal to verify payment (for both booking and store order)
router.get('/zarinpal/verify', paymentController.verifyZarinpalPayment);
// Some gateways might use POST for callback, adjust if needed based on Zarinpal docs.

module.exports = router;
