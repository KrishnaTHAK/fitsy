const express = require('express');
const router = express.Router();
const { getProducts, getProductById, createProduct, deleteProduct } = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   GET /api/products
// @route   POST /api/products (Admin only)
router.route('/')
    .get(getProducts)
    .post(protect, admin, createProduct);

// @route   GET /api/products/:id
// @route   DELETE /api/products/:id (Admin only)
router.route('/:id')
    .get(getProductById)
    .delete(protect, admin, deleteProduct);

module.exports = router;