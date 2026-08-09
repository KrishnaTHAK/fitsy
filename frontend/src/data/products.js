const CATALOG_BLUEPRINTS = [
  {
    category: 'Outerwear',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    items: [
      {
        name: 'Contour Denim Jacket',
        price: 92,
        rating: 4.6,
        accent: 'Relaxed utility fit',
        badge: 'Best Seller',
        image:
          'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=900',
      },
      {
        name: 'Contour Blazer',
        price: 134,
        rating: 4.7,
        accent: 'Tailored fit',
        badge: 'Office Edit',
        image:
          'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=900',
      },
      {
        name: 'Utility Cargo Jacket',
        price: 118,
        rating: 4.5,
        accent: 'Structured pockets',
        badge: 'Street Line',
        image:
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=900',
      },
      {
        name: 'Minimal Wool Coat',
        price: 186,
        rating: 4.8,
        accent: 'Cold-weather staple',
        badge: 'Premium',
        image:
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=900',
      },
      {
        name: 'Oversized Wool Coat',
        price: 345,
        rating: 4.8,
        accent: 'Structured drape',
        badge: 'New Season',
        image:
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=900',
      },
    ],
  },
  {
    category: 'Tops',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    items: [
      {
        name: 'Studio Linen Shirt',
        price: 68,
        rating: 4.4,
        accent: 'Soft summer layer',
        badge: 'New In',
        image:
          'https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&q=80&w=900',
      },
      {
        name: 'Ribbed Knit Set',
        price: 74,
        rating: 4.5,
        accent: 'Textured comfort',
        badge: 'Weekend',
        image:
          'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&q=80&w=900',
      },
      {
        name: 'Weekend Zip Hoodie',
        price: 59,
        rating: 4.4,
        accent: 'Laid-back fleece',
        badge: 'Casual',
        image:
          'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=900',
      },
      {
        name: 'Pleated Evening Top',
        price: 71,
        rating: 4.2,
        accent: 'Sculpted shine',
        badge: 'Night Edit',
        image:
          'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=900',
      },
      {
        name: 'Cashmere Ribbed Knit Sweater',
        price: 185,
        rating: 4.7,
        accent: 'Cloud-like feel',
        badge: 'Staff Pick',
        image:
          'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&q=80&w=900',
      },
      {
        name: 'Classic Cotton Tee',
        price: 34,
        rating: 4.5,
        accent: 'Organic cotton comfort',
        badge: 'Core',
        image:
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=900',
      },
      {
        name: 'Silk Button-Down',
        price: 110,
        rating: 4.6,
        accent: 'Pure silk finish',
        badge: 'Premium',
        image:
          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=900',
      },
    ],
  },
  {
    category: 'Bottoms',
    vtoType: 'lower-body',
    sizes: ['24', '26', '28', '30', '32'],
    items: [
      {
        name: 'Wide-Leg Tailored Trousers',
        price: 145,
        rating: 4.6,
        accent: 'Sharp tailoring',
        badge: 'Essential',
        image:
          'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=900',
      },
      {
        name: 'Classic Straight Denim',
        price: 120,
        rating: 4.8,
        accent: 'Vintage wash',
        badge: 'Core Collection',
        image:
          'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=900',
      },
      {
        name: 'Pleated Linen Shorts',
        price: 58,
        rating: 4.3,
        accent: 'Lightweight summer drape',
        badge: 'New In',
        image:
          'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&q=80&w=900',
      },
      {
        name: 'Tailored A-Line Skirt',
        price: 78,
        rating: 4.4,
        accent: 'Structured silhouette',
        badge: 'Classic',
        image:
          'https://images.unsplash.com/photo-1583496661160-fb48862c4a4e?auto=format&fit=crop&q=80&w=900',
      },
    ],
  },
  {
    category: 'Dresses',
    vtoType: 'upper-body',
    sizes: ['XS', 'S', 'M', 'L'],
    items: [
      {
        name: 'Soft Motion Dress',
        price: 81,
        rating: 4.3,
        accent: 'Fluid silhouette',
        badge: 'Summer Edit',
        image:
          'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=900',
      },
      {
        name: 'Silk Bias-Cut Midi Dress',
        price: 210,
        rating: 4.9,
        accent: 'Fluid movement',
        badge: 'Best Seller',
        image:
          'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=900',
      },
    ],
  },
];

export const PRODUCTS = CATALOG_BLUEPRINTS.flatMap((group) =>
  group.items.map((item, index) => ({
    id: Number(`${CATALOG_BLUEPRINTS.indexOf(group) + 1}${index + 1}`),
    category: group.category,
    vtoType: group.vtoType,
    sizes: group.sizes,
    inventory: 7 + ((index * 5 + group.category.length) % 28),
    description: `${item.name} brings ${item.accent.toLowerCase()} styling to the ${group.category.toLowerCase()} edit with a polished storefront-ready presentation and try-on compatibility.`,
    ...item,
  })),
);

export const CATEGORIES = ['All', ...CATALOG_BLUEPRINTS.map((group) => group.category)];

export const NAV_ITEMS = [
  { label: 'Home', to: '/' },
  { label: 'New Arrivals', to: '/catalog' },
  { label: 'Outerwear', to: '/catalog?category=Outerwear' },
  { label: 'Tops', to: '/catalog?category=Tops' },
  { label: 'Bottoms', to: '/catalog?category=Bottoms' },
  { label: 'Dresses', to: '/catalog?category=Dresses' },
];

export function getProductById(id) {
  return PRODUCTS.find((product) => product.id === Number(id));
}
