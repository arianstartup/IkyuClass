const { db } = require('../config/firebaseConfig');
const { createResearchOrder } = require('../models/orderTypes');

const submitResearchOrder = async (req, res) => {
  try {
    // For now, userId is taken from req.body.
    // In a real app, this would come from an authenticated req.user object.
    const { userId, educationLevel, subject, description, deadline, price } = req.body;

    // Basic validation (model function also validates, but good to have here too)
    if (!userId || !educationLevel || !subject || !description || !deadline) {
      return res.status(400).json({ message: 'Missing required fields: userId, educationLevel, subject, description, deadline are required.' });
    }

    // Create a new research order object
    const newOrderData = createResearchOrder(
      userId,
      educationLevel,
      subject,
      description,
      deadline,
      price // price can be null
      // additionalDetails can be passed if needed
    );

    // Add a new document with an auto-generated ID to the 'researchOrders' collection
    const orderRef = await db.collection('researchOrders').add(newOrderData);

    // Update the order data with the generated ID as orderId (optional, if needed within the doc)
    // await orderRef.update({ orderId: orderRef.id });
    // Or simply return the ID from orderRef.id

    console.log('Research order submitted successfully:', orderRef.id);
    res.status(201).json({
      message: 'Research order submitted successfully!',
      orderId: orderRef.id,
      data: { ...newOrderData, id: orderRef.id } // Return the data including the new ID
    });

  } catch (error) {
    console.error('Error submitting research order:', error);
    // If the error is from our model's validation
    if (error.message.startsWith("Missing required fields")) {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error submitting research order.', error: error.message });
  }
};

const { createStoreOrder } = require('../models/orderTypes'); // Add createStoreOrder
const { createResearchOrder } = require('../models/orderTypes'); // Ensure this is also present or from same file

const submitResearchOrder = async (req, res) => {
  try {
    // For now, userId is taken from req.body.
    // In a real app, this would come from an authenticated req.user object.
    const { userId, educationLevel, subject, description, deadline, price } = req.body;

    // Basic validation (model function also validates, but good to have here too)
    if (!userId || !educationLevel || !subject || !description || !deadline) {
      return res.status(400).json({ message: 'Missing required fields: userId, educationLevel, subject, description, deadline are required.' });
    }

    // Create a new research order object
    const newOrderData = createResearchOrder(
      userId,
      educationLevel,
      subject,
      description,
      deadline,
      price // price can be null
      // additionalDetails can be passed if needed
    );

    // Add a new document with an auto-generated ID to the 'researchOrders' collection
    const orderRef = await db.collection('researchOrders').add(newOrderData);

    // Update the order data with the generated ID as orderId (optional, if needed within the doc)
    // await orderRef.update({ orderId: orderRef.id });
    // Or simply return the ID from orderRef.id

    console.log('Research order submitted successfully:', orderRef.id);
    res.status(201).json({
      message: 'Research order submitted successfully!',
      orderId: orderRef.id,
      data: { ...newOrderData, id: orderRef.id } // Return the data including the new ID
    });

  } catch (error) {
    console.error('Error submitting research order:', error);
    // If the error is from our model's validation
    if (error.message.startsWith("Missing required fields")) {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error submitting research order.', error: error.message });
  }
};


const checkoutStoreOrder = async (req, res) => {
  try {
    const { userId, items, shippingAddress } = req.body;

    // Basic validation
    if (!userId) return res.status(400).json({ message: 'User ID is required.' });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'Cart items are required.' });
    if (!shippingAddress || typeof shippingAddress !== 'object') return res.status(400).json({ message: 'Shipping address is required.' });

    let calculatedTotalAmount = 0;
    const itemsForOrderModel = [];

    // Inventory Check and Price Calculation
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

        // Check stock for each product within the bundle
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
          productId: cartItem.id, // For bundles, productId is the bundleId
          productName: bundleData.name,
          quantity: cartItem.quantityInCart,
          priceAtPurchase: bundleData.bundlePrice,
          isBundle: true,
          bundleItems: bundleData.items, // Store constituent items for record keeping
        });

      } else { // It's a single product
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
          productId: cartItem.id,
          productName: productData.name,
          sku: productData.sku,
          quantity: cartItem.quantityInCart,
          priceAtPurchase: productData.price,
          isBundle: false,
        });
      }
    }

    const shippingCost = 0; // Placeholder, implement actual shipping calculation later
    const finalAmount = calculatedTotalAmount + shippingCost;

    const newStoreOrderData = createStoreOrder(
      userId,
      itemsForOrderModel,
      shippingAddress,
      calculatedTotalAmount, // This is sum of (priceAtPurchase * quantity)
      { shippingCost, finalAmount } // Pass calculated final amount and shipping
    );

    const orderRef = await db.collection('storeOrders').add({
        ...newStoreOrderData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      message: 'Store order initiated successfully and is pending payment.',
      orderId: orderRef.id,
      finalAmount: newStoreOrderData.finalAmount, // Use finalAmount from model which includes shipping etc.
      items: newStoreOrderData.items, // Return processed items
    });

  } catch (error) {
    console.error('Error during store order checkout:', error);
    if (error.message.startsWith("Missing or invalid")) {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error during store order checkout.', error: error.message });
  }
};


module.exports = {
  submitResearchOrder,
  checkoutStoreOrder, // Add new function
