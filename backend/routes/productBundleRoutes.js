const express = require('express');
const router = express.Router();
const productBundleController = require('../controllers/productBundleController');
const { verifyFirebaseToken, checkRole } = require('../middleware/authMiddleware');

// POST /api/product-bundles - Create a new product bundle (Admin)
router.post('/', verifyFirebaseToken, checkRole(['admin']), productBundleController.addProductBundle);

// GET /api/product-bundles - Get list of all active product bundles (Public)
router.get('/', productBundleController.getAllProductBundles);

// GET /api/product-bundles/:bundleId - Get details of a single product bundle (Public)
router.get('/:bundleId', productBundleController.getProductBundleById);

// PUT /api/product-bundles/:bundleId - Update an existing product bundle (Admin)
router.put('/:bundleId', verifyFirebaseToken, checkRole(['admin']), productBundleController.updateProductBundle);

// DELETE /api/product-bundles/:bundleId - Delete a product bundle (Admin)
router.delete('/:bundleId', verifyFirebaseToken, checkRole(['admin']), productBundleController.deleteProductBundle);

module.exports = router;
