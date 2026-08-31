const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '.env') });

const test = async () => {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
        console.warn('MONGO_URI is not set. Create backend/.env from backend/.env.example.');
        process.exit(1);
    }

    await mongoose.connect(mongoUri);
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
