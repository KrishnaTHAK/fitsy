const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

// Load env vars FIRST before requiring local modules that use them
dotenv.config();

const connectDB = require('./config/db');
const { handleStripeWebhook } = require('./controllers/webhookController');

// Connect to database
connectDB();

const app = express();

// ─── Stripe Webhook (MUST be before express.json()) ──────────────────────────
// Stripe requires the raw request body to verify the webhook signature.
// If express.json() runs first, req.body becomes a parsed object and
// signature verification will always fail.
app.post(
  '/api/webhook/stripe',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

// ─── Standard Middleware ──────────────────────────────────────────────────────
app.use(
  cors({
    origin: 'http://localhost:5173', // Must match frontend dev server exactly
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
