const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Helper to get or create cart for a user
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate('items.productId');
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
};

// Format cart items for frontend (flattens populated product)
const formatCartItems = (cart) => {
  return cart.items
    .filter((item) => item.productId != null) // filter out deleted products
    .map((item) => ({
      productId: item.productId._id,
      size: item.size,
      quantity: item.quantity,
      name: item.productId.name,
      price: item.productId.price,
      image: item.productId.image,
    }));
};

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    res.json({ items: formatCartItems(cart) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Add item to cart or increment quantity
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res) => {
  const { productId, size, quantity = 1 } = req.body;

  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      // Create new cart if doesn't exist
      const newCart = await Cart.create({
        user: req.user._id,
        items: [{ productId, size, quantity }],
      });
      await newCart.populate('items.productId');
      return res.json({ items: formatCartItems(newCart) });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId && item.size === size
    );

    if (existingItemIndex >= 0) {
      // Item exists, update quantity
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Item does not exist, add to items array
      cart.items.push({ productId, size, quantity });
    }

    await cart.save();
    await cart.populate('items.productId');

    res.json({ items: formatCartItems(cart) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart
// @access  Private
const updateCart = async (req, res) => {
    const { productId, size, quantity } = req.body;
  
    try {
      const cart = await Cart.findOne({ user: req.user._id });
      if (!cart) return res.status(404).json({ message: 'Cart not found' });
  
      const existingItemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId && item.size === size
      );
  
      if (existingItemIndex >= 0) {
        if(quantity > 0) {
            cart.items[existingItemIndex].quantity = quantity;
        } else {
            cart.items.splice(existingItemIndex, 1);
        }
        await cart.save();
        await cart.populate('items.productId');
        res.json({ items: formatCartItems(cart) });
      } else {
        res.status(404).json({ message: 'Item not found in cart' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  };

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId/:size
// @access  Private
const removeFromCart = async (req, res) => {
  const { productId, size } = req.params;

  try {
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter(
      (item) => !(item.productId.toString() === productId && item.size === size)
    );

    await cart.save();
    await cart.populate('items.productId');

    res.json({ items: formatCartItems(cart) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res) => {
    try {
      const cart = await Cart.findOne({ user: req.user._id });
      if (cart) {
          cart.items = [];
          await cart.save();
      }
      res.json({ items: [] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server Error' });
    }
  };

module.exports = {
  getCart,
  addToCart,
  updateCart,
  removeFromCart,
  clearCart
};
