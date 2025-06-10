const nodemailer = require('nodemailer');
const { getEmailConfig } = require('../config/emailConfig');

/**
 * Sends an email using Nodemailer.
 * @param {object} mailOptions
 * @param {string} mailOptions.to Recipient's email address.
 * @param {string} mailOptions.subject Email subject.
 * @param {string} mailOptions.text Plain text body.
 * @param {string} mailOptions.html HTML body.
 * @returns {Promise<{success: boolean, messageId: string | null, error: string | null, info: object | null}>}
 */
async function sendEmail({ to, subject, html, text }) {
  const config = getEmailConfig();

  if (!config.host) {
    console.error("Email Service Error: SMTP host is not configured. Cannot send email.");
    return { success: false, messageId: null, error: "SMTP host not configured.", info: null };
  }
   if (!to || !subject || (!html && !text)) {
    console.error("Email Service Error: Missing required fields (to, subject, body).");
    return { success: false, messageId: null, error: "Missing required email fields.", info: null };
  }


  // Create a transporter object using the dynamically fetched SMTP transport details
  // Some providers might not need user/pass if using other auth methods (e.g. AWS SES with IAM roles)
  let transporterOptions = {
    host: config.host,
    port: config.port,
    secure: config.secure, // true for 465, false for other ports (like 587 with STARTTLS)
  };

  if (config.auth.user && config.auth.pass) {
    transporterOptions.auth = {
      user: config.auth.user,
      pass: config.auth.pass,
    };
  } else if (config.auth.user && !config.auth.pass) {
      // Some SMTP (like certain local test servers) might only need user or no auth
      console.warn(`Email SMTP: User is set (${config.auth.user}) but no password. Assuming this is intentional for the provider.`);
      transporterOptions.auth = { user: config.auth.user, pass: ''}; // Send empty pass if user is there but pass isn't
  } else if (!config.auth.user && config.auth.pass){
      console.warn(`Email SMTP: Password is set but no user. This is unusual. Trying without explicit auth user.`);
      // nodemailer might still try anonymous auth or other methods if server supports
  }
  // If neither user nor pass, nodemailer will try to send unauthenticated, if server allows.


  try {
    const transporter = nodemailer.createTransport(transporterOptions);

    // Verify connection configuration (optional, but good for debugging)
    // await transporter.verify(); // This can throw an error if config is bad

    const mailToSend = {
      from: `"${config.fromAddress.split('@')[0]}" <${config.fromAddress}>`, // sender address (e.g., "My App <noreply@myapp.com>")
      to: to,         // list of receivers
      subject: subject, // Subject line
      text: text,       // plain text body
      html: html,       // html body
    };

    const info = await transporter.sendMail(mailToSend);
    console.log(`Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId, error: null, info: info };
  } catch (error) {
    console.error(`Error sending email to ${to} with subject "${subject}":`, error);
    return { success: false, messageId: null, error: error.message, info: null };
  }
}

module.exports = {
  sendEmail,
};
