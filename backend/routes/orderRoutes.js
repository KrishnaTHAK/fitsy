const express = require('express');
const router = express.Router();
const { createOrder, createPaymentIntent, getUserOrders } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, createOrder);
router.route('/create-payment-intent').post(protect, createPaymentIntent);
router.route('/myorders').get(protect, getUserOrders);

module.exports = router;
