const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    rating: { type: Number, required: true, default: 0 },
    category: {
      type: String,
      required: true,
      enum: ['Clothes', 'Glasses', 'Shoes', 'Jewelry', 'Makeup', 'Accessories'],
    },
    vtoType: { type: String, required: true, default: 'default' },
    sizes: { type: [String], default: [] },
    inventory: { type: Number, required: true, default: 0 },
    description: { type: String, required: true },
    badge: { type: String, default: '' },
    accent: { type: String, default: '' },
    image: { type: String, required: true },
    // Only used for Glasses category currently
    tryOn: {
      overlayKey: { type: String },
      widthMultiplier: { type: Number },
      bridgeOffsetY: { type: Number },
    },
  },
  {
    timestamps: true,
  }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
