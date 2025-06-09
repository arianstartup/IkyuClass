const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// TODO: Protect admin routes (POST, PUT, DELETE) with authentication middleware

// POST /api/products - Create a new product (Admin)
router.post('/', productController.addProduct);

// GET /api/products - Get list of all active products (Public)
router.get('/', productController.getAllProducts);

// GET /api/products/:productId - Get details of a single product (Public)
router.get('/:productId', productController.getProductById);

// PUT /api/products/:productId - Update an existing product (Admin)
router.put('/:productId', productController.updateProduct);

// DELETE /api/products/:productId - Delete a product (Admin)
// Consider changing to soft delete (mark as inactive)
router.delete('/:productId', productController.deleteProduct);

module.exports = router;
