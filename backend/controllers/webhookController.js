const Stripe = require('stripe');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const { sendOrderConfirmationEmail } = require('../utils/sendEmail');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Stripe webhook handler.
 * IMPORTANT: This route requires the raw request body (not parsed JSON).
 * It must be registered with express.raw() middleware in index.js.
 *
 * @route POST /api/webhook/stripe
 */
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body, // raw Buffer — critical for signature verification
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err.message);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  const paymentIntent = event.data.object;

  // ── payment_intent.succeeded ─────────────────────────────────────────────────
  if (event.type === 'payment_intent.succeeded') {
    try {
      const order = await Order.findOne({ paymentIntentId: paymentIntent.id });
      if (!order) {
        console.warn('[Webhook] No order found for PaymentIntent:', paymentIntent.id);
        return res.json({ received: true });
      }

      order.paymentStatus = 'paid';
      order.status = 'Processing';
      order.paidAt = new Date();
      await order.save();

      // Clear cart from DB
      const cart = await Cart.findOne({ user: order.user });
      if (cart) {
        cart.items = [];
        await cart.save();
      }

      // Send confirmation email
      await order.populate('items.productId', 'name image price');
      const user = await User.findById(order.user).select('name email');
      if (user?.email) {
        sendOrderConfirmationEmail({ to: user.email, order, userName: user.name });
      }

      console.log(`[Webhook] Order ${order._id} marked as PAID`);
    } catch (err) {
      console.error('[Webhook] Error processing succeeded event:', err);
    }
  }

  // ── payment_intent.payment_failed ────────────────────────────────────────────
  if (event.type === 'payment_intent.payment_failed') {
    try {
      const order = await Order.findOne({ paymentIntentId: paymentIntent.id });
      if (order) {
        order.paymentStatus = 'failed';
        order.status = 'Failed';
        await order.save();
        console.log(`[Webhook] Order ${order._id} marked as FAILED`);
      }
    } catch (err) {
      console.error('[Webhook] Error processing failed event:', err);
    }
  }

  // Always respond quickly to Stripe
  res.json({ received: true });
};

module.exports = { handleStripeWebhook };
