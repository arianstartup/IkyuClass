const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Route for teacher registration (Legacy - without OTP pre-verification by client)
// POST /api/users/register/teacher
router.post('/register/teacher', userController.registerTeacher);

// New route for teacher registration after OTP verification
// POST /api/users/register/teacher-final
router.post('/register/teacher-final', userController.registerTeacherFinal);

// New route for student registration after OTP verification
// POST /api/users/register/student-final
router.post('/register/student-final', userController.registerStudentFinal);


// Add other user-related routes here (e.g., for students, university students)

module.exports = router;
