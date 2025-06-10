const { db } = require('../config/firebaseConfig');
const { createResearchOrder, createStoreOrder } = require('../models/orderTypes'); // Consolidated imports
const admin = require('firebase-admin'); // Added admin for FieldValue
const { generateResearchContent } = require('../utils/aiContentService');
const { uploadBufferToStorage } = require('../utils/storageService');

const submitResearchOrder = async (req, res) => {
  try {
    const { educationLevel, subject, description, deadline, price } = req.body;
    const { uid: userId } = req.user; // Get userId from authenticated user

    if (!userId || !educationLevel || !subject || !description || !deadline) { // userId is from req.user
      return res.status(400).json({ message: 'Missing required fields: educationLevel, subject, description, deadline are required.' });
    }
    const newOrderData = createResearchOrder(userId, educationLevel, subject, description, deadline, price);
    const orderRef = await db.collection('researchOrders').add({
        ...newOrderData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('Research order submitted successfully:', orderRef.id);
    res.status(201).json({
      message: 'Research order submitted successfully!',
      orderId: orderRef.id,
    });
  } catch (error) {
    console.error('Error submitting research order:', error);
    if (error.message.startsWith("Missing required fields")) {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error submitting research order.', error: error.message });
  }
};

const checkoutStoreOrder = async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;
    const { uid: userId } = req.user; // Get userId from authenticated user

    // userId is now from req.user
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'Cart items are required.' });
    if (!shippingAddress || typeof shippingAddress !== 'object') return res.status(400).json({ message: 'Shipping address is required.' });

    let calculatedTotalAmount = 0;
    const itemsForOrderModel = [];

    for (const cartItem of items) {
      if (!cartItem.id || !cartItem.quantityInCart || cartItem.quantityInCart <= 0) {
        return res.status(400).json({ message: `Invalid cart item data for ID ${cartItem.id}.`});
      }
      if (cartItem.isBundle) {
        const bundleRef = db.collection('productBundles').doc(cartItem.id);
        const bundleDoc = await bundleRef.get();
        if (!bundleDoc.exists || !bundleDoc.data().isActive) {
          return res.status(400).json({ message: `Bundle "${cartItem.name}" (ID: ${cartItem.id}) is no longer available.` });
        }
        const bundleData = bundleDoc.data();
        for (const bundleProductItem of bundleData.items) {
          const productRef = db.collection('products').doc(bundleProductItem.productId);
          const productDoc = await productRef.get();
          if (!productDoc.exists || !productDoc.data().isActive) {
            return res.status(400).json({ message: `Product "${bundleProductItem.productName}" in bundle "${bundleData.name}" is no longer available.` });
          }
          if (productDoc.data().stockQuantity < (bundleProductItem.quantity * cartItem.quantityInCart)) {
            return res.status(400).json({ message: `Not enough stock for product "${bundleProductItem.productName}" in bundle "${bundleData.name}". Requested total: ${bundleProductItem.quantity * cartItem.quantityInCart}, Available: ${productDoc.data().stockQuantity}` });
          }
        }
        calculatedTotalAmount += bundleData.bundlePrice * cartItem.quantityInCart;
        itemsForOrderModel.push({
          productId: cartItem.id, productName: bundleData.name, quantity: cartItem.quantityInCart,
          priceAtPurchase: bundleData.bundlePrice, isBundle: true, bundleItems: bundleData.items,
        });
      } else {
        const productRef = db.collection('products').doc(cartItem.id);
        const productDoc = await productRef.get();
        if (!productDoc.exists || !productDoc.data().isActive) {
          return res.status(400).json({ message: `Product "${cartItem.name}" (ID: ${cartItem.id}) is no longer available.` });
        }
        const productData = productDoc.data();
        if (productData.stockQuantity < cartItem.quantityInCart) {
          return res.status(400).json({ message: `Not enough stock for product "${productData.name}". Requested: ${cartItem.quantityInCart}, Available: ${productData.stockQuantity}` });
        }
        calculatedTotalAmount += productData.price * cartItem.quantityInCart;
        itemsForOrderModel.push({
          productId: cartItem.id, productName: productData.name, sku: productData.sku,
          quantity: cartItem.quantityInCart, priceAtPurchase: productData.price, isBundle: false,
        });
      }
    }
    const shippingCost = 0;
    const finalAmount = calculatedTotalAmount + shippingCost;
    const newStoreOrderData = createStoreOrder(userId, itemsForOrderModel, shippingAddress, calculatedTotalAmount, { shippingCost, finalAmount });
    const orderRef = await db.collection('storeOrders').add({
        ...newStoreOrderData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(201).json({
      message: 'Store order initiated successfully and is pending payment.',
      orderId: orderRef.id, finalAmount: newStoreOrderData.finalAmount, items: newStoreOrderData.items,
    });
  } catch (error) {
    console.error('Error during store order checkout:', error);
    if (error.message.startsWith("Missing or invalid")) {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error during store order checkout.', error: error.message });
  }
};

const generateResearchOrderContent = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) return res.status(400).json({ message: "Order ID is required." });
    const orderRef = db.collection('researchOrders').doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) return res.status(404).json({ message: "Research order not found." });
    const orderData = orderDoc.data();
    if (orderData.status !== 'paid' && orderData.status !== 'confirmed' && orderData.contentGenerationStatus !== 'pending_approval' && orderData.contentGenerationStatus !== 'approved_for_generation') {
       if (orderData.contentGenerationStatus === 'in_progress') {
            return res.status(400).json({ message: `Content generation is already in progress for order ${orderId}.` });
       }
    }
    await orderRef.update({
      contentGenerationStatus: 'in_progress',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const prompt = `تولید محتوای تحقیق با مشخصات زیر:\nمقطع تحصیلی: ${orderData.educationLevel}\nموضوع: ${orderData.subject}\nتوضیحات کاربر: ${orderData.description}\n---\nلطفا یک تحقیق جامع و کامل با رعایت ساختار علمی (مقدمه، بدنه، نتیجه‌گیری، منابع در صورت امکان) تهیه فرمایید.`.trim();
    await orderRef.update({ aiPromptUsed: prompt });
    const generatedText = await generateResearchContent(prompt);
    const contentBuffer = Buffer.from(generatedText, 'utf8');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFileName = `research_${orderId}_${timestamp}.txt`;
    const pathPrefix = `research_papers/${orderId}`;
    const fileUrl = await uploadBufferToStorage(contentBuffer, outputFileName, 'text/plain; charset=utf-8', pathPrefix);
    await orderRef.update({
      generatedContentFileUrl: fileUrl, generatedContentFileName: outputFileName,
      contentGenerationStatus: 'completed', updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(200).json({
      message: `Content for research order ${orderId} generated and uploaded successfully.`,
      fileUrl: fileUrl, fileName: outputFileName,
    });
  } catch (error) {
    console.error(`Error generating content for research order ${req.params.orderId}:`, error);
    if (req.params.orderId) {
        const orderRefOnError = db.collection('researchOrders').doc(req.params.orderId);
        const docCheck = await orderRefOnError.get();
        if (docCheck.exists) {
            await orderRefOnError.update({
                contentGenerationStatus: 'failed', updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }).catch(updateError => console.error("Error reverting status on failure:", updateError));
        }
    }
    res.status(500).json({ message: 'Error generating research content.', error: error.message });
  }
};

const downloadResearchOrderFile = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { uid: userId } = req.user; // Get userId from authenticated user

    // userId is now from req.user
    if (!orderId) return res.status(400).json({ message: "Order ID is required." });

    const orderRef = db.collection('researchOrders').doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) return res.status(404).json({ message: "Research order not found." });

    const orderData = orderDoc.data();
    if (orderData.userId !== userId) return res.status(403).json({ message: "You are not authorized to download this file." });
    if (orderData.paymentStatus !== 'paid') return res.status(403).json({ message: "Payment for this research order is not complete." });
    if (orderData.contentGenerationStatus !== 'completed' || !orderData.generatedContentFileUrl || !orderData.generatedContentFileName) {
      return res.status(404).json({ message: "Research file is not available or content generation is not complete." });
    }

    const bucket = admin.storage().bucket();
    const filePath = `research_papers/${orderId}/${orderData.generatedContentFileName}`;
    const file = bucket.file(filePath);

    const [exists] = await file.exists();
    if (!exists) {
        console.error(`File not found in storage: ${filePath}`);
        return res.status(404).json({ message: "File not found in storage. Please contact support."});
    }

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(orderData.generatedContentFileName)}"`);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8'); // Assuming .txt

    const readStream = file.createReadStream();
    readStream.pipe(res);
    readStream.on('error', (streamError) => {
        console.error("Error streaming file from storage:", streamError);
        if (!res.headersSent) res.status(500).json({ message: "Error streaming file."});
    });
  } catch (error) {
    console.error(`Error downloading research file for order ${req.params.orderId}:`, error);
    if (!res.headersSent) res.status(500).json({ message: 'Error downloading research file.', error: error.message });
  }
};

module.exports = {
  submitResearchOrder,
  checkoutStoreOrder,
  generateResearchOrderContent,
  downloadResearchOrderFile,
  getMyResearchOrders,
};

// Get research orders for a specific user
const getMyResearchOrders = async (req, res) => {
  try {
    const { uid: userId } = req.user; // Get userId from authenticated user

    // userId is now from req.user
    // if (!userId) { // This check is no longer needed as verifyFirebaseToken ensures req.user exists
    //   return res.status(400).json({ message: "User ID is required to fetch research orders." });
    // }

    const ordersSnapshot = await db.collection('researchOrders')
                                   .where('userId', '==', userId)
                                   .orderBy('createdAt', 'desc') // Show newest first
                                   .get();

    if (ordersSnapshot.empty) {
      return res.status(200).json([]); // Return empty array if no orders found
    }

    const myOrders = [];
    ordersSnapshot.forEach(doc => {
      myOrders.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json(myOrders);

  } catch (error) {
    console.error(`Error fetching research orders for user ${userId}:`, error); // Use userId from req.user
    res.status(500).json({ message: 'Error fetching research orders.', error: error.message });
  }
};
