const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const test = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const Cart = require('./models/Cart');
    const Wishlist = require('./models/Wishlist');

    try {
        const carts = await Cart.find({});
        console.log("Carts:", JSON.stringify(carts, null, 2));

        const wishlists = await Wishlist.find({});
        console.log("Wishlists:", JSON.stringify(wishlists, null, 2));

        // Let's also test populating a cart
        if (carts.length > 0) {
            const populatedCart = await Cart.findOne({ _id: carts[0]._id }).populate('items.productId');
            console.log("Populated Cart:", JSON.stringify(populatedCart, null, 2));
        }

    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}
test();
