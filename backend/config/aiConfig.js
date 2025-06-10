require('dotenv').config(); // For fallback
const { fetchSettingsFromDB } = require('../controllers/adminSettingsController'); // To fetch settings from DB

let aiConfig = {
  geminiApiKey: process.env.GEMINI_API_KEY || 'FALLBACK_GEMINI_API_KEY', // Fallback to environment variable
  loadedFromDB: false,
};

async function initializeAiConfig() {
  const dbSettings = await fetchSettingsFromDB();
  if (dbSettings && dbSettings.geminiApiKey) {
    aiConfig.geminiApiKey = dbSettings.geminiApiKey;
    aiConfig.loadedFromDB = true;
    console.log("AI (Gemini) config loaded from Firestore DB.");
  } else {
    console.log("AI (Gemini) config: Using environment variable fallback (DB settings not found or geminiApiKey missing).");
    if (aiConfig.geminiApiKey === 'FALLBACK_GEMINI_API_KEY' || !process.env.GEMINI_API_KEY) {
      console.warn("Warning: Gemini API Key is not set in environment variables or DB. Using placeholder.");
    }
  }
}

// Initialize config when module is loaded
const configPromise = initializeAiConfig();

function getAiConfig() {
  return aiConfig;
}

module.exports = {
  getAiConfig,
  configPromise,
};
