const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyFirebaseToken, checkRole } = require('../middleware/authMiddleware'); // New middlewares

// POST /api/reviews/teachers/:teacherId/reviews - Submit a review for a teacher
// Requires an authenticated user with 'student' or 'university_student' (or admin for testing) role
router.post(
  '/teachers/:teacherId/reviews',
  verifyFirebaseToken,
  checkRole(['student', 'university_student', 'admin']), // Allow admin to post reviews for testing if needed
  reviewController.submitTeacherReview
);

// GET /api/reviews/teachers/:teacherId/reviews - Get all approved reviews for a teacher (Public)
router.get('/teachers/:teacherId/reviews', reviewController.getTeacherReviews);

// Future admin routes for reviews (e.g., approve/delete) could go into adminRoutes.js
// Example:
// router.put('/:reviewId/approve', isAdmin, reviewController.approveReview);
// router.delete('/:reviewId', isAdmin, reviewController.deleteReview);

module.exports = router;
