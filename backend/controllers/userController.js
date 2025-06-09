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
      [], // Empty availability array initially
      { initialPasswordPlaceholder: password } // Storing password here is NOT secure for production
    );

    // Add a new document with an auto-generated ID
    const teacherRef = await db.collection('teachers').add(newTeacherData);

    // Update the teacher data with the generated ID as uid
    await teacherRef.update({ uid: teacherRef.id });
    const teacherDoc = await teacherRef.get();

    console.log('Teacher registered successfully (legacy endpoint):', teacherRef.id);
    res.status(201).json({
      message: 'Teacher registered successfully! (Legacy Endpoint)',
      teacherId: teacherRef.id,
      data: teacherDoc.data()
    });

  } catch (error) {
    console.error('Error registering teacher (legacy endpoint):', error);
    res.status(500).json({ message: 'Error registering teacher (legacy endpoint).', error: error.message });
  }
};


const registerTeacherFinal = async (req, res) => {
  try {
    const { email, firstName, lastName, subjectTaught, qualifications, password, phoneNumber /*, temporaryAuthToken */ } = req.body;

    // Basic validation for core fields (similar to legacy, but phoneNumber is key)
    if (!email || !firstName || !lastName || !subjectTaught || !qualifications || !password || !phoneNumber) {
      return res.status(400).json({ message: 'Missing required fields for final teacher registration.' });
    }

    // **Verification Check**
    // Option 1: Check temporaryAuthToken (if implemented and passed from frontend)
    // For now, we'll use Option 2: Check Firestore 'verificationCodes' collection.
    const verificationCodeRef = db.collection('verificationCodes').doc(phoneNumber);
    const verificationDoc = await verificationCodeRef.get();

    if (!verificationDoc.exists) {
        return res.status(400).json({ message: 'Phone number verification record not found. Please verify your phone number first.' });
    }
    const verificationData = verificationDoc.data();
    if (!verificationData.verified) {
        return res.status(400).json({ message: 'Phone number not verified. Please complete OTP verification.' });
    }
    // Consider checking verificationData.expiresAt as well, or if the token itself has an expiry.
    // For simplicity, if 'verified' is true, we proceed.

    // TODO: Optional: consume the temporaryAuthToken or mark verificationCode as used for this registration.
    // For example, you might want to delete the verificationDoc or set a flag like `registrationCompleted: true`
    // to prevent re-use of the same OTP verification for multiple registrations.
    // await verificationCodeRef.update({ registrationAttemptedAt: admin.firestore.FieldValue.serverTimestamp() });


    // Check if a teacher with this email or phone number already exists
    const emailCheck = await db.collection('teachers').where('email', '==', email).limit(1).get();
    if (!emailCheck.empty) {
        return res.status(409).json({ message: 'A teacher with this email already exists.' });
    }
    const phoneCheck = await db.collection('teachers').where('phoneNumber', '==', phoneNumber).limit(1).get();
    if (!phoneCheck.empty) {
        return res.status(409).json({ message: 'A teacher with this phone number already exists.' });
    }


    const newTeacherData = createTeacher(
      null, // Firestore will generate ID
      email,
      firstName,
      lastName,
      subjectTaught,
      qualifications,
      [], // Default empty availability
      {
        initialPasswordPlaceholder: password, // NOT secure for production
        phoneNumber: phoneNumber, // Store verified phone number
        phoneNumberVerified: true
      }
    );

    const teacherRef = await db.collection('teachers').add(newTeacherData);
    await teacherRef.update({ uid: teacherRef.id }); // Add Firestore generated ID as uid
    const teacherDoc = await teacherRef.get();

    // Optionally, delete or invalidate the OTP record after successful registration
    // await verificationCodeRef.delete(); // Or update a status field

    console.log('Teacher final registration successful:', teacherRef.id);
    res.status(201).json({
      message: 'Teacher registration successful with phone verification!',
      teacherId: teacherRef.id,
      data: teacherDoc.data()
    });

  } catch (error) {
    console.error('Error in final teacher registration:', error);
    res.status(500).json({ message: 'Error in final teacher registration.', error: error.message });
  }
};


module.exports = {
  registerTeacher, // Keep legacy for now, or deprecate
  registerTeacherFinal,
};
