const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

const getOrCreateWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId }).populate('items.productId');
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, items: [] });
  }
  return wishlist;
};

const formatWishlistItems = (wishlist) => {
  return wishlist.items
    .filter((item) => item.productId != null)
    .map((item) => ({
      productId: item.productId._id,
      name: item.productId.name,
      price: item.productId.price,
      image: item.productId.image,
      category: item.productId.category,
    }));
};

// @desc    Get user wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = async (req, res) => {
  try {
    const wishlist = await getOrCreateWishlist(req.user._id);
    res.json({ items: formatWishlistItems(wishlist) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Toggle item in wishlist
// @route   POST /api/wishlist/toggle
// @access  Private
const toggleWishlist = async (req, res) => {
  const { productId } = req.body;

  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        user: req.user._id,
        items: [{ productId }],
      });
      await wishlist.populate('items.productId');
      return res.json({ items: formatWishlistItems(wishlist), added: true });
    }

    const itemIndex = wishlist.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    let added = false;
    if (itemIndex >= 0) {
      // Remove item
      wishlist.items.splice(itemIndex, 1);
    } else {
      // Add item
      wishlist.items.push({ productId });
      added = true;
    }

    await wishlist.save();
    await wishlist.populate('items.productId');

    res.json({ items: formatWishlistItems(wishlist), added });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getWishlist,
  toggleWishlist,
};
