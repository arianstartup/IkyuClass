const admin = require('firebase-admin'); // Assuming firebase-admin is initialized and available

/**
 * Sets a custom user claim for role-based access control.
 * @param {string} uid The user's UID from Firebase Authentication.
 * @param {string} role The role to set (e.g., 'teacher', 'student', 'admin').
 * @returns {Promise<void>}
 * @throws Will throw an error if setting claims fails.
 */
async function setUserRoleClaim(uid, role) {
  if (!uid || !role) {
    throw new Error('UID and role are required to set custom user claims.');
  }

  try {
    // Ensure current user claims are fetched to avoid overwriting other claims if they exist.
    // However, setCustomUserClaims overwrites all custom claims.
    // If you need to preserve other claims, fetch them first, merge, then set.
    // For this specific use case where we are primarily setting the 'role' claim upon registration
    // or admin update, directly setting it is often acceptable.
    // If other claims are managed elsewhere, this approach needs refinement.

    // const existingClaims = (await admin.auth().getUser(uid)).customClaims;
    // await admin.auth().setCustomUserClaims(uid, { ...existingClaims, role: role });

    await admin.auth().setCustomUserClaims(uid, { role: role });
    console.log(`Custom claim { role: '${role}' } set successfully for user ${uid}`);
  } catch (error) {
    console.error(`Error setting custom claims for user ${uid}:`, error);
    // Rethrow the error to be handled by the calling function, or handle more specifically here
    throw new Error(`Failed to set user role claim for ${uid}: ${error.message}`);
  }
}

/**
 * Verifies a Firebase ID token and checks if the user has the required role.
 * This is a more robust authentication middleware than the placeholder `isAdmin`.
 * @param {string[]} requiredRoles Array of roles that are allowed to access the route.
 */
// Example of a more robust auth middleware using JWT and custom claims (for future use)
// const verifyFirebaseTokenAndRole = (requiredRoles = []) => {
//   return async (req, res, next) => {
//     const idToken = req.headers.authorization?.split('Bearer ')[1];
//     if (!idToken) {
//       return res.status(401).json({ message: 'Unauthorized: No Firebase ID token provided.' });
//     }
//     try {
//       const decodedToken = await admin.auth().verifyIdToken(idToken);
//       req.user = decodedToken; // Contains uid, email, role (if set as custom claim), etc.

//       if (requiredRoles.length > 0 && !requiredRoles.includes(decodedToken.role)) {
//         return res.status(403).json({ message: `Forbidden: User does not have required role(s). Required: ${requiredRoles.join(', ')}`});
//       }

//       next();
//     } catch (error) {
//       console.error('Error verifying Firebase ID token:', error);
//       return res.status(401).json({ message: 'Unauthorized: Invalid Firebase ID token.', error: error.message });
//     }
//   };
// };


module.exports = {
  setUserRoleClaim,
  // verifyFirebaseTokenAndRole // Export if you want to use it elsewhere
};
