const { db } = require('../config/firebaseConfig');

// Get all users, with optional role filtering (Admin action)
const getAllUsers = async (req, res) => {
  try {
    // TODO: Ensure robust admin authentication (isAdmin middleware will be applied on the route)
    const { role } = req.query; // e.g., 'teacher', 'student_proxy' (verified phone numbers)

    let users = [];

    if (role === 'teacher' || !role || role === 'all') {
      const teachersSnapshot = await db.collection('teachers').orderBy('createdAt', 'desc').get();
      teachersSnapshot.forEach(doc => {
        const data = doc.data();
        users.push({
          id: doc.id,
          role: 'teacher',
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phoneNumber: data.phoneNumber || null,
          phoneNumberVerified: data.phoneNumberVerified || false,
          createdAt: data.createdAt, // Could be Firestore Timestamp or ISO string from model
          isActive: data.isActive !== undefined ? data.isActive : true, // Assuming teachers have an isActive field
        });
      });
    }

    // "Students" or general users are proxied by verified phone numbers for now
    // This needs to be expanded when a proper 'students' or general 'users' collection with registration data exists.
    if (role === 'student_proxy' || !role || role === 'all') {
      const verifiedCodesSnapshot = await db.collection('verificationCodes')
                                          .where('verified', '==', true)
                                          .orderBy('createdAt', 'desc') // Or 'verifiedAt' if it exists
                                          .get();

      verifiedCodesSnapshot.forEach(doc => {
        const data = doc.data();
        // Avoid adding duplicates if a teacher's phone was also in verificationCodes (though less likely with current flow)
        if (!users.some(u => u.phoneNumber === data.phoneNumber && u.role === 'teacher')) {
             users.push({
                id: doc.id, // This is the phone number
                role: 'student_proxy', // Indicate this is a user verified by phone, not fully registered student profile yet
                phoneNumber: data.phoneNumber,
                phoneNumberVerified: true,
                // Name/email not available from verificationCodes alone
                firstName: null,
                lastName: null,
                email: null,
                createdAt: data.createdAt, // Verification request creation time
                isActive: true, // Assume active if verified
            });
        }
      });
    }

    // Simple sort by creation date if mixing types and role is 'all' or not specified
    if (!role || role === 'all') {
        users.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA; // Descending
        });
    }


    // TODO: Implement pagination for large user bases
    res.status(200).json(users);

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users.', error: error.message });
  }
};

// Other user management functions for admin (e.g., viewUserDetails, updateUserStatus, deleteUser) can be added here.

const { setUserRoleClaim } = require('../utils/authUtils'); // For setting custom claims
const admin = require('firebase-admin'); // For FieldValue

module.exports = {
  getAllUsers,
  updateUserRole, // Add new function
};

// Update user role (Admin action)
const updateUserRole = async (req, res) => {
  // Admin performing this action is verified by verifyFirebaseToken and checkRole(['admin'])
  // req.user will contain the admin's details.
  // The userId to be modified comes from req.params
  try {
    const { userId } = req.params; // This is the UID of the user whose role is to be changed
    const { newRole } = req.body;

    if (!userId || !newRole) {
      return res.status(400).json({ message: "User ID (to be modified) and new role are required." });
    }

    // Validate newRole if necessary (e.g., ensure it's one of the predefined roles)
    const validRoles = ['student', 'teacher', 'admin', 'editor']; // Example valid roles
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({ message: `Invalid role: ${newRole}. Valid roles are: ${validRoles.join(', ')}` });
    }

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found in 'users' collection." });
    }

    // Step 1: Update role in Firestore 'users' collection
    await userRef.update({
      role: newRole,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Step 2: Set custom user claim in Firebase Authentication
    // This is critical for Firebase security rules and for ID tokens to reflect the new role.
    await setUserRoleClaim(userId, newRole);

    // Note: If updating to/from 'teacher', you might also need to create/delete/update
    // the corresponding document in the 'teachers' collection. This logic is not included here yet.
    // For example, if role changes from 'student' to 'teacher', a new teacher profile might need to be initiated.
    // If role changes from 'teacher' to 'student', the teacher profile might be deactivated or archived.

    console.log(`User ${userId} role updated to ${newRole} in Firestore and Firebase Auth custom claims.`);
    res.status(200).json({ message: `User role successfully updated to ${newRole}.` });

  } catch (error) {
    console.error(`Error updating role for user ${req.params.userId}:`, error);
    if (error.message.includes("No user record found for the provided user ID")) {
        return res.status(404).json({ message: "User not found in Firebase Authentication. Cannot set custom claim." });
    }
    res.status(500).json({ message: 'Error updating user role.', error: error.message });
  }
};
