const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    rating: { type: Number, required: true, default: 0 },
    category: {
      type: String,
      required: true,
      default: 'Outerwear',
    },
    vtoType: { type: String, required: true, default: 'upper-body' },
    sizes: { type: [String], default: ['XS', 'S', 'M', 'L', 'XL'] },
    // Optional per-size body measurement ranges (cm), used by the AI Size
    // Recommendation feature. Each entry's `size` should match a value in
    // `sizes`. Left empty ([]) by default — fully backward compatible;
    // products without chart data simply can't be measurement-matched yet.
    sizeChart: {
      type: [
        {
          size: { type: String, required: true },
          chestMin: Number,
          chestMax: Number,
          waistMin: Number,
          waistMax: Number,
          hipMin: Number,
          hipMax: Number,
          shoulderMin: Number,
          shoulderMax: Number,
        },
      ],
      default: [],
    },
    inventory: { type: Number, required: true, default: 0 },
    description: { type: String, default: '' },
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
