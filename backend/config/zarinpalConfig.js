require('dotenv').config(); // Keep for direct env access as fallback
const { fetchSettingsFromDB } = require('../controllers/adminSettingsController'); // Path to fetch settings

let zarinpalConfig = {
  merchantID: process.env.ZARINPAL_MERCHANT_ID || 'FALLBACK_ZARINPAL_MERCHANT_ID',
  sandbox: process.env.ZARINPAL_SANDBOX_MODE === 'true', // Default to true if not set or invalid
  loadedFromDB: false,
};

// Function to asynchronously load settings and update the config object
async function initializeZarinpalConfig() {
  const dbSettings = await fetchSettingsFromDB();

  if (dbSettings && dbSettings.zarinpalMerchantId) {
    zarinpalConfig.merchantID = dbSettings.zarinpalMerchantId;
    // Ensure isZarinpalSandbox from DB is explicitly boolean true, otherwise default to sandbox for safety if field is missing/malformed.
    zarinpalConfig.sandbox = dbSettings.isZarinpalSandbox === true;
    zarinpalConfig.loadedFromDB = true;
    console.log("Zarinpal config loaded from Firestore DB.");
  } else {
    console.log("Zarinpal config: Using environment variable fallbacks (DB settings not found or incomplete).");
    // Ensure defaults are robust if DB settings are absent
    if (zarinpalConfig.merchantID === 'FALLBACK_ZARINPAL_MERCHANT_ID' || !process.env.ZARINPAL_MERCHANT_ID) {
        console.warn("CRITICAL: Zarinpal Merchant ID is not set in environment variables or DB. Using placeholder.");
    }
  }
  // This function doesn't return; it modifies the zarinpalConfig object.
  // The getZarinpalConfig function will return the (potentially updated) object.
}

// Call initializeZarinpalConfig when this module is first loaded.
// This is an async operation. The getZarinpalConfig might return initial env values
// until this promise resolves. Controllers should ideally call getZarinpalConfig
// at the time of use, or this module needs to export a promise that resolves to the config.
// For simplicity here, we'll let it update in the background.
// A more robust approach might involve an init function that must be awaited by the app's startup.
const configPromise = initializeZarinpalConfig();


// Export a function that returns the current config object.
// It might return the initial env-based config if the DB fetch hasn't completed yet.
// For critical operations, ensure this is handled (e.g., by awaiting configPromise at app start).
function getZarinpalConfig() {
  return zarinpalConfig;
}

module.exports = {
  getZarinpalConfig,
  configPromise // Export the promise if other modules need to wait for DB load
};
