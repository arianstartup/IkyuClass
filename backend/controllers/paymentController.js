const { db } = require('../config/firebaseConfig');
const { getZarinpalConfig } = require('../config/zarinpalConfig'); // Updated import
const ZarinpalCheckout = require('zarinpal-checkout'); // Assuming this is the SDK
const admin = require('firebase-admin');

// Zarinpal instance will be created dynamically within functions after config is fetched.
// let zarinpal; // To be initialized after fetching config

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const CALLBACK_BASE_URL = process.env.CALLBACK_BASE_URL || 'http://localhost:3001';


// Initiate payment for a booking
const initiateBookingPayment = async (req, res) => {
  const currentZarinpalConfig = getZarinpalConfig(); // Get current config
  // It's better to initialize SDK here if it depends on fetched config,
  // or ensure the global `zarinpal` instance is re-initialized if config changes.
  // For simplicity, assuming zarinpal-checkout SDK can be re-instantiated or its properties set.
  const zarinpal = ZarinpalCheckout.create(currentZarinpalConfig.merchantID, currentZarinpalConfig.sandbox);

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

// Verify Zarinpal payment (callback) - Now handles different order types
const verifyZarinpalPayment = async (req, res) => {
  const currentZarinpalConfig = getZarinpalConfig();
  const zarinpal = ZarinpalCheckout.create(currentZarinpalConfig.merchantID, currentZarinpalConfig.sandbox);

  const { Authority, Status, type, orderId: queryOrderId } = req.query; // 'type' to distinguish order, 'orderId' as fallback if needed.

  if (!Authority || !Status) {
    console.error("Zarinpal verification callback missing Authority or Status.");
    return res.redirect(`${FRONTEND_URL}/payment/failed?error=InvalidCallbackParams`); // Generic failure page
  }

  let orderDocRef;
  let orderData;
  let orderCollectionName;
  let localOrderId = queryOrderId; // Use orderId from query first if available, useful for store_orders
  let successRedirectPath = '/';
  let failureRedirectPath = '/';

  try {
    if (type === 'store_order') {
      orderCollectionName = 'storeOrders';
      successRedirectPath = `/store/checkout/success`; // Specific success page for store orders
      failureRedirectPath = `/store/checkout/failed`;
    } else { // Default to 'booking' or if type is not specified
      orderCollectionName = 'bookings';
      successRedirectPath = `/bookings/payment/success`;
      failureRedirectPath = `/bookings/payment/failed`;
    }

    // Find the order/booking by paymentAuthority
    const orderQuery = db.collection(orderCollectionName).where('paymentAuthority', '==', Authority).limit(1);
    const querySnapshot = await orderQuery.get();

    if (querySnapshot.empty) {
      console.error(`No order/booking found with paymentAuthority: ${Authority} in collection ${orderCollectionName}`);
      return res.redirect(`${FRONTEND_URL}${failureRedirectPath}?error=OrderNotFoundForAuthority&authority=${Authority}`);
    }

    const orderDoc = querySnapshot.docs[0];
    orderDocRef = orderDoc.ref;
    orderData = orderDoc.data();
    localOrderId = orderDoc.id; // Use the ID from the found document

    // Construct specific redirect paths with the actual order/booking ID
    successRedirectPath = `${successRedirectPath}?orderId=${localOrderId}`;
    failureRedirectPath = `${failureRedirectPath}?orderId=${localOrderId}`;


    if (orderData.status !== 'pending_payment' && orderData.status !== 'confirmed' && orderData.status !== 'paid') {
      console.log(`Order/Booking ${localOrderId} already processed. Status: ${orderData.status}`);
      if (orderData.status === 'confirmed' || orderData.status === 'paid') {
        return res.redirect(`${FRONTEND_URL}${successRedirectPath}&refId=${orderData.paymentRefId || ''}&status=already_confirmed`);
      }
      return res.redirect(`${FRONTEND_URL}${failureRedirectPath}&error=OrderAlreadyProcessed&currentStatus=${orderData.status}`);
    }

    const amount = (type === 'store_order' ? orderData.finalAmount : orderData.price).toString();

    if (Status === 'OK') {
      console.log(`Payment for ${type || 'booking'} ${localOrderId} (Authority: ${Authority}) reported OK. Verifying...`);
      const verificationResponse = await zarinpal.PaymentVerification({ Amount: amount, Authority: Authority });

      if (verificationResponse.status === 100 || verificationResponse.status === 101) {
        console.log(`Payment verification successful for ${localOrderId}. RefID: ${verificationResponse.RefID}`);

        const updatePayload = {
          status: type === 'store_order' ? 'paid' : 'confirmed',
          paymentRefId: verificationResponse.RefID.toString(),
          'paymentDetails.transactionId': verificationResponse.RefID.toString(), // For store orders
          'paymentDetails.paymentDate': admin.firestore.FieldValue.serverTimestamp(),
          'paymentDetails.paymentStatus': 'completed',
          paymentTimestamp: admin.firestore.FieldValue.serverTimestamp(), // For bookings
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await orderDocRef.update(updatePayload);

        // Deduct stock for store orders
        if (type === 'store_order' && orderData.items) {
          const batch = db.batch();
          for (const item of orderData.items) {
            if (item.isBundle && item.bundleItems) { // It's a bundle
                for (const bundledProduct of item.bundleItems) {
                    const productRef = db.collection('products').doc(bundledProduct.productId);
                    // Quantity to deduct is product's quantity in bundle * number of bundles bought
                    const quantityToDeduct = bundledProduct.quantity * item.quantity;
                    batch.update(productRef, {
                        stockQuantity: admin.firestore.FieldValue.increment(-quantityToDeduct)
                    });
                }
            } else if (!item.isBundle) { // It's a single product
                const productRef = db.collection('products').doc(item.productId);
                batch.update(productRef, {
                    stockQuantity: admin.firestore.FieldValue.increment(-item.quantity)
                });
            }
          }
          await batch.commit();
          console.log(`Stock deducted for store order ${localOrderId}.`);
        }
        return res.redirect(`${FRONTEND_URL}${successRedirectPath}&refId=${verificationResponse.RefID}`);
      } else {
        console.error(`Zarinpal PaymentVerification failed for ${localOrderId}:`, verificationResponse);
        await orderDocRef.update({
          status: 'payment_failed',
          paymentError: `Verification failed with status: ${verificationResponse.status}`,
          'paymentDetails.paymentStatus': 'failed',
          'paymentDetails.errorCode': verificationResponse.status,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return res.redirect(`${FRONTEND_URL}${failureRedirectPath}&error=VerificationFailed&status=${verificationResponse.status}`);
      }
    } else { // Status !== 'OK'
      console.log(`Payment cancelled or failed by user for ${localOrderId}. Status: ${Status}`);
      await orderDocRef.update({
        status: 'payment_failed',
        paymentError: `Payment cancelled or failed before verification. Status: ${Status}`,
        'paymentDetails.paymentStatus': 'cancelled_or_failed',
        'paymentDetails.errorCode': Status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return res.redirect(`${FRONTEND_URL}${failureRedirectPath}&error=PaymentCancelled&status=${Status}`);
    }
  } catch (error) {
    console.error('Error verifying Zarinpal payment:', error);
    const errorSuffix = localOrderId ? `&orderId=${localOrderId}` : '';
    return res.redirect(`${FRONTEND_URL}${failureRedirectPath || '/payment/failed'}?error=VerificationException${errorSuffix}`);
  }
};


module.exports = {
  initiateBookingPayment,
  verifyZarinpalPayment,
  initiateStoreOrderPayment, // Add new function
};

// Initiate payment for a store order
const initiateStoreOrderPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId } = req.body; // In a real app, userId should come from req.user

    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    const currentZarinpalConfig = getZarinpalConfig();
    const zarinpal = ZarinpalCheckout.create(currentZarinpalConfig.merchantID, currentZarinpalConfig.sandbox);

    const orderRef = db.collection('storeOrders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return res.status(404).json({ message: "Store order not found." });
    }

    const orderData = orderDoc.data();

    if (orderData.userId !== userId) {
      return res.status(403).json({ message: "You are not authorized to pay for this store order." });
    }
    if (orderData.status !== 'pending_payment') {
      return res.status(400).json({ message: `Store order is not pending payment. Current status: ${orderData.status}` });
    }
    if (!orderData.finalAmount || orderData.finalAmount <= 0) {
        return res.status(400).json({ message: "Store order amount is not valid." });
    }

    const amount = orderData.finalAmount.toString();
    const description = `پرداخت سفارش فروشگاه - شماره سفارش: ${orderData.orderNumber || orderId}`;
    // Append order type to callback URL for differentiation in verify step
    const callbackURL = `${CALLBACK_BASE_URL}/api/payments/zarinpal/verify?type=store_order&orderId=${orderId}`;

    console.log(`Attempting payment for store order ${orderId} with amount ${amount}`);

    const paymentResponse = await zarinpal.PaymentRequest({
      Amount: amount,
      Description: description,
      CallbackURL: callbackURL,
      // Email: orderData.customerDetails?.email, // Optional, if email is stored with order/user
      // Mobile: orderData.shippingAddress?.phoneNumber, // Optional
    });

    if (paymentResponse.status === 100 && paymentResponse.authority) {
      await orderRef.update({
        paymentAuthority: paymentResponse.authority,
        paymentGateway: 'Zarinpal', // Store gateway used
        'paymentDetails.paymentAttemptedAt': admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const paymentGatewayURL = zarinpal.GateIsEnabled
        ? `https://www.zarinpal.com/pg/StartPay/${paymentResponse.authority}`
        : `https://sandbox.zarinpal.com/pg/StartPay/${paymentResponse.authority}`;

      console.log(`Payment request successful for store order ${orderId}. Authority: ${paymentResponse.authority}. URL: ${paymentGatewayURL}`);
      res.status(200).json({ paymentGatewayURL });
    } else {
      console.error("Zarinpal PaymentRequest failed for store order:", paymentResponse);
      throw new Error(`خطا در ایجاد تراکنش زرین پال برای سفارش فروشگاه: ${paymentResponse.status || 'Unknown Error'}`);
    }

  } catch (error) {
    console.error('Error initiating store order payment:', error);
    res.status(500).json({ message: 'Error initiating store order payment.', error: error.message });
  }
};
