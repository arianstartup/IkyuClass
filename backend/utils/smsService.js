const { getSmsProviderConfig } = require('../config/smsProviderConfig'); // Updated import

/**
 * Sends an SMS using a simulated provider.
 * In a real application, this would integrate with an actual SMS gateway API.
 * @param {string} phoneNumber The recipient's phone number.
 * @param {string} message The message content.
 * @returns {Promise<{success: boolean, messageId: string | null, error: string | null}>}
 */
async function sendSMS(phoneNumber, message) {
  const currentSmsConfig = getSmsProviderConfig(); // Get current config

  console.log("Attempting to send SMS via SimulatedSMSProvider...");
  console.log(` -> To: ${phoneNumber}`);
  console.log(` -> Message: "${message}"`);
  console.log(` -> Using Sender: ${currentSmsConfig.senderNumber} (API Key: ${currentSmsConfig.apiKey ? currentSmsConfig.apiKey.substring(0, 5) : 'N/A'}... )`);

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Simulate success/failure (can be made more complex if needed for testing)
  const isSuccessful = true; // Math.random() > 0.1; // 90% success rate

  if (isSuccessful) {
    const simulatedMessageId = `sim-sms-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    console.log(`Simulated SMS sent successfully. Message ID: ${simulatedMessageId}`);
    return Promise.resolve({ success: true, messageId: simulatedMessageId, error: null });
  } else {
    const errorMessage = "Simulated SMS sending failed (random failure).";
    console.error(errorMessage);
    return Promise.resolve({ success: false, messageId: null, error: errorMessage });
    // Or: return Promise.reject(new Error(errorMessage)); if you prefer to handle errors with .catch()
  }
}

module.exports = {
  sendSMS,
};
