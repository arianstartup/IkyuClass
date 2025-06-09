const { db } = require('../config/firebaseConfig');
const zarinpalConfig = require('../config/zarinpalConfig');
const ZarinpalCheckout = require('zarinpal-checkout'); // Assuming this is the SDK
const admin = require('firebase-admin');

// Initialize Zarinpal
// Note: In a real scenario, ensure the SDK is compatible and handles sandbox mode correctly.
// The 'zarinpal-checkout' package might have different initialization. This is a general structure.
const zarinpal = ZarinpalCheckout.create(zarinpalConfig.merchantID, zarinpalConfig.sandbox);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const CALLBACK_BASE_URL = process.env.CALLBACK_BASE_URL || 'http://localhost:3001';


// Initiate payment for a booking
const initiateBookingPayment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { studentId } = req.body; // In a real app, studentId should come from req.user (authenticated user)

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required." });
    }

    const bookingRef = db.collection('bookings').doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return res.status(404).json({ message: "Booking not found." });
    }

    const bookingData = bookingDoc.data();

    // Verify ownership and status
    if (bookingData.studentId !== studentId) {
      return res.status(403).json({ message: "You are not authorized to pay for this booking." });
    }
    if (bookingData.status !== 'pending_payment') {
      return res.status(400).json({ message: `Booking is not pending payment. Current status: ${bookingData.status}` });
    }
    if (!bookingData.price || bookingData.price <= 0) {
        return res.status(400).json({ message: "Booking price is not valid." });
    }

    const amount = bookingData.price.toString(); // Zarinpal expects amount as string
    const description = `پرداخت هزینه رزرو جلسه - شناسه: ${bookingId}`;
    const callbackURL = `${CALLBACK_BASE_URL}/api/payments/zarinpal/verify`;
    // Zarinpal may also accept email and mobile for the user in the payment request
    // const userEmail = "user@example.com"; // Fetch from student profile if available
    // const userMobile = "09123456789";    // Fetch from student profile if available

    console.log(`Attempting payment for booking ${bookingId} with amount ${amount}`);

    // Using the zarinpal-checkout SDK structure (this is an assumption of its API)
    const paymentResponse = await zarinpal.PaymentRequest({
      Amount: amount,
      Description: description,
      CallbackURL: callbackURL,
      // Email: userEmail, // Optional
      // Mobile: userMobile, // Optional
    });

    // Response structure from zarinpal-checkout might differ.
    // Typically, it includes a status (100 for success) and an authority.
    if (paymentResponse.status === 100 && paymentResponse.authority) {
      await bookingRef.update({
        paymentAuthority: paymentResponse.authority,
        paymentGateway: 'Zarinpal',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      // The URL to redirect the user to. For sandbox, it might be different.
      const paymentGatewayURL = zarinpal.GateIsEnabled // Check if sandbox or not, SDK might handle this
        ? `https://www.zarinpal.com/pg/StartPay/${paymentResponse.authority}`
        : `https://sandbox.zarinpal.com/pg/StartPay/${paymentResponse.authority}`;

      console.log(`Payment request successful for ${bookingId}. Authority: ${paymentResponse.authority}. URL: ${paymentGatewayURL}`);
      res.status(200).json({ paymentGatewayURL });
    } else {
      console.error("Zarinpal PaymentRequest failed:", paymentResponse);
      // Provide a more specific error based on Zarinpal's status codes if possible
      throw new Error(`خطا در ایجاد تراکنش زرین پال: ${paymentResponse.status || 'Unknown Error'}`);
    }

  } catch (error) {
    console.error('Error initiating payment:', error);
    res.status(500).json({ message: 'Error initiating payment.', error: error.message });
  }
};

// Verify Zarinpal payment (callback)
const verifyZarinpalPayment = async (req, res) => {
  // Zarinpal typically sends Authority and Status via GET query parameters
  const { Authority, Status } = req.query;

  if (!Authority || !Status) {
    console.error("Zarinpal verification callback missing Authority or Status.");
    return res.redirect(`${FRONTEND_URL}/bookings/payment/failed?error=InvalidCallbackParams`);
  }

  let bookingId = null; // To pass to redirect URL

  try {
    const bookingsQuery = db.collection('bookings').where('paymentAuthority', '==', Authority);
    const querySnapshot = await bookingsQuery.get();

    if (querySnapshot.empty) {
      console.error(`No booking found with paymentAuthority: ${Authority}`);
      return res.redirect(`${FRONTEND_URL}/bookings/payment/failed?error=BookingNotFoundForAuthority`);
    }

    const bookingDoc = querySnapshot.docs[0]; // Assuming authority is unique
    bookingId = bookingDoc.id;
    const bookingData = bookingDoc.data();

    if (bookingData.status !== 'pending_payment' && bookingData.status !== 'confirmed') { // Could be already confirmed if callback is hit multiple times
      console.log(`Booking ${bookingId} already processed. Status: ${bookingData.status}`);
      // If already confirmed, redirect to success. Otherwise, it might be an issue.
      if (bookingData.status === 'confirmed') {
        return res.redirect(`${FRONTEND_URL}/bookings/payment/success?bookingId=${bookingId}&refId=${bookingData.paymentRefId || ''}`);
      }
      return res.redirect(`${FRONTEND_URL}/bookings/payment/failed?bookingId=${bookingId}&error=BookingAlreadyProcessed`);
    }

    const amount = bookingData.price.toString();

    if (Status === 'OK') {
      console.log(`Payment for booking ${bookingId} (Authority: ${Authority}) reported OK by Zarinpal. Verifying...`);
      const verificationResponse = await zarinpal.PaymentVerification({
        Amount: amount,
        Authority: Authority,
      });

      if (verificationResponse.status === 100 || verificationResponse.status === 101) { // 101 means already verified but OK
        console.log(`Payment verification successful for booking ${bookingId}. RefID: ${verificationResponse.RefID}`);
        await bookingDoc.ref.update({
          status: 'confirmed',
          paymentRefId: verificationResponse.RefID.toString(), // Convert to string if it's a number
          paymentTimestamp: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return res.redirect(`${FRONTEND_URL}/bookings/payment/success?bookingId=${bookingId}&refId=${verificationResponse.RefID}`);
      } else {
        console.error(`Zarinpal PaymentVerification failed for booking ${bookingId}:`, verificationResponse);
        await bookingDoc.ref.update({
          status: 'payment_failed', // Or keep as pending_payment
          paymentError: `Verification failed with status: ${verificationResponse.status}`,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return res.redirect(`${FRONTEND_URL}/bookings/payment/failed?bookingId=${bookingId}&error=VerificationFailed&status=${verificationResponse.status}`);
      }
    } else { // Status !== 'OK' (e.g., 'NOK' for user cancelled)
      console.log(`Payment cancelled or failed by user for booking ${bookingId}. Status: ${Status}`);
      await bookingDoc.ref.update({
        status: 'payment_failed', // Or 'cancelled_by_user'
        paymentError: `Payment cancelled or failed before verification. Status: ${Status}`,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return res.redirect(`${FRONTEND_URL}/bookings/payment/failed?bookingId=${bookingId}&error=PaymentCancelled&status=${Status}`);
    }
  } catch (error) {
    console.error('Error verifying Zarinpal payment:', error);
    const redirectUrl = bookingId
      ? `${FRONTEND_URL}/bookings/payment/failed?bookingId=${bookingId}&error=VerificationException`
      : `${FRONTEND_URL}/bookings/payment/failed?error=VerificationExceptionUnknownBooking`;
    return res.redirect(redirectUrl);
  }
};


module.exports = {
  initiateBookingPayment,
  verifyZarinpalPayment,
};
