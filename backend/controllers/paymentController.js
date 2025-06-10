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
  const currentZarinpalConfig = getZarinpalConfig();
  const zarinpal = ZarinpalCheckout.create(currentZarinpalConfig.merchantID, currentZarinpalConfig.sandbox);

  try {
    const { bookingId } = req.params;
    const { uid: studentId, role } = req.user; // Get studentId from authenticated user

    // studentId is now from req.user.uid
    // Optional: Check if role is appropriate (e.g. student or admin)
    // if (role !== 'student' && role !== 'admin') {
    //   return res.status(403).json({ message: "User role not authorized to initiate this payment." });
    // }

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
      successRedirectPath = `/store/checkout/success`;
      failureRedirectPath = `/store/checkout/failed`;
    } else if (type === 'research_order') {
      orderCollectionName = 'researchOrders';
      successRedirectPath = `/research-orders/payment/success`; // New success page for research orders
      failureRedirectPath = `/research-orders/payment/failed`; // New failure page for research orders
    } else { // Default to 'booking'
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

    const amount = (type === 'store_order' ? orderData.finalAmount : (type === 'research_order' ? orderData.finalPrice : orderData.price)).toString();

    if (Status === 'OK') {
      console.log(`Payment for ${type || 'booking'} ${localOrderId} (Authority: ${Authority}) reported OK. Verifying...`);
      const verificationResponse = await zarinpal.PaymentVerification({ Amount: amount, Authority: Authority });

      if (verificationResponse.status === 100 || verificationResponse.status === 101) { // 101 means already verified but OK
        console.log(`Payment verification successful for ${localOrderId}. RefID: ${verificationResponse.RefID}`);

        let updatePayload = { // Common fields
          paymentRefId: verificationResponse.RefID.toString(), // Used for bookings
          'paymentDetails.refId': verificationResponse.RefID.toString(), // Standardized for all
          'paymentDetails.transactionId': verificationResponse.RefID.toString(),
          'paymentDetails.paymentDate': admin.firestore.FieldValue.serverTimestamp(),
          'paymentDetails.paymentStatus': 'completed',
          'paymentDetails.method': 'Zarinpal', // Store payment method
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (type === 'store_order') {
          updatePayload.status = 'paid'; // Overall order status
        } else if (type === 'research_order') {
          updatePayload.paymentStatus = 'paid'; // Specific payment status for research order
        } else { // Booking
          updatePayload.status = 'confirmed'; // Overall booking status
          updatePayload.paymentTimestamp = admin.firestore.FieldValue.serverTimestamp(); // Legacy for bookings
        }

        await orderDocRef.update(updatePayload);

        // Deduct stock for store orders
        if (type === 'store_order' && orderData.items) {
          const batch = db.batch();
          for (const item of orderData.items) {
            if (item.isBundle && item.bundleItems) { // It's a bundle
                for (const bundledProduct of item.bundleItems) {
                    const productRef = db.collection('products').doc(bundledProduct.productId);
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
      } else { // Zarinpal verification failed
        console.error(`Zarinpal PaymentVerification failed for ${localOrderId}:`, verificationResponse);
        const errorUpdatePayload = {
          paymentError: `Verification failed with status: ${verificationResponse.status}`,
          'paymentDetails.paymentStatus': 'failed',
          'paymentDetails.errorCode': verificationResponse.status,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (type === 'store_order' || type === 'research_order') { // For orders, update paymentStatus
            errorUpdatePayload.paymentStatus = 'failed';
        } else { // For bookings, update overall status
            errorUpdatePayload.status = 'payment_failed';
        }
        await orderDocRef.update(errorUpdatePayload);
        return res.redirect(`${FRONTEND_URL}${failureRedirectPath}&error=VerificationFailed&status=${verificationResponse.status}`);
      }
    } else { // Status !== 'OK' (e.g., user cancelled at Zarinpal)
      console.log(`Payment cancelled or failed by user for ${localOrderId}. Status: ${Status}`);
      const cancelUpdatePayload = {
        paymentError: `Payment cancelled or failed before verification. Status: ${Status}`,
        'paymentDetails.paymentStatus': 'cancelled_or_failed',
        'paymentDetails.errorCode': Status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
       if (type === 'store_order' || type === 'research_order') {
            cancelUpdatePayload.paymentStatus = 'failed'; // Or 'cancelled'
        } else {
            cancelUpdatePayload.status = 'payment_failed'; // Or 'cancelled'
        }
      await orderDocRef.update(cancelUpdatePayload);
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
  initiateStoreOrderPayment,
  initiateResearchOrderPayment, // Add new function
};

// Initiate payment for a store order
const initiateStoreOrderPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { uid: userId } = req.user; // Get userId from authenticated user

    // userId is now from req.user.uid

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

// Initiate payment for a research order
const initiateResearchOrderPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { uid: userId } = req.user; // Get userId from authenticated user

    // userId is now from req.user.uid

    const orderRef = db.collection('researchOrders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return res.status(404).json({ message: "Research order not found." });
    }

    const orderData = orderDoc.data();

    if (orderData.userId !== userId) {
      return res.status(403).json({ message: "You are not authorized to pay for this research order." });
    }
    if (orderData.contentGenerationStatus !== 'completed') {
      return res.status(400).json({ message: `Content for this research order is not yet ready. Current status: ${orderData.contentGenerationStatus}` });
    }
    if (orderData.paymentStatus === 'paid') {
        return res.status(400).json({ message: "This research order has already been paid." });
    }
    if (orderData.paymentStatus !== 'pending') {
      return res.status(400).json({ message: `Research order is not pending payment. Current payment status: ${orderData.paymentStatus}` });
    }
    if (!orderData.finalPrice || orderData.finalPrice <= 0) {
        return res.status(400).json({ message: "Research order amount (finalPrice) is not valid." });
    }

    const currentZarinpalConfig = getZarinpalConfig();
    const zarinpal = ZarinpalCheckout.create(currentZarinpalConfig.merchantID, currentZarinpalConfig.sandbox);

    const amount = orderData.finalPrice.toString();
    const description = `پرداخت هزینه تحقیق - شناسه سفارش: ${orderId}`;
    const callbackURL = `${CALLBACK_BASE_URL}/api/payments/zarinpal/verify?type=research_order&orderId=${orderId}`;

    console.log(`Attempting payment for research order ${orderId} with amount ${amount}`);

    const paymentResponse = await zarinpal.PaymentRequest({
      Amount: amount,
      Description: description,
      CallbackURL: callbackURL,
    });

    if (paymentResponse.status === 100 && paymentResponse.authority) {
      await orderRef.update({
        'paymentDetails.authority': paymentResponse.authority,
        'paymentDetails.paymentGateway': 'Zarinpal',
        'paymentDetails.paymentAttemptedAt': admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const paymentGatewayURL = zarinpal.GateIsEnabled
        ? `https://www.zarinpal.com/pg/StartPay/${paymentResponse.authority}`
        : `https://sandbox.zarinpal.com/pg/StartPay/${paymentResponse.authority}`;

      console.log(`Payment request successful for research order ${orderId}. Authority: ${paymentResponse.authority}. URL: ${paymentGatewayURL}`);
      res.status(200).json({ paymentGatewayURL });
    } else {
      console.error("Zarinpal PaymentRequest failed for research order:", paymentResponse);
      throw new Error(`خطا در ایجاد تراکنش زرین پال برای سفارش تحقیق: ${paymentResponse.status || 'Unknown Error'}`);
    }

  } catch (error) {
    console.error('Error initiating research order payment:', error);
    res.status(500).json({ message: 'Error initiating research order payment.', error: error.message });
  }
};
