const { db } = require('../config/firebaseConfig');
const { createProduct } = require('../models/productTypes');
const admin = require('firebase-admin'); // For FieldValue.serverTimestamp()

// Create a new product
const addProduct = async (req, res) => {
  try {
    // TODO: Add admin authentication check here in a real app
    const { name, description, price, category, brand, images, stockQuantity, sku, tags, isFeatured, isActive, ...additionalDetails } = req.body;

    // Use the factory function, it includes basic validation
    const newProductData = createProduct(name, description, price, category, brand, images, stockQuantity, sku, tags, additionalDetails);
    if (isFeatured !== undefined) newProductData.isFeatured = isFeatured;
    if (isActive !== undefined) newProductData.isActive = isActive;

    // Check for SKU uniqueness before adding
    const skuCheckSnapshot = await db.collection('products').where('sku', '==', sku).limit(1).get();
    if (!skuCheckSnapshot.empty) {
        return res.status(409).json({ message: `Product with SKU ${sku} already exists.` });
    }

    const productRef = await db.collection('products').add({
        ...newProductData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      message: 'Product added successfully!',
      productId: productRef.id,
      data: { ...newProductData, id: productRef.id }
    });

  } catch (error) {
    console.error('Error adding product:', error);
    if (error.message.startsWith("Missing or invalid")) {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error adding product.', error: error.message });
  }
};

// Get all products (public)
const getAllProducts = async (req, res) => {
  try {
    // TODO: Implement filtering (category, price range, tags) and pagination in the future
    const productsSnapshot = await db.collection('products').where('isActive', '==', true).get(); // Only active products for public view
    const products = [];
    productsSnapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products.', error: error.message });
  }
};

// Get a single product by ID (public)
const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    const productRef = db.collection('products').doc(productId);
    const doc = await productRef.get();

    if (!doc.exists || !doc.data().isActive) { // Also check isActive for public view
      return res.status(404).json({ message: 'Product not found or not active.' });
    }

    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    res.status(500).json({ message: 'Error fetching product.', error: error.message });
  }
};

// Update a product
const updateProduct = async (req, res) => {
  try {
    // TODO: Add admin authentication check here
    const { productId } = req.params;
    const updateData = req.body;

    if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No update data provided." });
    }

    // If SKU is being updated, check for uniqueness
    if (updateData.sku) {
        const skuCheckSnapshot = await db.collection('products')
            .where('sku', '==', updateData.sku)
            .get();
        if (!skuCheckSnapshot.empty) {
            // Check if the found SKU belongs to a different product
            let conflict = false;
            skuCheckSnapshot.forEach(doc => {
                if (doc.id !== productId) {
                    conflict = true;
                }
            });
            if (conflict) {
                 return res.status(409).json({ message: `Another product with SKU ${updateData.sku} already exists.` });
            }
        }
    }


    const productRef = db.collection('products').doc(productId);
    const doc = await productRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Product not found to update.' });
    }

    await productRef.update({
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ message: 'Product updated successfully.', productId });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product.', error: error.message });
  }
};

// Delete a product
const deleteProduct = async (req, res) => {
  try {
    // TODO: Add admin authentication check here
    const { productId } = req.params;
    const productRef = db.collection('products').doc(productId);

    const doc = await productRef.get();
    if (!doc.exists) {
      return res.status(404).json({ message: 'Product not found to delete.' });
    }

    // Instead of deleting, consider marking as inactive or archiving
    // For actual deletion:
    await productRef.delete();
    // Or to mark as inactive:
    // await productRef.update({ isActive: false, updatedAt: admin.firestore.FieldValue.serverTimestamp() });

    res.status(200).json({ message: 'Product deleted successfully (or marked as inactive).', productId });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product.', error: error.message });
  }
};

module.exports = {
  addProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
