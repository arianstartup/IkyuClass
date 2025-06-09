const admin = require('firebase-admin');

// Path to your service account key file
// IMPORTANT: Replace this with the actual path to your service account key file
// or use environment variables to store the path or the key content itself.
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || './serviceAccountKey.json';

try {
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log('Firebase Admin SDK initialized successfully.');

} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  // Optionally, exit the application if Firebase initialization fails
  // process.exit(1);
}

const db = admin.firestore();

module.exports = { admin, db };
