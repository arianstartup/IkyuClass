require('dotenv').config();
const admin = require('firebase-admin'); // For Firebase Admin SDK

// This is the old simulated admin auth - will be removed or replaced
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || "SUPER_SECRET_ADMIN_KEY_FOR_DEV_ONLY";
const simulatedIsAdmin = (req, res, next) => {
  const adminAuthHeader = req.headers['x-admin-auth'];
  const adminSecretQuery = req.query.admin_secret;
  if (adminAuthHeader === 'true' || (ADMIN_SECRET_KEY && adminSecretQuery === ADMIN_SECRET_KEY)) {
    console.log("Admin access granted (simulated).");
    // Simulate req.user for admin if needed by subsequent logic before full JWT integration
    // req.user = { uid: 'simulated_admin_uid', role: 'admin' };
    next();
  } else {
    console.warn("Admin access denied (simulated). Missing or invalid X-Admin-Auth header or admin_secret query.");
    return res.status(403).json({ message: 'Forbidden: Admin access required (simulated check failed).' });
  }
};


// New Firebase Token Verification Middleware
const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No Firebase ID token provided or malformed header.' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // This includes uid, email, and custom claims like 'role'
    console.log(`Token verified for UID: ${req.user.uid}, Role: ${req.user.role}`);
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({ message: 'Unauthorized: Firebase ID token has expired.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ message: 'Unauthorized: Invalid Firebase ID token.', error: error.message });
  }
};

// Role Check Middleware Factory
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) { // Should be set by verifyFirebaseToken before this
      return res.status(401).json({ message: 'Unauthorized: User not authenticated.' });
    }
    const userRole = req.user.role; // Role from custom claim
    if (allowedRoles.includes(userRole)) {
      next();
    } else {
      return res.status(403).json({
        message: `Forbidden: User role (${userRole}) is not authorized for this resource. Allowed roles: ${allowedRoles.join(', ')}.`
      });
    }
  };
};


module.exports = {
  simulatedIsAdmin, // Keep for now if any routes still use it transitionally, but should be removed.
  verifyFirebaseToken,
  checkRole,
};
