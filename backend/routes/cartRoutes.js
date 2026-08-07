const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCart,
  removeFromCart,
  clearCart
} = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getCart)
  .post(protect, addToCart)
  .put(protect, updateCart)
  .delete(protect, clearCart);

router.route('/:productId/:size')
  .delete(protect, removeFromCart);

module.exports = router;
