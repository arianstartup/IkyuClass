require('dotenv').config();

const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || "SUPER_SECRET_ADMIN_KEY_FOR_DEV_ONLY";

// Basic Admin Authentication Middleware (Temporary & Insecure for Production)
const isAdmin = (req, res, next) => {
  const adminAuthHeader = req.headers['x-admin-auth'];
  const adminSecretQuery = req.query.admin_secret;

  if (adminAuthHeader === 'true' || (ADMIN_SECRET_KEY && adminSecretQuery === ADMIN_SECRET_KEY)) {
    // In a real app, you'd verify a JWT token, check user roles from DB, etc.
    console.log("Admin access granted (simulated).");
    next();
  } else {
    console.warn("Admin access denied (simulated). Missing or invalid X-Admin-Auth header or admin_secret query.");
    res.status(403).json({ message: 'Forbidden: Admin access required.' });
  }
};

// Placeholder for user authentication middleware (e.g., JWT verification)
const isAuthenticated = (req, res, next) => {
  // Example: Check for a JWT in Authorization header
  // const token = req.headers.authorization?.split(' ')[1];
  // if (token) {
  //   try {
  //     const decoded = jwt.verify(token, process.env.JWT_SECRET);
  //     req.user = decoded; // Add user info to request object
  //     next();
  //   } catch (ex) {
  //     res.status(401).json({ message: 'Unauthorized: Invalid token.' });
  //   }
  // } else {
  //   res.status(401).json({ message: 'Unauthorized: No token provided.' });
  // }
  console.log("User authentication middleware (placeholder) called.");
  // For now, let's assume all users are "authenticated" for non-admin routes if needed,
  // or specific routes will handle if user data is missing.
  // To make it more realistic for routes that expect req.user:
  // req.user = { id: req.body.userId || req.query.userId || "temp_user_id_from_middleware" };
  next();
};


module.exports = {
  isAdmin,
  isAuthenticated, // Export placeholder
};
