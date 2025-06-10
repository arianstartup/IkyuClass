import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
// import { getFirestore } from 'firebase/firestore'; // If you need Firestore client-side
// import { getStorage } from 'firebase/storage'; // If you need Storage client-side

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "YOUR_APP_ID",
  // measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "YOUR_MEASUREMENT_ID" // Optional
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // If already initialized, use that app
}

const auth = getAuth(app);
// const db = getFirestore(app); // If using Firestore client-side
// const storage = getStorage(app); // If using Storage client-side

// Log a warning if placeholder values are used in a non-production environment
if (process.env.NODE_ENV !== 'production') {
  if (firebaseConfig.apiKey === "YOUR_API_KEY" ||
      firebaseConfig.authDomain === "YOUR_AUTH_DOMAIN" ||
      firebaseConfig.projectId === "YOUR_PROJECT_ID") {
    console.warn(
      "Firebase configuration is using placeholder values. " +
      "Please set up your .env.local file with actual Firebase project credentials. " +
      "Ensure NEXT_PUBLIC_ prefixed variables are used for client-side Firebase config."
    );
  }
}


export { app, auth /*, db, storage */ };
