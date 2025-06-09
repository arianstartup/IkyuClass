require('dotenv').config(); // Keep for direct env access as fallback
const { fetchSettingsFromDB } = require('../controllers/adminSettingsController'); // Path to fetch settings

let smsConfig = {
  apiKey: process.env.SIMULATED_SMS_API_KEY || 'FALLBACK_SMS_API_KEY',
  senderNumber: process.env.SIMULATED_SMS_SENDER_NUMBER || 'FALLBACK_SENDER_NUMBER',
  loadedFromDB: false,
};

async function initializeSmsConfig() {
  const dbSettings = await fetchSettingsFromDB();
  if (dbSettings && dbSettings.smsApiKey && dbSettings.smsSenderNumber) {
    smsConfig.apiKey = dbSettings.smsApiKey;
    smsConfig.senderNumber = dbSettings.smsSenderNumber;
    smsConfig.loadedFromDB = true;
    console.log("SMS Provider config loaded from Firestore DB.");
  } else {
    console.log("SMS Provider config: Using environment variable fallbacks (DB settings not found or incomplete).");
    if (smsConfig.apiKey === 'FALLBACK_SMS_API_KEY' || !process.env.SIMULATED_SMS_API_KEY) {
        console.warn("Warning: SMS API Key is not set in environment variables or DB. Using placeholder.");
    }
    if (smsConfig.senderNumber === 'FALLBACK_SENDER_NUMBER' || !process.env.SIMULATED_SMS_SENDER_NUMBER) {
        console.warn("Warning: SMS Sender Number is not set in environment variables or DB. Using placeholder.");
    }
  }
}

const configPromise = initializeSmsConfig();

function getSmsProviderConfig() {
  return smsConfig;
}

module.exports = {
  getSmsProviderConfig,
  configPromise
};
