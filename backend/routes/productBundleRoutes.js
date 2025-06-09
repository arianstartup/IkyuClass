const express = require('express');
const router = express.Router();
const productBundleController = require('../controllers/productBundleController');

// TODO: Protect admin routes (POST, PUT, DELETE) with authentication middleware

// POST /api/product-bundles - Create a new product bundle (Admin)
router.post('/', productBundleController.addProductBundle);

// GET /api/product-bundles - Get list of all active product bundles (Public)
router.get('/', productBundleController.getAllProductBundles);

// GET /api/product-bundles/:bundleId - Get details of a single product bundle (Public)
router.get('/:bundleId', productBundleController.getProductBundleById);

// PUT /api/product-bundles/:bundleId - Update an existing product bundle (Admin)
router.put('/:bundleId', productBundleController.updateProductBundle);

// DELETE /api/product-bundles/:bundleId - Delete a product bundle (Admin)
router.delete('/:bundleId', productBundleController.deleteProductBundle);

module.exports = router;
