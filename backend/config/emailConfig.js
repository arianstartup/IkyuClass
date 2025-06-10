require('dotenv').config(); // For fallback
const { fetchSettingsFromDB } = require('../controllers/adminSettingsController');

let emailConfig = {
  host: process.env.EMAIL_SMTP_HOST || '',
  port: parseInt(process.env.EMAIL_SMTP_PORT || '587', 10), // Default to 587 if not set
  secure: process.env.EMAIL_SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_SMTP_USER || '',
    pass: process.env.EMAIL_SMTP_PASS || '',
  },
  fromAddress: process.env.EMAIL_SENDER_ADDRESS || 'noreply@example.com',
  loadedFromDB: false,
};

async function initializeEmailConfig() {
  const dbSettings = await fetchSettingsFromDB();

  if (dbSettings) {
    emailConfig.host = dbSettings.emailSmtpHost || emailConfig.host;
    emailConfig.port = dbSettings.emailSmtpPort ? parseInt(dbSettings.emailSmtpPort, 10) : emailConfig.port;
    // Ensure 'secure' from DB is explicitly boolean true, otherwise it's false.
    emailConfig.secure = dbSettings.emailSmtpSecure === true;
    emailConfig.auth.user = dbSettings.emailSmtpUser || emailConfig.auth.user;
    emailConfig.auth.pass = dbSettings.emailSmtpPassword || emailConfig.auth.pass; // Password might be sensitive to log
    emailConfig.fromAddress = dbSettings.emailSenderAddress || emailConfig.fromAddress;

    if (dbSettings.emailSmtpHost) { // Consider it loaded from DB if at least host is set
        emailConfig.loadedFromDB = true;
        console.log("Email SMTP config partially or fully loaded from Firestore DB.");
    } else {
        console.log("Email SMTP config: Using environment variable fallbacks (DB settings not found or incomplete for email).");
    }
  } else {
    console.log("Email SMTP config: Using environment variable fallbacks (No DB settings document found).");
  }

  // Warnings for missing critical info if not loaded from DB and not in ENV
  if (!emailConfig.host && !emailConfig.loadedFromDB) {
    console.warn("CRITICAL: Email SMTP Host is not set in environment variables or DB. Email sending will likely fail.");
  }
  if (!emailConfig.auth.user && !emailConfig.loadedFromDB) {
    // console.warn("Warning: Email SMTP User is not set. This might be acceptable for some providers.");
  }
  if (!emailConfig.fromAddress.includes('@') && !emailConfig.loadedFromDB) {
      console.warn("Warning: Email Sender Address seems invalid.");
  }
}

const configPromise = initializeEmailConfig();

function getEmailConfig() {
  return emailConfig;
}

module.exports = {
  getEmailConfig,
  configPromise,
};
