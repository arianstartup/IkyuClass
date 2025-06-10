const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyFirebaseToken, checkRole } = require('../middleware/authMiddleware');

// POST /api/payments/bookings/:bookingId/pay - Initiate payment for a booking
router.post(
    '/bookings/:bookingId/pay',
    verifyFirebaseToken,
    // Role check (e.g. student or owner of booking) should be handled in controller based on req.user.uid
    paymentController.initiateBookingPayment
);

// POST /api/payments/store-orders/:orderId/pay - Initiate payment for a store order
router.post(
    '/store-orders/:orderId/pay',
    verifyFirebaseToken,
    // Role check (owner of order) should be handled in controller
    paymentController.initiateStoreOrderPayment
);

// POST /api/payments/research-orders/:orderId/pay - Initiate payment for a research order
router.post(
    '/research-orders/:orderId/pay',
    verifyFirebaseToken,
    // Role check (owner of order) should be handled in controller
    paymentController.initiateResearchOrderPayment
);


// GET /api/payments/zarinpal/verify - Callback URL for Zarinpal to verify payment (Publicly accessible by Zarinpal)
router.get('/zarinpal/verify', paymentController.verifyZarinpalPayment);


module.exports = router;
