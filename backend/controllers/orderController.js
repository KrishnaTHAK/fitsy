const Order = require('../models/Order');
const Cart = require('../models/Cart');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  const { items, shippingDetails, totalPrice } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'No order items' });
  }

  if (!shippingDetails) {
    return res.status(400).json({ message: 'Shipping details are required' });
  }

  try {
    const order = new Order({
      user: req.user._id,
      items,
      shippingDetails,
      totalPrice,
    });

    const createdOrder = await order.save();

    // Clear the user's cart after successfully creating the order
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  createOrder,
};
