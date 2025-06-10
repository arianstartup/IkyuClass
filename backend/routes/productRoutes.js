const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyFirebaseToken, checkRole } = require('../middleware/authMiddleware');

// POST /api/products - Create a new product (Admin)
router.post('/', verifyFirebaseToken, checkRole(['admin']), productController.addProduct);

// GET /api/products - Get list of all active products (Public)
router.get('/', productController.getAllProducts);

// GET /api/products/:productId - Get details of a single product (Public)
router.get('/:productId', productController.getProductById);

// PUT /api/products/:productId - Update an existing product (Admin)
router.put('/:productId', verifyFirebaseToken, checkRole(['admin']), productController.updateProduct);

// DELETE /api/products/:productId - Delete a product (Admin)
router.delete('/:productId', verifyFirebaseToken, checkRole(['admin']), productController.deleteProduct);

module.exports = router;
