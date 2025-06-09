const { db } = require('../config/firebaseConfig');
const { createTeacher } = require('../models/userTypes'); // Though not used for creation here, good for reference

// Update teacher availability
const updateTeacherAvailability = async (req, res) => {
  try {
    // For now, teacherId is taken from req.params.
    // In a real app, this would come from an authenticated req.user object (req.user.id)
    // and we'd verify that the authenticated user is indeed a teacher.
    const { teacherId } = req.params;
    const { availability } = req.body;

    if (!teacherId) {
      return res.status(400).json({ message: 'Teacher ID is required in URL parameters.' });
    }
    if (!Array.isArray(availability)) {
      return res.status(400).json({ message: 'Availability data must be an array.' });
    }

    // Optional: Validate structure of each availability slot
    // e.g., { dayOfWeek: 'شنبه', startTime: '09:00', endTime: '17:00', type: 'online' }
    for (const slot of availability) {
        if (!slot.dayOfWeek || !slot.startTime || !slot.endTime || !slot.type) {
            return res.status(400).json({ message: 'Each availability slot must include dayOfWeek, startTime, endTime, and type.' });
        }
        // Add more specific time format validation if needed
    }

    const teacherRef = db.collection('teachers').doc(teacherId);
    const teacherDoc = await teacherRef.get();

    if (!teacherDoc.exists) {
      return res.status(404).json({ message: 'Teacher not found.' });
    }

    await teacherRef.update({
      availability: availability,
      updatedAt: new Date().toISOString(),
    });

    res.status(200).json({ message: 'Teacher availability updated successfully.', availability });

  } catch (error) {
    console.error('Error updating teacher availability:', error);
    res.status(500).json({ message: 'Error updating teacher availability.', error: error.message });
  }
};

// Get list of all teachers (basic info)
const getAllTeachers = async (req, res) => {
  try {
    const teachersSnapshot = await db.collection('teachers').get();
    const teachers = [];
    teachersSnapshot.forEach(doc => {
      const data = doc.data();
      teachers.push({
        id: doc.id,
        firstName: data.firstName,
        lastName: data.lastName,
        subjectTaught: data.subjectTaught,
        qualifications: data.qualifications,
        // Do not include full availability here for brevity, or make it optional via query param
      });
    });
    res.status(200).json(teachers);
  } catch (error) {
    console.error('Error fetching all teachers:', error);
    res.status(500).json({ message: 'Error fetching teachers.', error: error.message });
  }
};

// Get specific teacher profile by ID (full info)
const getTeacherById = async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (!teacherId) {
      return res.status(400).json({ message: 'Teacher ID is required.' });
    }

    const teacherRef = db.collection('teachers').doc(teacherId);
    const teacherDoc = await teacherRef.get();

    if (!teacherDoc.exists) {
      return res.status(404).json({ message: 'Teacher not found.' });
    }

    res.status(200).json({ id: teacherDoc.id, ...teacherDoc.data() });
  } catch (error) {
    console.error('Error fetching teacher by ID:', error);
    res.status(500).json({ message: 'Error fetching teacher profile.', error: error.message });
  }
};


module.exports = {
  updateTeacherAvailability,
  getAllTeachers,
  getTeacherById,
};
