const express = require('express');
const router = express.Router();
const { getWishlist, toggleWishlist } = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getWishlist);
router.route('/toggle').post(protect, toggleWishlist);

module.exports = router;
