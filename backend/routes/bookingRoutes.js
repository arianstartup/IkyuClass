const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyFirebaseToken, checkRole } = require('../middleware/authMiddleware');

// POST /api/bookings/create - Create a new booking (Student/Admin action)
// Student creates for themselves. Admin might create for a user.
router.post(
  '/create',
  verifyFirebaseToken,
  checkRole(['student', 'university_student', 'admin']),
  bookingController.createNewBooking
);

// GET /api/bookings/my-student-bookings - Get bookings for the logged-in student
// Student sees their own. Admin could see if they pass studentId (controller logic to adapt).
router.get(
  '/my-student-bookings',
  verifyFirebaseToken,
  // checkRole(['student', 'university_student', 'admin']), // Controller will use req.user.uid for student
  bookingController.getMyStudentBookings // Controller needs to be updated to use req.user.uid if no query param
);

// GET /api/bookings/my-teacher-bookings - Get bookings for the logged-in teacher
// Teacher sees their own. Admin could see if they pass teacherId.
router.get(
  '/my-teacher-bookings',
  verifyFirebaseToken,
  // checkRole(['teacher', 'admin']), // Controller will use req.user.uid for teacher
  bookingController.getMyTeacherBookings // Controller needs to be updated
);

// PUT /api/bookings/:bookingId/cancel - Cancel a booking
// User must be authenticated. Role check (student, teacher, or admin) happens inside controller.
router.put(
  '/:bookingId/cancel',
  verifyFirebaseToken,
  bookingController.cancelBooking
);

module.exports = router;
