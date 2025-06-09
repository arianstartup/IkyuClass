const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');

// In a real app, these routes would be protected,
// ensuring only authenticated users (and sometimes only teachers themselves) can access them.

// Update availability for the logged-in teacher (or specific teacher by ID for admin/testing)
// PUT /api/teachers/:teacherId/availability
// (Using :teacherId here as req.user is not yet implemented for teacher auth)
router.put('/:teacherId/availability', teacherController.updateTeacherAvailability);

// Get a list of all teachers (publicly accessible or for authenticated users)
// GET /api/teachers
router.get('/', teacherController.getAllTeachers);

// Get a specific teacher's profile by ID (publicly accessible or for authenticated users)
// GET /api/teachers/:teacherId
router.get('/:teacherId', teacherController.getTeacherById);


// Future route for a teacher to get their own full profile:
// router.get('/me', ensureAuthenticated, ensureTeacherRole, teacherController.getMyProfile);

module.exports = router;
