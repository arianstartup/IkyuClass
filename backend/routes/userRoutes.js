const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Route for teacher registration
// POST /api/users/register/teacher
router.post('/register/teacher', userController.registerTeacher);

// Add other user-related routes here (e.g., for students, university students)

module.exports = router;
