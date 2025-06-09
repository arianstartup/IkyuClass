const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// In a real app, this route would be protected,
// ensuring only authenticated students can create bookings.

// POST /api/bookings/create - Create a new booking
router.post('/create', bookingController.createNewBooking);

// Add other booking-related routes here later
// e.g., GET /api/bookings/:studentId - Get student's bookings
// e.g., GET /api/bookings/:teacherId - Get teacher's bookings
// e.g., PUT /api/bookings/:bookingId/cancel - Cancel a booking

module.exports = router;
