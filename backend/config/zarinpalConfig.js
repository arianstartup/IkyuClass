require('dotenv').config();

const zarinpalMerchantID = process.env.ZARINPAL_MERCHANT_ID || 'YOUR_ZARINPAL_MERCHANT_ID_GOES_HERE'; // Default for testing if not set
const zarinpalSandboxMode = process.env.ZARINPAL_SANDBOX_MODE === 'true'; // Use sandbox mode for testing

if (process.env.NODE_ENV !== 'production' && zarinpalMerchantID === 'YOUR_ZARINPAL_MERCHANT_ID_GOES_HERE') {
  console.warn("Zarinpal Merchant ID is not set in environment variables. Using default placeholder.");
}

// The Zarinpal SDK might be initialized here or within the payment controller.
// For now, just exporting the config values.
// const ZarinpalCheckout = require('zarinpal-checkout');
// const zarinpal = ZarinpalCheckout.create(zarinpalMerchantID, zarinpalSandboxMode);

module.exports = {
  merchantID: zarinpalMerchantID,
  sandbox: zarinpalSandboxMode, // Some SDKs might take a boolean, others a URL
  // zarinpalInstance: zarinpal // Export instance if initialized here
};
