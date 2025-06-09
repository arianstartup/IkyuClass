const { db } = require('../config/firebaseConfig');
const { createProductBundle } = require('../models/productTypes');
const admin = require('firebase-admin');

// Create a new product bundle
const addProductBundle = async (req, res) => {
  try {
    // TODO: Add admin authentication check
    const { name, description, items, bundlePrice, sku, images, isActive, tags, ...additionalDetails } = req.body;

    if (!name || !description || !Array.isArray(items) || items.length === 0 || bundlePrice === undefined) {
      return res.status(400).json({ message: "Missing required fields: name, description, items, bundlePrice." });
    }

    // Fetch product details to validate productIds and calculate totalOriginalPrice
    let calculatedTotalOriginalPrice = 0;
    const populatedItems = [];

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ message: `Invalid item data for productId ${item.productId}. Each item must have productId and quantity > 0.`});
      }
      const productDoc = await db.collection('products').doc(item.productId).get();
      if (!productDoc.exists) {
        return res.status(404).json({ message: `Product with ID ${item.productId} not found.` });
      }
      const productData = productDoc.data();
      if (!productData.isActive) {
         return res.status(400).json({ message: `Product "${productData.name}" (ID: ${item.productId}) is not active and cannot be added to a bundle.` });
      }

      const pricePerItem = productData.price; // Use current price from product document
      calculatedTotalOriginalPrice += pricePerItem * item.quantity;
      populatedItems.push({
        productId: item.productId,
        productName: productData.name, // Store for easier display
        sku: productData.sku, // Store for reference
        quantity: item.quantity,
        originalPricePerItem: pricePerItem,
      });
    }

    // The createProductBundle factory function will recalculate totalOriginalPrice and discount based on items passed.
    // We pass 'populatedItems' which now contains 'originalPricePerItem' based on current product prices.
    const newBundleData = createProductBundle(name, description, populatedItems, bundlePrice, sku, images, isActive, additionalDetails);
    // Override totalOriginalPrice if it was calculated differently or if we trust the factory's calculation more.
    // The factory calculates based on the prices *provided in items*. Here, we ensured items have current prices.
    // newBundleData.totalOriginalPrice = calculatedTotalOriginalPrice;
    // newBundleData.discountAmount = calculatedTotalOriginalPrice - bundlePrice;


    const bundleRef = await db.collection('productBundles').add({
        ...newBundleData,
        // Ensure createdAt and updatedAt are Firestore Timestamps if not already handled by model
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({
        message: 'Product bundle created successfully!',
        bundleId: bundleRef.id,
        data: { ...newBundleData, id: bundleRef.id }
    });

  } catch (error) {
    console.error('Error creating product bundle:', error);
    if (error.message.startsWith("Missing or invalid") || error.message.startsWith("Invalid item structure")) {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error creating product bundle.', error: error.message });
  }
};

// Get all active product bundles
const getAllProductBundles = async (req, res) => {
  try {
    const bundlesSnapshot = await db.collection('productBundles').where('isActive', '==', true).get();
    const bundles = [];
    bundlesSnapshot.forEach(doc => {
      bundles.push({ id: doc.id, ...doc.data() });
    });
    res.status(200).json(bundles);
  } catch (error) {
    console.error('Error fetching product bundles:', error);
    res.status(500).json({ message: 'Error fetching product bundles.', error: error.message });
  }
};

// Get a single product bundle by ID
const getProductBundleById = async (req, res) => {
  try {
    const { bundleId } = req.params;
    const bundleRef = db.collection('productBundles').doc(bundleId);
    const doc = await bundleRef.get();

    if (!doc.exists || !doc.data().isActive) {
      return res.status(404).json({ message: 'Product bundle not found or not active.' });
    }

    const bundleData = doc.data();

    // Optionally, populate full product details for items in the bundle
    const populatedItems = [];
    if (bundleData.items && bundleData.items.length > 0) {
        for (const item of bundleData.items) {
            const productDoc = await db.collection('products').doc(item.productId).get();
            if (productDoc.exists) {
                populatedItems.push({
                    ...item, // contains quantity, originalPricePerItem, productName, sku
                    productDetails: { id: productDoc.id, ...productDoc.data() } // Add full product details
                });
            } else {
                 populatedItems.push({
                    ...item,
                    productDetails: null, // Indicate product not found or removed
                    errorMessage: `Product with ID ${item.productId} not found.`
                });
            }
        }
        bundleData.items = populatedItems; // Replace items with populated items
    }

    res.status(200).json({ id: doc.id, ...bundleData });
  } catch (error) {
    console.error('Error fetching product bundle by ID:', error);
    res.status(500).json({ message: 'Error fetching product bundle.', error: error.message });
  }
};

// Update a product bundle
const updateProductBundle = async (req, res) => {
  try {
    // TODO: Add admin authentication check
    const { bundleId } = req.params;
    const updateData = req.body;

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No update data provided." });
    }

    const bundleRef = db.collection('productBundles').doc(bundleId);
    const doc = await bundleRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Product bundle not found to update.' });
    }

    // If items are being updated, recalculate prices and validate products
    if (updateData.items && Array.isArray(updateData.items)) {
        let calculatedTotalOriginalPrice = 0;
        const populatedItems = [];
        for (const item of updateData.items) {
            if (!item.productId || !item.quantity || item.quantity <= 0) {
                 return res.status(400).json({ message: `Invalid item data for update. Each item must have productId and quantity > 0.`});
            }
            const productDoc = await db.collection('products').doc(item.productId).get();
            if (!productDoc.exists) {
                return res.status(404).json({ message: `Product with ID ${item.productId} in items not found.` });
            }
            const productData = productDoc.data();
            const pricePerItem = item.originalPricePerItem !== undefined ? item.originalPricePerItem : productData.price;
            calculatedTotalOriginalPrice += pricePerItem * item.quantity;
            populatedItems.push({
                productId: item.productId,
                productName: productData.name,
                sku: productData.sku,
                quantity: item.quantity,
                originalPricePerItem: pricePerItem,
            });
        }
        updateData.items = populatedItems;
        updateData.totalOriginalPrice = calculatedTotalOriginalPrice;
        if (updateData.bundlePrice !== undefined) { // If bundlePrice is also part of update
            updateData.discountAmount = calculatedTotalOriginalPrice - updateData.bundlePrice;
        } else { // bundlePrice is not changing, use existing one
             updateData.discountAmount = calculatedTotalOriginalPrice - (doc.data().bundlePrice || 0);
        }
    } else if (updateData.bundlePrice !== undefined && !updateData.items) {
        // Only bundlePrice is updated, items are not. Recalculate discount based on existing items' totalOriginalPrice.
        updateData.discountAmount = (doc.data().totalOriginalPrice || 0) - updateData.bundlePrice;
    }


    await bundleRef.update({
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ message: 'Product bundle updated successfully.', bundleId });
  } catch (error) {
    console.error('Error updating product bundle:', error);
    res.status(500).json({ message: 'Error updating product bundle.', error: error.message });
  }
};

// Delete a product bundle
const deleteProductBundle = async (req, res) => {
  try {
    // TODO: Add admin authentication check
    const { bundleId } = req.params;
    const bundleRef = db.collection('productBundles').doc(bundleId);

    const doc = await bundleRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Product bundle not found to delete.' });
    }

    // For actual deletion:
    await bundleRef.delete();
    // Or to mark as inactive:
    // await bundleRef.update({ isActive: false, updatedAt: admin.firestore.FieldValue.serverTimestamp() });

    res.status(200).json({ message: 'Product bundle deleted successfully.', bundleId });
  } catch (error) {
    console.error('Error deleting product bundle:', error);
    res.status(500).json({ message: 'Error deleting product bundle.', error: error.message });
  }
};

module.exports = {
  addProductBundle,
  getAllProductBundles,
  getProductBundleById,
  updateProductBundle,
  deleteProductBundle,
};
