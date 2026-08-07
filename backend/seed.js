const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const Product = require('./models/Product');
const User = require('./models/User');
const Cart = require('./models/Cart');
const Wishlist = require('./models/Wishlist');

// Load static products from frontend (simulating reading the JS file)
// We need to parse the frontend file or simply copy its data structure here for seeding.
// For simplicity and decoupling, I will define the raw data directly here based on the frontend blueprints.

dotenv.config();
connectDB();

const rawProducts = [
  {
    name: 'Oversized Wool Coat',
    price: 345,
    rating: 4.8,
    category: 'Clothes',
    vtoType: 'upper-body',
    sizes: ['S', 'M', 'L', 'XL'],
    inventory: 45,
    description:
      'A structured, oversized wool blend coat designed for layering. Features dropped shoulders and a hidden button placket for a minimalist silhouette.',
    badge: 'New Season',
    accent: 'Structured drape',
    image: '/src/assets/products/wool-coat.jpg',
  },
  {
    name: 'Silk Bias-Cut Midi Dress',
    price: 210,
    rating: 4.9,
    category: 'Clothes',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L'],
    inventory: 30,
    description:
      'Crafted from pure heavy silk, this midi dress is cut on the bias to drape perfectly along the body. Features a soft cowl neck and adjustable straps.',
    badge: 'Best Seller',
    accent: 'Fluid movement',
    image: '/src/assets/products/silk-dress.jpg',
  },
  {
    name: 'Cashmere Ribbed Knit Sweater',
    price: 185,
    rating: 4.7,
    category: 'Clothes',
    vtoType: 'upper-body',
    sizes: ['S', 'M', 'L'],
    inventory: 60,
    description:
      'Ultra-soft 100% cashmere sweater with a chunky ribbed texture. Designed with a slightly cropped fit to pair seamlessly with high-rise trousers.',
    badge: 'Staff Pick',
    accent: 'Cloud-like feel',
    image: '/src/assets/products/knit-sweater.jpg',
  },
  {
    name: 'Wide-Leg Tailored Trousers',
    price: 145,
    rating: 4.6,
    category: 'Clothes',
    vtoType: 'lower-body',
    sizes: ['24', '26', '28', '30', '32'],
    inventory: 80,
    description:
      'High-waisted tailored trousers featuring sharp front pleats and a relaxed wide leg. Made from a crease-resistant twill fabric.',
    badge: 'Essential',
    accent: 'Sharp tailoring',
    image: '/src/assets/products/wide-trousers.jpg',
  },
  {
    name: 'Classic Straight Denim',
    price: 120,
    rating: 4.8,
    category: 'Clothes',
    vtoType: 'lower-body',
    sizes: ['24', '25', '26', '27', '28', '29', '30'],
    inventory: 120,
    description:
      'Vintage-inspired straight leg jeans cut from rigid 14oz denim. These will mold perfectly to your shape over time.',
    badge: 'Core Collection',
    accent: 'Vintage wash',
    image: '/src/assets/products/classic-denim.jpg',
  },
  {
    name: 'Midnight Black Wayfarers',
    price: 180,
    rating: 4.9,
    category: 'Glasses',
    vtoType: 'glasses',
    sizes: ['Standard'],
    inventory: 55,
    description:
      'A modernized take on the classic wayfarer silhouette. Hand-polished acetate frames featuring polarized lenses with 100% UV protection.',
    badge: 'Best Seller',
    accent: 'Timeless edge',
    image: '/src/assets/products/black-wayfarers.jpg',
    tryOn: {
      overlayKey: 'wayfarer',
      widthMultiplier: 1.15,
      bridgeOffsetY: -0.1,
    },
  },
  {
    name: 'Tortoiseshell Cat-Eye Frames',
    price: 195,
    rating: 4.8,
    category: 'Glasses',
    vtoType: 'glasses',
    sizes: ['Standard'],
    inventory: 40,
    description:
      'Sharp, angular cat-eye frames in a rich Havana tortoiseshell. Designed to lift and accentuate facial features.',
    badge: 'Trending',
    accent: 'Vintage glamour',
    image: '/src/assets/products/tortoiseshell-cat-eye.jpg',
    tryOn: {
      overlayKey: 'catEye',
      widthMultiplier: 1.12,
      bridgeOffsetY: -0.05,
    },
  },
  {
    name: 'Gold Wire Aviators',
    price: 210,
    rating: 4.7,
    category: 'Glasses',
    vtoType: 'glasses',
    sizes: ['Standard'],
    inventory: 35,
    description:
      'Ultra-lightweight titanium frames with a classic teardrop lens. Features subtle detailing on the bridge and temple tips.',
    badge: 'New Arrival',
    accent: 'Feather-light',
    image: '/src/assets/products/gold-aviators.jpg',
    tryOn: {
      overlayKey: 'aviator',
      widthMultiplier: 1.25,
      bridgeOffsetY: -0.15,
    },
  },
  {
    name: 'Clear Frame Blue-Light Glasses',
    price: 130,
    rating: 4.6,
    category: 'Glasses',
    vtoType: 'glasses',
    sizes: ['Standard'],
    inventory: 90,
    description:
      'Transparent acetate frames fitted with premium blue-light blocking lenses. Ideal for extended screen time without compromising on style.',
    badge: 'Work From Home',
    accent: 'Modern crystal',
    image: '/src/assets/products/clear-blue-light.jpg',
    tryOn: {
      overlayKey: 'clear',
      widthMultiplier: 1.18,
      bridgeOffsetY: -0.08,
    },
  },
  {
    name: 'Chunky Square Sunglasses',
    price: 220,
    rating: 4.9,
    category: 'Glasses',
    vtoType: 'glasses',
    sizes: ['Standard'],
    inventory: 25,
    description:
      'Bold, oversized square frames that offer maximum coverage and attitude. Features thick temples and gradient lenses.',
    badge: 'Editorial Pick',
    accent: 'Statement silhouette',
    image: '/src/assets/products/chunky-square.jpg',
    tryOn: {
      overlayKey: 'square',
      widthMultiplier: 1.3,
      bridgeOffsetY: -0.05,
    },
  },
  {
    name: 'Retro Round Wire Frames',
    price: 175,
    rating: 4.5,
    category: 'Glasses',
    vtoType: 'glasses',
    sizes: ['Standard'],
    inventory: 50,
    description:
      'Classic 90s-inspired round wire frames with adjustable silicone nose pads for a custom fit.',
    badge: 'Classic',
    accent: 'Minimalist vintage',
    image: '/src/assets/products/round-wire.jpg',
    tryOn: {
      overlayKey: 'round',
      widthMultiplier: 1.1,
      bridgeOffsetY: -0.12,
    },
  },
  {
    name: 'Chunky Leather Loafers',
    price: 280,
    rating: 4.8,
    category: 'Shoes',
    vtoType: 'shoes',
    sizes: ['37', '38', '39', '40', '41'],
    inventory: 40,
    description:
      'Classic penny loafer upper set on a lightweight, exaggerated lug sole. Handcrafted from polished spazzolato leather.',
    badge: 'Staff Pick',
    accent: 'Elevated profile',
    image: '/src/assets/products/chunky-loafers.jpg',
  },
  {
    name: 'Minimalist White Sneakers',
    price: 165,
    rating: 4.9,
    category: 'Shoes',
    vtoType: 'shoes',
    sizes: ['36', '37', '38', '39', '40', '41', '42'],
    inventory: 150,
    description:
      'The perfect everyday sneaker. Clean lines, premium Italian leather, and a custom-molded rubber cupsole.',
    badge: 'Essential',
    accent: 'Clean aesthetic',
    image: '/src/assets/products/white-sneakers.jpg',
  },
  {
    name: 'Sculptural Heel Boots',
    price: 320,
    rating: 4.7,
    category: 'Shoes',
    vtoType: 'shoes',
    sizes: ['37', '38', '39', '40'],
    inventory: 25,
    description:
      'Ankle boots crafted from soft nappa leather, featuring a striking architectural heel and a sharp square toe.',
    badge: 'New Season',
    accent: 'Architectural shape',
    image: '/src/assets/products/heel-boots.jpg',
  },
  {
    name: 'Gold Layered Necklace',
    price: 145,
    rating: 4.8,
    category: 'Jewelry',
    vtoType: 'jewelry',
    sizes: ['One Size'],
    inventory: 85,
    description:
      'A curated set of three delicate chains of varying lengths and textures. Crafted from 18k gold vermeil over sterling silver.',
    badge: 'Best Seller',
    accent: 'Perfectly styled',
    image: '/src/assets/products/gold-necklace.jpg',
  },
  {
    name: 'Chunky Silver Hoop Earrings',
    price: 95,
    rating: 4.9,
    category: 'Jewelry',
    vtoType: 'face',
    sizes: ['One Size'],
    inventory: 110,
    description:
      'Bold yet hollow inside for comfortable all-day wear. These high-polish sterling silver hoops are an instant classic.',
    badge: 'Essential',
    accent: 'Everyday statement',
    image: '/src/assets/products/silver-hoops.jpg',
  },
  {
    name: 'Pearl Drop Earrings',
    price: 120,
    rating: 4.6,
    category: 'Jewelry',
    vtoType: 'face',
    sizes: ['One Size'],
    inventory: 45,
    description:
      'Organic freshwater pearls suspended from delicate 14k solid gold hooks. Each pearl features a unique, irregular shape.',
    badge: 'New Arrival',
    accent: 'Organic luxury',
    image: '/src/assets/products/pearl-drops.jpg',
  },
  {
    name: 'Glass Glow Highlighter',
    price: 38,
    rating: 4.9,
    category: 'Makeup',
    vtoType: 'makeup',
    sizes: ['0.5 oz'],
    inventory: 200,
    description:
      'A liquid illuminator that gives skin a translucent, glass-like finish without visible glitter particles.',
    badge: 'Viral',
    accent: 'Dewy finish',
    image: '/src/assets/products/glow-highlighter.jpg',
  },
  {
    name: 'Velvet Matte Lipstick',
    price: 32,
    rating: 4.7,
    category: 'Makeup',
    vtoType: 'makeup',
    sizes: ['0.12 oz'],
    inventory: 150,
    description:
      'Highly pigmented, non-drying matte lipstick. Glides on smoothly and stays put for up to 12 hours.',
    badge: 'Editor Pick',
    accent: 'Rich pigment',
    image: '/src/assets/products/matte-lipstick.jpg',
  },
  {
    name: 'Mocha Lip Sculpt',
    price: 28,
    rating: 4.8,
    category: 'Makeup',
    vtoType: 'makeup',
    sizes: ['0.08 oz'],
    inventory: 180,
    description:
      'A long-wearing, water-resistant lip liner in a versatile cool-toned brown. Perfect for contouring and defining.',
    badge: 'Trending',
    accent: 'Precision definition',
    image: '/src/assets/products/lip-liner.jpg',
  },
  {
    name: 'Cream Veil Concealer',
    price: 34,
    rating: 4.6,
    category: 'Makeup',
    vtoType: 'makeup',
    sizes: ['0.2 oz'],
    inventory: 140,
    description:
      'Medium, buildable coverage with a natural skin finish. Blends seamlessly to hide dark circles and blemishes.',
    badge: 'Essential',
    accent: 'Second skin',
    image: '/src/assets/products/concealer.jpg',
  },
  {
    name: 'Leather Crossbody Bag',
    price: 350,
    rating: 4.9,
    category: 'Accessories',
    vtoType: 'default',
    sizes: ['One Size'],
    inventory: 30,
    description:
      'A structured, minimalist crossbody bag crafted from smooth Italian calf leather. Features custom brushed hardware.',
    badge: 'Investment Piece',
    accent: 'Timeless structure',
    image: '/src/assets/products/leather-bag.jpg',
  },
  {
    name: 'Aero Carry Backpack',
    price: 195,
    rating: 4.8,
    category: 'Accessories',
    vtoType: 'default',
    sizes: ['One Size'],
    inventory: 65,
    description:
      'A sleek, water-resistant backpack designed for the modern commute. Includes a padded laptop sleeve and hidden travel pockets.',
    badge: 'Staff Pick',
    accent: 'Utilitarian chic',
    image: '/src/assets/products/backpack.jpg',
  },
  {
    name: 'Woven Summer Hat',
    price: 85,
    rating: 4.5,
    category: 'Accessories',
    vtoType: 'face',
    sizes: ['M', 'L'],
    inventory: 40,
    description:
      'Hand-woven from natural raffia, featuring a wide brim for maximum sun protection and a grosgrain ribbon detail.',
    badge: 'Seasonal',
    accent: 'Resort ready',
    image: '/src/assets/products/woven-hat.jpg',
  }
];

const importData = async () => {
  try {
    await Product.deleteMany();
    await User.deleteMany();
    await Cart.deleteMany();
    await Wishlist.deleteMany();

    // Since we only had 24 blueprints, we multiply them to match the 54 items in the frontend
    // Note: The frontend code actually multiplied the blueprints dynamically. We will just insert
    // the 24 base blueprints for now. If you need exactly 54, you can duplicate them here.
    const productsToInsert = [];
    
    // Simple loop to duplicate products to reach ~54 items
    for(let i=0; i < 3; i++) {
        rawProducts.forEach((p, index) => {
            if(productsToInsert.length < 54) {
                 // Create a slight variation for duplicates so they look distinct in catalog
                 const variation = { ...p, name: i === 0 ? p.name : `${p.name} (Alt ${i})`};
                 productsToInsert.push(variation);
            }
        });
    }

    const createdProducts = await Product.insertMany(productsToInsert);

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

importData();
