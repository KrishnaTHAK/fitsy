const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Product = require('./models/Product');
const User = require('./models/User');
const Cart = require('./models/Cart');
const Wishlist = require('./models/Wishlist');

dotenv.config();
connectDB();

const rawProducts = [
  // Outerwear
  {
    name: 'Contour Denim Jacket',
    price: 92,
    rating: 4.6,
    category: 'Outerwear',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inventory: 45,
    description: 'Contour Denim Jacket brings relaxed utility fit styling to the outerwear edit with a polished storefront-ready presentation and try-on compatibility.',
    badge: 'Best Seller',
    accent: 'Relaxed utility fit',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=900',
  },
  {
    name: 'Contour Blazer',
    price: 134,
    rating: 4.7,
    category: 'Outerwear',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inventory: 30,
    description: 'Contour Blazer brings tailored fit styling to the outerwear edit with a polished storefront-ready presentation and try-on compatibility.',
    badge: 'Office Edit',
    accent: 'Tailored fit',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=900',
  },
  {
    name: 'Utility Cargo Jacket',
    price: 118,
    rating: 4.5,
    category: 'Outerwear',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inventory: 50,
    description: 'Utility Cargo Jacket brings structured pockets styling to the outerwear edit with a polished storefront-ready presentation and try-on compatibility.',
    badge: 'Street Line',
    accent: 'Structured pockets',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=900',
  },
  {
    name: 'Minimal Wool Coat',
    price: 186,
    rating: 4.8,
    category: 'Outerwear',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inventory: 25,
    description: 'Minimal Wool Coat brings cold-weather staple styling to the outerwear edit with a polished storefront-ready presentation and try-on compatibility.',
    badge: 'Premium',
    accent: 'Cold-weather staple',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=900',
  },
  {
    name: 'Oversized Wool Coat',
    price: 345,
    rating: 4.8,
    category: 'Outerwear',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inventory: 40,
    description: 'Oversized Wool Coat brings structured drape styling to the outerwear edit with a polished storefront-ready presentation and try-on compatibility.',
    badge: 'New Season',
    accent: 'Structured drape',
    image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=900',
  },

  // Tops
  {
    name: 'Studio Linen Shirt',
    price: 68,
    rating: 4.4,
    category: 'Tops',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inventory: 80,
    description: 'Studio Linen Shirt brings soft summer layer styling to the tops edit with a polished storefront-ready presentation and try-on compatibility.',
    badge: 'New In',
    accent: 'Soft summer layer',
    image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&q=80&w=900',
  },
  {
    name: 'Ribbed Knit Set',
    price: 74,
    rating: 4.5,
    category: 'Tops',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inventory: 60,
    description: 'Ribbed Knit Set brings textured comfort styling to the tops edit with a polished storefront-ready presentation and try-on compatibility.',
    badge: 'Weekend',
    accent: 'Textured comfort',
    image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&q=80&w=900',
  },
  {
    name: 'Weekend Zip Hoodie',
    price: 59,
    rating: 4.4,
    category: 'Tops',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inventory: 110,
    description: 'Weekend Zip Hoodie brings laid-back fleece styling to the tops edit with a polished storefront-ready presentation and try-on compatibility.',
    badge: 'Casual',
    accent: 'Laid-back fleece',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=900',
  },
  {
    name: 'Pleated Evening Top',
    price: 71,
    rating: 4.2,
    category: 'Tops',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inventory: 35,
    description: 'Pleated Evening Top brings sculpted shine styling to the tops edit with a polished storefront-ready presentation and try-on compatibility.',
    badge: 'Night Edit',
    accent: 'Sculpted shine',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=900',
  },
  {
    name: 'Cashmere Ribbed Knit Sweater',
    price: 185,
    rating: 4.7,
    category: 'Tops',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inventory: 40,
    description: 'Cashmere Ribbed Knit Sweater brings cloud-like feel styling to the tops edit with a polished storefront-ready presentation and try-on compatibility.',
    badge: 'Staff Pick',
    accent: 'Cloud-like feel',
    image: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&q=80&w=900',
  },
  {
    name: 'Classic Cotton Tee',
    price: 34,
    rating: 4.5,
    category: 'Tops',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inventory: 150,
    description: 'Classic Cotton Tee brings organic cotton comfort styling to the tops edit with a polished storefront-ready presentation and try-on compatibility.',
    badge: 'Core',
    accent: 'Organic cotton comfort',
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=900',
  },
  {
    name: 'Silk Button-Down',
    price: 110,
    rating: 4.6,
    category: 'Tops',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inventory: 70,
    description: 'Silk Button-Down brings pure silk finish styling to the tops edit with a polished storefront-ready presentation and try-on compatibility.',
    badge: 'Premium',
    accent: 'Pure silk finish',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=900',
  },

  // Bottoms
  {
    name: 'Wide-Leg Tailored Trousers',
    price: 145,
    rating: 4.6,
    category: 'Bottoms',
    vtoType: 'lower-body',
    sizes: ['24', '26', '28', '30', '32'],
    inventory: 80,
    description: 'Wide-Leg Tailored Trousers brings sharp tailoring styling to the bottoms edit with a polished storefront-ready presentation and try-on compatibility.',
    badge: 'Essential',
    accent: 'Sharp tailoring',
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=900',
  },
  {
    name: 'Classic Straight Denim',
    price: 120,
    rating: 4.8,
    category: 'Bottoms',
    vtoType: 'lower-body',
    sizes: ['24', '26', '28', '30', '32'],
    inventory: 120,
    description: 'Classic Straight Denim brings vintage wash styling to the bottoms edit with a polished storefront-ready presentation and try-on compatibility.',
    badge: 'Core Collection',
    accent: 'Vintage wash',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=900',
  },
  {
    name: 'Pleated Linen Shorts',
    price: 58,
    rating: 4.3,
    category: 'Bottoms',
    vtoType: 'lower-body',
    sizes: ['24', '26', '28', '30', '32'],
    inventory: 65,
    description: 'Pleated Linen Shorts brings lightweight summer drape styling to the bottoms edit with a polished storefront-ready presentation and try-on compatibility.',
    badge: 'New In',
    accent: 'Lightweight summer drape',
    image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=900',
  },
  {
    name: 'Tailored A-Line Skirt',
    price: 78,
    rating: 4.4,
    category: 'Bottoms',
    vtoType: 'lower-body',
    sizes: ['24', '26', '28', '30', '32'],
    inventory: 50,
    description: 'Tailored A-Line Skirt brings structured silhouette styling to the bottoms edit with a polished storefront-ready presentation and try-on compatibility.',
    badge: 'Classic',
    accent: 'Structured silhouette',
    image: 'https://images.unsplash.com/photo-1583496661160-fb48862c4a4e?auto=format&fit=crop&q=80&w=900',
  },

  // Dresses
  {
    name: 'Soft Motion Dress',
    price: 81,
    rating: 4.3,
    category: 'Dresses',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L'],
    inventory: 30,
    description: 'Soft Motion Dress brings fluid silhouette styling to the dresses edit with a polished storefront-ready presentation and try-on compatibility.',
    badge: 'Summer Edit',
    accent: 'Fluid silhouette',
    image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=900',
  },
  {
    name: 'Silk Bias-Cut Midi Dress',
    price: 210,
    rating: 4.9,
    category: 'Dresses',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L'],
    inventory: 30,
    description: 'Silk Bias-Cut Midi Dress brings fluid movement styling to the dresses edit with a polished storefront-ready presentation and try-on compatibility.',
    badge: 'Best Seller',
    accent: 'Fluid movement',
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=900',
  },
];

const importData = async () => {
  try {
    await Product.deleteMany();
    await User.deleteMany();
    await Cart.deleteMany();
    await Wishlist.deleteMany();

    const productsToInsert = [];
    
    // Duplicate products slightly to create a richer looking catalog (up to ~36 items)
    for (let i = 0; i < 2; i++) {
      rawProducts.forEach((p) => {
        const variation = { ...p, name: i === 0 ? p.name : `${p.name} (Alt ${i})` };
        productsToInsert.push(variation);
      });
    }

    await Product.insertMany(productsToInsert);

    console.log('Data Imported successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

importData();
