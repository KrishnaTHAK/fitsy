const Stripe = require('stripe');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const { sendOrderConfirmationEmail } = require('../utils/sendEmail');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Create a Stripe PaymentIntent + pending order (Card & UPI)
// @route   POST /api/orders/create-payment-intent
// @access  Private
const createPaymentIntent = async (req, res) => {
  const { items, shippingDetails, totalPrice, paymentMethod } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'No order items' });
  }
  if (!shippingDetails) {
    return res.status(400).json({ message: 'Shipping details are required' });
  }

  const isUpi = paymentMethod === 'UPI / Digital Wallet';

  // Stripe requires amount in the smallest currency unit (paise for INR, cents for USD)
  const amount = Math.round(totalPrice * 100);
  const currency = isUpi ? 'inr' : 'inr'; // Using INR for both (adjust to 'usd' for USD card)

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types: isUpi ? ['upi'] : ['card'],
      metadata: { userId: req.user._id.toString() },
    });

    // Save a pending order linked to this PaymentIntent
    const order = new Order({
      user: req.user._id,
      items,
      shippingDetails,
      totalPrice,
      paymentMethod,
      paymentIntentId: paymentIntent.id,
      paymentStatus: isUpi ? 'pending_upi' : 'unpaid',
      status: 'Pending',
    });

    const savedOrder = await order.save();

    res.json({
      clientSecret: paymentIntent.client_secret,
      orderId: savedOrder._id,
    });
  } catch (error) {
    console.error('[Stripe] createPaymentIntent error:', error);
    res.status(500).json({ message: error.message || 'Failed to initiate payment' });
  }
};

// @desc    Create new order (Cash on Delivery only)
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
      paymentStatus: 'unpaid', // COD — paid on delivery
      status: 'Pending',
    });

    const createdOrder = await order.save();

    // Clear the user's cart
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    // Populate items for the email
    await createdOrder.populate('items.productId', 'name image price');

    // Send confirmation email (silent failure)
    const user = await User.findById(req.user._id).select('name email');
    if (user?.email) {
      sendOrderConfirmationEmail({ to: user.email, order: createdOrder, userName: user.name });
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
    await Order.populate(orders, { path: 'items.productId', select: 'name image price' });

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
  createPaymentIntent,
  getUserOrders,
};
