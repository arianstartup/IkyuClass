// Default structure for a generic student
function createStudent(uid, email, firstName, lastName, additionalDetails = {}) {
  return {
    uid, // User ID from Firebase Auth (once implemented) or Firestore doc ID
    email, // Email address
    firstName,
    lastName,
    role: 'student', // Predefined role
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...additionalDetails, // e.g., grade, school, interests
  };
}

// Structure for a university student, extending the generic student
function createUniversityStudent(uid, email, firstName, lastName, universityName, studentId, major, additionalDetails = {}) {
  return {
    ...createStudent(uid, email, firstName, lastName, { universityName, studentId, major, ...additionalDetails }),
    role: 'universityStudent', // Specific role
  };
}

// Structure for a teacher
function createTeacher(uid, email, firstName, lastName, subjectTaught, qualifications, availability = [], additionalDetails = {}) {
  return {
    uid,
    email,
    firstName,
    lastName,
    role: 'teacher',
    subjectTaught, // e.g., ['Math', 'Physics']
    qualifications, // e.g., 'MSc in Physics'
    availability, // Array of availability slots e.g., [{ dayOfWeek: 'شنبه', startTime: '09:00', endTime: '17:00', type: 'online' }]
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...additionalDetails, // e.g., yearsOfExperience, officeHours, hourlyRate
  };
}

module.exports = {
  createStudent,
  createUniversityStudent,
  createTeacher,
};
