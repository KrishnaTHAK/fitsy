import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  Sparkles,
  Trash2,
  CheckCircle2,
  ArrowRight,
  X,
  Eye,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';

export default function WishlistPage() {
  const { wishlistItems, toggleWishlist, clearWishlist, addToCart } = useStore();
  const { isAuthenticated } = useAuth();

  const [activeTryOnItem, setActiveTryOnItem] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [isProcessingTryOn, setIsProcessingTryOn] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to remove all items from your wishlist?')) {
      clearWishlist();
      showToast('Wishlist cleared.');
    }
  };

  const handleStartTryOn = (item) => {
    setActiveTryOnItem(item);
    setIsProcessingTryOn(true);
    setTimeout(() => {
      setIsProcessingTryOn(false);
    }, 1200);
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen py-8 md:py-12 px-4 md:px-margin-desktop font-sans antialiased">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary text-white px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          {toastMessage}
        </div>
      )}

      <div className="max-w-container-max mx-auto space-y-8">
        
        {/* ─── HEADER AREA (Stitch LUXE.AI) ───────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-outline-variant/30 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight">
              My Wishlist
            </h1>
            <p className="text-sm md:text-base text-on-surface-variant font-medium mt-1">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'} saved for later
            </p>
          </div>

          {wishlistItems.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs font-bold text-on-surface-variant hover:text-error transition-colors flex items-center gap-1.5 cursor-pointer py-1 px-3 rounded-full hover:bg-error-container/20 border border-outline-variant/40"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </button>
          )}
        </div>

        {/* ─── WISHLIST GRID ─────────────────────────────────────────── */}
        {wishlistItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {wishlistItems.map((item) => {
              const productId = item.productId || item.id || item._id;
              return (
                <div
                  key={productId}
                  className="bg-surface-container-lowest rounded-3xl border border-outline-variant/40 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col group"
                >
                  {/* Card Media Container */}
                  <div className="relative aspect-4/5 w-full overflow-hidden bg-surface-container-low">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Floating Try It On Badge */}
                    <div className="absolute top-3.5 left-3.5">
                      <span className="px-3 py-1 rounded-full bg-primary text-white font-extrabold text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-md">
                        <Sparkles className="w-3 h-3 text-primary-fixed" /> Try It On
                      </span>
                    </div>

                    {/* Remove Action Button */}
                    <button
                      onClick={() => {
                        toggleWishlist({ product: item });
                        showToast(`Removed "${item.name}" from wishlist.`);
                      }}
                      className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/90 dark:bg-surface-dim/90 backdrop-blur-md shadow-md text-on-surface hover:text-error hover:scale-110 transition-all flex items-center justify-center cursor-pointer"
                      title="Remove item"
                    >
                      <Heart className="w-4 h-4 fill-primary text-primary" />
                    </button>
                  </div>

                  {/* Card Details & Dual Actions */}
                  <div className="p-5 md:p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-lg font-bold text-on-surface tracking-tight group-hover:text-primary transition-colors">
                          {item.name}
                        </h3>
                        <span className="text-lg font-extrabold text-on-surface">
                          ${Number(item.price).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                        {item.description || 'Structured luxury silhouette tailored with premium atelier craftsmanship.'}
                      </p>
                    </div>

                    {/* Dual Buttons (Stitch Spec) */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={() => {
                          addToCart({ product: item });
                          showToast(`Added ${item.name} to your Shopping Bag!`);
                        }}
                        className="w-full py-2.5 rounded-full border border-outline-variant hover:border-primary hover:bg-surface-container text-on-surface font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-primary" /> Add to Cart
                      </button>

                      <button
                        onClick={() => handleStartTryOn(item)}
                        className="w-full py-2.5 rounded-full bg-primary hover:bg-primary-container text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-102"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-primary-fixed" /> Try It On
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ─── EMPTY STATE ─────────────────────────────────────────── */
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/40 p-12 text-center max-w-lg mx-auto my-12 shadow-xs space-y-5">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-on-surface">Your Wishlist is Empty</h2>
              <p className="text-sm text-on-surface-variant mt-2 max-w-sm mx-auto">
                Explore our virtual try-on collection and save items you love to build your personalized digital wardrobe.
              </p>
            </div>
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary hover:bg-primary-container text-white font-bold text-xs shadow-md transition-all hover:scale-105"
            >
              <ShoppingBag className="w-4 h-4" /> Explore Collection
            </Link>
          </div>
        )}

      </div>

      {/* ─── MODAL: Instant Virtual Try-On Viewer ───────────────────── */}
      {activeTryOnItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                  FITSY AI Silhouette Warp
                </span>
                <h3 className="text-lg font-extrabold text-on-surface mt-1">
                  Virtual Fitting: {activeTryOnItem.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveTryOnItem(null)}
                className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isProcessingTryOn ? (
              <div className="aspect-4/5 rounded-2xl bg-surface-container flex flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <p className="font-bold text-sm text-on-surface">Synthesizing 3D Garment Mesh...</p>
                <p className="text-xs text-on-surface-variant">Calibrating texture drape and lighting onto your profile</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-4/5 rounded-2xl overflow-hidden bg-surface-container">
                  <img
                    src={activeTryOnItem.image}
                    alt={activeTryOnItem.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-5 text-white">
                    <span className="px-3 py-1 bg-emerald-500/90 text-white font-extrabold text-xs rounded-full self-start shadow-md mb-1">
                      98.4% Precision Fit Match
                    </span>
                    <p className="text-xs opacity-90">
                      Recommendation: Select size M for standard tailored drape.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      addToCart({ product: activeTryOnItem });
                      setActiveTryOnItem(null);
                      showToast(`Added ${activeTryOnItem.name} to cart from Fitting Studio!`);
                    }}
                    className="w-1/2 py-3 rounded-full bg-primary hover:bg-primary-container text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" /> Add to Cart (${activeTryOnItem.price})
                  </button>
                  <Link
                    to="/catalog"
                    onClick={() => setActiveTryOnItem(null)}
                    className="w-1/2 py-3 rounded-full border border-outline-variant hover:bg-surface-container text-on-surface font-bold text-xs text-center flex items-center justify-center gap-1.5"
                  >
                    Browse Catalog
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
