const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const { sendOrderConfirmationEmail } = require('../utils/sendEmail');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  const { items, shippingDetails, totalPrice, paymentMethod } = req.body;

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
      paymentMethod: paymentMethod || 'Cash on Delivery',
    });

    const createdOrder = await order.save();

    // Clear the user's cart after successfully creating the order
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    // Populate items for the email (product name etc.)
    await createdOrder.populate('items.productId', 'name image price');

    // Send order confirmation email (silently skips on failure)
    const user = await User.findById(req.user._id).select('name email');
    if (user?.email) {
      sendOrderConfirmationEmail({
        to: user.email,
        order: createdOrder,
        userName: user.name,
      });
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    // Populate product details in items
    await Order.populate(orders, { path: 'items.productId', select: 'name image price' });

    // Filter out order items where the product has been deleted
    const sanitized = orders.map((order) => ({
      ...order.toObject(),
      items: order.items.filter((item) => item.productId != null),
    }));

    res.json(sanitized);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
};
