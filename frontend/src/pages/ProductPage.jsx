import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Heart, ShoppingBag, Sparkles, Star, ShieldCheck, Truck, RotateCcw, Check, Ruler, Info } from 'lucide-react';
import GarmentTryOn from '../components/GarmentTryOn';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductsContext';
import { useStore } from '../context/StoreContext';

const FABRIC_SPECS = [
  { label: 'Material', value: '100% Organic Heavyweight Cotton' },
  { label: 'Fit Type', value: 'Relaxed / Oversized Drop Shoulder' },
  { label: 'Care Instructions', value: 'Machine wash cold inside out, tumble dry low' },
  { label: 'Origin', value: 'Crafted in Portugal' },
];

export default function ProductPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const { products, getProductById } = useProducts();
  const { cartItems, addToCart, updateCartQuantity, wishlistItems, toggleWishlist } = useStore();

  const product = getProductById(id) || products[0];
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState(product?.sizes?.[0] || 'M');
  const [selectedColor, setSelectedColor] = useState(product?.colors?.[0] || 'Azure Blue');
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes?.[0] || 'M');
      if (product.colors?.length) setSelectedColor(product.colors[0]);
    }
  }, [product]);

  const currentCartItem = useMemo(
    () => cartItems.find((item) => item.productId === (product?.id || product?._id) && item.size === selectedSize),
    [cartItems, product, selectedSize]
  );
  const currentQuantity = currentCartItem ? currentCartItem.quantity : 0;

  const isWishlisted = isAuthenticated
    ? wishlistItems.some((item) => item.productId === (product?.id || product?._id))
    : false;

  const relatedProducts = useMemo(
    () => products.filter((item) => item.category === product?.category && (item.id || item._id) !== (product?.id || product?._id)).slice(0, 3),
    [products, product?.category, product?.id, product?._id]
  );

  if (!product) return null;

  async function handleAddToCart() {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    await addToCart({ product, size: selectedSize });
    setFeedback(`Added 1x ${product.name} (${selectedSize}) to your bag.`);
    setTimeout(() => setFeedback(''), 3000);
  }

  async function handleToggleWishlist() {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    await toggleWishlist({ product });
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-20">
      {/* Breadcrumb & Navigation Back */}
      <div className="max-w-container-max mx-auto px-4 md:px-margin-desktop py-6">
        <Link
          to="/catalog"
          className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Shop Collection
        </Link>
      </div>

      {/* Main Product Display Section */}
      <div className="max-w-container-max mx-auto px-4 md:px-margin-desktop">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Gallery Column (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="relative aspect-[3/4] w-full rounded-3xl overflow-hidden bg-surface-container border border-outline-variant/40 shadow-sm group">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3.5 py-1 rounded-full bg-primary text-white text-xs font-bold shadow-md">
                  {product.category}
                </span>
                <span className="px-3.5 py-1 rounded-full bg-surface/90 backdrop-blur-md text-on-surface text-xs font-bold border border-outline-variant/40 shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary" /> AI Try-On Enabled
                </span>
              </div>
            </div>

            {/* Thumbnail Row */}
            <div className="grid grid-cols-4 gap-4">
              {[product.image, product.image, product.image, product.image].map((img, idx) => (
                <div
                  key={idx}
                  className="aspect-square rounded-2xl overflow-hidden bg-surface-container border-2 border-primary cursor-pointer shadow-sm hover:opacity-90"
                >
                  <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info Column (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between text-xs text-on-surface-variant mb-2">
                <span className="font-semibold text-primary uppercase tracking-wider">{product.badge || 'FITSY Exclusive'}</span>
                <span className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-current" /> {product.rating || '4.9'} (142 reviews)
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold font-sans tracking-tight text-on-surface mb-3">
                {product.name}
              </h1>

              <div className="text-3xl font-bold text-primary mb-4">
                ${product.price}
                <span className="text-xs font-normal text-on-surface-variant ml-2">In stock &amp; ready for instant try-on</span>
              </div>

              <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
                {product.description}
              </p>

              {/* Color Selector */}
              {product.colors && product.colors.length > 0 && (
                <div className="mb-6">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface mb-2">
                    Selected Color: <span className="text-primary font-normal">{selectedColor}</span>
                  </label>
                  <div className="flex gap-3">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          selectedColor === color
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-surface border-outline-variant/60 text-on-surface hover:border-primary'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selector */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-on-surface">
                    Select Size
                  </label>
                  <button
                    onClick={() => setShowSizeGuide(true)}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Ruler className="w-3.5 h-3.5" /> Size Guide
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {product.sizes?.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-3 rounded-xl text-sm font-bold border transition-all cursor-pointer ${
                        selectedSize === size
                          ? 'bg-primary text-white border-primary shadow-md'
                          : 'bg-surface border-outline-variant/60 text-on-surface hover:border-primary'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div className="space-y-3">
                {/* Virtual Try-On Highlight CTA */}
                <button
                  onClick={() => setIsTryOnOpen(true)}
                  className="w-full py-4 rounded-full bg-gradient-to-r from-primary-container via-primary to-surface-tint text-white font-bold text-base shadow-xl hover:shadow-primary/30 transition-all flex items-center justify-center gap-3 cursor-pointer group"
                >
                  <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Virtual Try-On with AI
                </button>

                {/* Add to Cart Button */}
                {currentQuantity > 0 ? (
                  <div className="flex items-center justify-between bg-primary/10 border border-primary/30 p-2.5 rounded-full px-6 text-primary font-bold">
                    <span>In Shopping Bag</span>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => updateCartQuantity({ productId: product.id || product._id, size: selectedSize, quantity: currentQuantity - 1 })}
                        className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg cursor-pointer"
                      >
                        -
                      </button>
                      <span>{currentQuantity}</span>
                      <button
                        onClick={() => updateCartQuantity({ productId: product.id || product._id, size: selectedSize, quantity: currentQuantity + 1 })}
                        className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    className="w-full py-4 rounded-full bg-surface border-2 border-primary text-primary font-bold text-base hover:bg-primary/5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-5 h-5" /> Add to Shopping Bag
                  </button>
                )}

                {/* Wishlist Button */}
                <button
                  onClick={handleToggleWishlist}
                  className={`w-full py-3 rounded-full border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    isWishlisted
                      ? 'bg-rose-500/10 border-rose-500 text-rose-500'
                      : 'border-outline-variant/60 text-on-surface-variant hover:border-primary'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                  {isWishlisted ? 'Saved to Wishlist' : 'Save to Wishlist'}
                </button>

                {feedback && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 text-xs font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4" /> {feedback}
                  </div>
                )}
              </div>
            </div>

            {/* Service badges */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-outline-variant/30 text-center text-xs text-on-surface-variant">
              <div className="flex flex-col items-center gap-1">
                <Truck className="w-5 h-5 text-primary" />
                <span>Free Express Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <RotateCcw className="w-5 h-5 text-primary" />
                <span>30-Day Free Returns</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span>98.4% Fit Guarantee</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Specs Section */}
        <div className="mt-16 pt-12 border-t border-outline-variant/30">
          <div className="flex border-b border-outline-variant/30 gap-8">
            <button
              onClick={() => setActiveTab('description')}
              className={`pb-3 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'description' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'
              }`}
            >
              Fabric &amp; Care Details
            </button>
            <button
              onClick={() => setActiveTab('shipping')}
              className={`pb-3 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'shipping' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'
              }`}
            >
              Shipping &amp; Returns
            </button>
          </div>

          <div className="py-8 max-w-3xl">
            {activeTab === 'description' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {FABRIC_SPECS.map((spec, i) => (
                  <div key={i} className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30">
                    <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{spec.label}</p>
                    <p className="text-sm font-semibold text-on-surface mt-1">{spec.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Standard delivery arrives in 2-4 business days. Returns are completely free within 30 days of receiving your package. Use our AI Virtual Try-On feature to reduce return frequency and ensure optimal fit!
              </p>
            )}
          </div>
        </div>

        {/* Related Products Rail */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-outline-variant/30">
            <h3 className="text-2xl font-bold text-on-surface mb-8">You Might Also Like</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedProducts.map((rel) => (
                <div key={rel.id || rel._id} className="bg-surface border border-outline-variant/40 rounded-2xl overflow-hidden shadow-sm">
                  <img src={rel.image} alt={rel.name} className="w-full aspect-[3/4] object-cover" />
                  <div className="p-4">
                    <p className="font-bold text-sm text-on-surface">{rel.name}</p>
                    <p className="text-sm font-bold text-primary mt-1">${rel.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant p-6 rounded-3xl max-w-lg w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                <Ruler className="w-5 h-5 text-primary" /> FITSY Official Size Guide
              </h3>
              <button onClick={() => setShowSizeGuide(false)} className="text-on-surface-variant hover:text-on-surface font-bold text-xl">
                &times;
              </button>
            </div>
            <table className="w-full text-xs text-left border-collapse mb-6">
              <thead>
                <tr className="border-b border-outline-variant/40 bg-surface-container-low">
                  <th className="p-2.5 font-bold">Size</th>
                  <th className="p-2.5 font-bold">Chest (in)</th>
                  <th className="p-2.5 font-bold">Waist (in)</th>
                  <th className="p-2.5 font-bold">Length (in)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-outline-variant/20">
                  <td className="p-2.5 font-bold text-primary">S</td>
                  <td className="p-2.5">36 - 38</td>
                  <td className="p-2.5">30 - 32</td>
                  <td className="p-2.5">27</td>
                </tr>
                <tr className="border-b border-outline-variant/20">
                  <td className="p-2.5 font-bold text-primary">M</td>
                  <td className="p-2.5">39 - 41</td>
                  <td className="p-2.5">33 - 35</td>
                  <td className="p-2.5">28</td>
                </tr>
                <tr className="border-b border-outline-variant/20">
                  <td className="p-2.5 font-bold text-primary">L</td>
                  <td className="p-2.5">42 - 44</td>
                  <td className="p-2.5">36 - 38</td>
                  <td className="p-2.5">29</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-primary">XL</td>
                  <td className="p-2.5">45 - 47</td>
                  <td className="p-2.5">39 - 41</td>
                  <td className="p-2.5">30</td>
                </tr>
              </tbody>
            </table>
            <button
              onClick={() => setShowSizeGuide(false)}
              className="w-full py-3 bg-primary text-white rounded-full font-bold text-xs"
            >
              Close Size Guide
            </button>
          </div>
        </div>
      )}

      {/* Try-On Modal */}
      {isTryOnOpen && (
        <GarmentTryOn
          product={product}
          onClose={() => setIsTryOnOpen(false)}
        />
      )}
    </div>
  );
}
