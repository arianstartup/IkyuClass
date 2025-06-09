const { db } = require('../config/firebaseConfig');
const { createTeacher } = require('../models/userTypes');

const registerTeacher = async (req, res) => {
  try {
    const { email, firstName, lastName, subjectTaught, qualifications, password } = req.body;

    // Basic validation
    if (!email || !firstName || !lastName || !subjectTaught || !qualifications || !password) {
      return res.status(400).json({ message: 'Missing required fields for teacher registration.' });
    }

    // In a real app, 'password' would be handled by Firebase Auth, not stored directly.
    // For now, we are just creating a Firestore document.
    // We'll use the email as a temporary UID placeholder or let Firestore auto-generate an ID.

    // Create a new teacher object (without UID for now, Firestore will generate one)
    // Or, if you want to use email as a document ID (ensure it's unique and valid for Firestore paths):
    // const teacherId = email.replace(/[^a-zA-Z0-9]/g, "_"); // Basic sanitization for ID

    const newTeacherData = createTeacher(
      null, // UID will be the Firestore document ID or set later via Auth
      email,
      firstName,
      lastName,
      subjectTaught,
      qualifications,
      { initialPasswordPlaceholder: password } // Storing password here is NOT secure for production
    );

    // Add a new document with an auto-generated ID
    const teacherRef = await db.collection('teachers').add(newTeacherData);

    // Update the teacher data with the generated ID as uid
    await teacherRef.update({ uid: teacherRef.id });
    const teacherDoc = await teacherRef.get();

    console.log('Teacher registered successfully:', teacherRef.id);
    res.status(201).json({
      message: 'Teacher registered successfully!',
      teacherId: teacherRef.id,
      data: teacherDoc.data()
    });

  } catch (error) {
    console.error('Error registering teacher:', error);
    res.status(500).json({ message: 'Error registering teacher.', error: error.message });
  }
};

module.exports = {
  registerTeacher,
};
