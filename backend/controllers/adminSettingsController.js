const { db } = require('../config/firebaseConfig');
const admin = require('firebase-admin');

const SETTINGS_COLLECTION = 'platformSettings';
const MAIN_SETTINGS_DOC_ID = 'main_settings';

// Get platform settings
const getPlatformSettings = async (req, res) => {
  try {
    // TODO: Add robust admin authentication here
    const settingsRef = db.collection(SETTINGS_COLLECTION).doc(MAIN_SETTINGS_DOC_ID);
    const doc = await settingsRef.get();

    if (!doc.exists) {
      // If settings don't exist, return a default or empty object, or an error
      // For now, let's indicate they might not be set up yet, but still return success.
      return res.status(200).json({
        message: 'Platform settings not found. Please configure them.',
        settings: {}
      });
    }

    res.status(200).json({ settings: doc.data() });
  } catch (error) {
    console.error('Error fetching platform settings:', error);
    res.status(500).json({ message: 'Error fetching platform settings.', error: error.message });
  }
};

// Update platform settings
const updatePlatformSettings = async (req, res) => {
  try {
    // TODO: Add robust admin authentication here
    const settingsData = req.body;

    if (!settingsData || Object.keys(settingsData).length === 0) {
      return res.status(400).json({ message: 'No settings data provided.' });
    }

    // Optional: Add validation for specific fields if needed (e.g., format of keys)
    // Example:
    // if (settingsData.zarinpalMerchantId && typeof settingsData.zarinpalMerchantId !== 'string') {
    //   return res.status(400).json({ message: 'Invalid Zarinpal Merchant ID format.' });
    // }
    // if (settingsData.isZarinpalSandbox !== undefined && typeof settingsData.isZarinpalSandbox !== 'boolean') {
    //   return res.status(400).json({ message: 'isZarinpalSandbox must be a boolean.' });
    // }

    const settingsRef = db.collection(SETTINGS_COLLECTION).doc(MAIN_SETTINGS_DOC_ID);

    await settingsRef.set(
      {
        ...settingsData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true } // Use merge:true to update existing fields or create if not exists
    );

    // If it's the first time settings are created, add a createdAt timestamp
    const doc = await settingsRef.get();
    if (!doc.data().createdAt) {
        await settingsRef.update({ createdAt: admin.firestore.FieldValue.serverTimestamp() });
    }

    res.status(200).json({ message: 'Platform settings updated successfully.', newSettings: settingsData });
  } catch (error) {
    console.error('Error updating platform settings:', error);
    res.status(500).json({ message: 'Error updating platform settings.', error: error.message });
  }
};

// Helper function to be used by other config modules (not an API endpoint)
const fetchSettingsFromDB = async () => {
    try {
        const settingsRef = db.collection(SETTINGS_COLLECTION).doc(MAIN_SETTINGS_DOC_ID);
        const doc = await settingsRef.get();
        if (doc.exists) {
            return doc.data();
        }
        return null; // Or an empty object {}
    } catch (error) {
        console.error("Failed to fetch platform settings from Firestore:", error);
        return null; // Indicate failure to fetch
    }
};

module.exports = {
  getPlatformSettings,
  updatePlatformSettings,
  fetchSettingsFromDB, // Export helper
};
