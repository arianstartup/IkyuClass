const { db } = require('../config/firebaseConfig');
const { createTeacher } = require('../models/userTypes');
const admin = require('firebase-admin'); // Ensure admin is imported
const { setUserRoleClaim } = require('../utils/authUtils');
const { sendEmail } = require('../utils/emailService'); // Import email service
const { getWelcomeEmailTemplate } = require('../utils/emailTemplates'); // Import email template

const registerTeacher = async (req, res) => {
  try {
    const { email, firstName, lastName, subjectTaught, qualifications, password } = req.body;
    if (!email || !firstName || !lastName || !subjectTaught || !qualifications || !password) {
      return res.status(400).json({ message: 'Missing required fields for teacher registration.' });
    }
    const newTeacherData = createTeacher(
      null, email, firstName, lastName, subjectTaught, qualifications, [],
      { initialPasswordPlaceholder: password }
    );
    const teacherRef = await db.collection('teachers').add(newTeacherData);
    await teacherRef.update({ uid: teacherRef.id });
    const teacherDoc = await teacherRef.get();
    console.log('Teacher registered successfully (legacy endpoint):', teacherRef.id);
    res.status(201).json({
      message: 'Teacher registered successfully! (Legacy Endpoint)',
      teacherId: teacherRef.id, data: teacherDoc.data()
    });
  } catch (error) {
    console.error('Error registering teacher (legacy endpoint):', error);
    res.status(500).json({ message: 'Error registering teacher (legacy endpoint).', error: error.message });
  }
};

const registerTeacherFinal = async (req, res) => {
  try {
    const { email, firstName, lastName, subjectTaught, qualifications, password, phoneNumber } = req.body;
    if (!email || !firstName || !lastName || !subjectTaught || !qualifications || !password || !phoneNumber) {
      return res.status(400).json({ message: 'Missing required fields for final teacher registration.' });
    }

    const verificationCodeRef = db.collection('verificationCodes').doc(phoneNumber);
    const verificationDoc = await verificationCodeRef.get();
    if (!verificationDoc.exists || !verificationDoc.data().verified) {
      return res.status(400).json({ message: 'Phone number not verified or verification record not found.' });
    }

    let firebaseUser;
    try {
      firebaseUser = await admin.auth().createUser({
        phoneNumber: phoneNumber, password: password, displayName: `${firstName} ${lastName}`,
        email: email, emailVerified: false,
      });
      console.log('Successfully created new user in Firebase Auth:', firebaseUser.uid);
    } catch (authError) {
      console.error('Error creating user in Firebase Auth:', authError);
      if (authError.code === 'auth/email-already-exists') return res.status(409).json({ message: 'این ایمیل قبلاً ثبت نام شده است.' });
      if (authError.code === 'auth/phone-number-already-exists') return res.status(409).json({ message: 'این شماره تلفن قبلاً ثبت نام شده است.' });
      return res.status(500).json({ message: 'خطا در ایجاد کاربر در سیستم احراز هویت.', error: authError.message });
    }

    const uid = firebaseUser.uid;
    const userRef = db.collection('users').doc(uid);
    const commonUserData = {
      uid, firstName, lastName, email, phoneNumber, phoneNumberVerified: true, role: 'teacher',
      createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp(), isActive: true,
    };
    await userRef.set(commonUserData);

    const teacherSpecificData = createTeacher(uid, email, firstName, lastName, subjectTaught, qualifications, []);
    delete teacherSpecificData.uid; delete teacherSpecificData.email; delete teacherSpecificData.firstName;
    delete teacherSpecificData.lastName; delete teacherSpecificData.role; delete teacherSpecificData.createdAt;
    delete teacherSpecificData.updatedAt;

    const teacherRef = db.collection('teachers').doc(uid);
    await teacherRef.set({
        ...teacherSpecificData, uid: uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await verificationCodeRef.delete();

    try {
      await setUserRoleClaim(uid, 'teacher');
    } catch (claimError) {
      console.error(`Failed to set custom role claim for teacher ${uid}:`, claimError.message);
    }

    console.log('Teacher final registration successful, user and teacher profiles created, role claim attempted:', uid);

    // Send welcome email (fire and forget, don't let it block response)
    try {
      const { subject, html, text } = getWelcomeEmailTemplate(`${firstName} ${lastName}`, 'teacher');
      await sendEmail({ to: email, subject, html, text });
      console.log(`Welcome email sent to new teacher ${email}`);
    } catch (emailError) {
      console.error(`Failed to send welcome email to ${email}:`, emailError);
    }

    res.status(201).json({ message: 'ثبت نام معلم با موفقیت انجام شد و حساب کاربری ایجاد گردید!', userId: uid });
  } catch (error) {
    console.error('Error in final teacher registration:', error);
    res.status(500).json({ message: 'خطا در تکمیل نهایی ثبت نام معلم.', error: error.message });
  }
};

const registerStudentFinal = async (req, res) => {
  try {
    const { email, firstName, lastName, password, phoneNumber } = req.body;
    if (!email || !firstName || !lastName || !password || !phoneNumber) {
      return res.status(400).json({ message: 'Missing required fields for student registration (email, name, password, phone).' });
    }

    const verificationCodeRef = db.collection('verificationCodes').doc(phoneNumber);
    const verificationDoc = await verificationCodeRef.get();
    if (!verificationDoc.exists || !verificationDoc.data().verified) {
      return res.status(400).json({ message: 'Phone number not verified or verification record not found.' });
    }

    let firebaseUser;
    try {
      firebaseUser = await admin.auth().createUser({
        phoneNumber: phoneNumber, password: password, displayName: `${firstName} ${lastName}`,
        email: email, emailVerified: false,
      });
      console.log('Successfully created new student user in Firebase Auth:', firebaseUser.uid);
    } catch (authError) {
      console.error('Error creating student user in Firebase Auth:', authError);
      if (authError.code === 'auth/email-already-exists') return res.status(409).json({ message: 'این ایمیل قبلاً ثبت نام شده است.' });
      if (authError.code === 'auth/phone-number-already-exists') return res.status(409).json({ message: 'این شماره تلفن قبلاً ثبت نام شده است.' });
      return res.status(500).json({ message: 'خطا در ایجاد کاربر دانش‌آموز در سیستم احراز هویت.', error: authError.message });
    }

    const uid = firebaseUser.uid;
    const userRef = db.collection('users').doc(uid);
    const studentUserData = {
      uid, firstName, lastName, email, phoneNumber, phoneNumberVerified: true, role: 'student',
      createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp(), isActive: true,
    };
    await userRef.set(studentUserData);

    await verificationCodeRef.delete();

    try {
      await setUserRoleClaim(uid, 'student');
    } catch (claimError) {
      console.error(`Failed to set custom role claim for student ${uid}:`, claimError.message);
    }

    console.log('Student final registration successful, user profile created, role claim attempted:', uid);
    res.status(201).json({ message: 'ثبت نام دانش‌آموز با موفقیت انجام شد و حساب کاربری ایجاد گردید!', userId: uid });
  } catch (error) {
    console.error('Error in final student registration:', error);
    res.status(500).json({ message: 'خطا در تکمیل نهایی ثبت نام دانش‌آموز.', error: error.message });
  }
};

module.exports = {
  registerTeacher,
  registerTeacherFinal,
  registerStudentFinal,
};
