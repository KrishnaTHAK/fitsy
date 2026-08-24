import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Heart,
  ChevronLeft
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';

export default function CartPage() {
  const navigate = useNavigate();
  const { cartItems, updateCartQuantity, removeFromCart, clearCart, subtotal, estimatedTax, total, toggleWishlist } = useStore();
  const { isAuthenticated } = useAuth();
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: { pathname: '/checkout' } } });
      return;
    }
    navigate('/checkout');
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
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight">
              Shopping Cart
            </h1>
            <p className="text-sm md:text-base text-on-surface-variant font-medium mt-1">
              Review your items, virtual fit selections, and estimated delivery
            </p>
          </div>

          <Link
            to="/catalog"
            className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            <ChevronLeft className="w-4 h-4" /> Continue Shopping
          </Link>
        </div>

        {cartItems.length > 0 ? (
          /* ─── 2-COLUMN SHOPPING CART LAYOUT ────────────────────────── */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* ── LEFT COLUMN: Cart Items List (8 Cols) ──────────────── */}
            <div className="lg:col-span-8 space-y-4">
              {cartItems.map((item) => {
                const itemKey = `${item.productId || item.id}-${item.size}`;
                return (
                  <div
                    key={itemKey}
                    className="bg-surface-container-lowest p-5 md:p-6 rounded-3xl border border-outline-variant/40 shadow-xs hover:border-outline transition-all flex flex-col sm:flex-row items-center sm:items-start gap-5 relative group"
                  >
                    {/* Item Image */}
                    <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-surface-container shrink-0 shadow-2xs">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      {item.tryOnFit && (
                        <span className="absolute bottom-1.5 left-1.5 right-1.5 px-2 py-0.5 rounded-full bg-primary/90 backdrop-blur-xs text-white text-[9px] font-bold text-center flex items-center justify-center gap-1 shadow-xs">
                          <Sparkles className="w-2.5 h-2.5 text-primary-fixed" /> Try-on Fit
                        </span>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full w-full space-y-4 text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-2">
                        <div>
                          <h3 className="text-base md:text-lg font-extrabold text-on-surface">
                            {item.name}
                          </h3>
                          <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                            Color: {item.color || 'Midnight Blue'} &bull; Size: {item.size || 'M'}
                          </p>
                        </div>
                        <span className="text-lg md:text-xl font-extrabold text-on-surface">
                          ${(Number(item.price) * (Number(item.quantity) || 1)).toFixed(2)}
                        </span>
                      </div>

                      {/* Quantity Selector & Remove Action */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-outline-variant/20">
                        {/* Quantity Stepper */}
                        <div className="flex items-center border border-outline-variant/60 rounded-full bg-surface-container-low p-1 mx-auto sm:mx-0">
                          <button
                            onClick={() => updateCartQuantity(item.productId, item.size, item.quantity - 1)}
                            className="w-7 h-7 rounded-full bg-surface-container-lowest hover:bg-surface-container flex items-center justify-center text-on-surface transition-all cursor-pointer shadow-2xs"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-4 text-xs font-extrabold text-on-surface min-w-[28px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.productId, item.size, item.quantity + 1)}
                            className="w-7 h-7 rounded-full bg-surface-container-lowest hover:bg-surface-container flex items-center justify-center text-on-surface transition-all cursor-pointer shadow-2xs"
                            title="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-3 mx-auto sm:mx-0">
                          <button
                            onClick={() => {
                              toggleWishlist({ product: item });
                              showToast(`Saved ${item.name} to your Wishlist!`);
                            }}
                            className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Heart className="w-3.5 h-3.5" /> Save for later
                          </button>
                          <span className="text-outline-variant">&bull;</span>
                          <button
                            onClick={() => {
                              removeFromCart(item.productId, item.size);
                              showToast(`Removed ${item.name} from bag.`);
                            }}
                            className="text-xs font-bold text-error/80 hover:text-error transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Free Shipping & Returns Banner */}
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center gap-3 text-xs text-on-surface">
                <Truck className="w-5 h-5 text-primary shrink-0" />
                <span>
                  <strong className="text-primary font-bold">Complimentary Express Courier:</strong> Your order qualifies for free insured carbon-neutral shipping &amp; 30-day effortless returns.
                </span>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Order Summary Card (4 Cols) ───────────── */}
            <div className="lg:col-span-4 sticky top-24">
              <div className="bg-surface-container-lowest p-6 md:p-8 rounded-3xl border border-outline-variant/40 shadow-md space-y-6">
                <h3 className="text-xl font-extrabold text-on-surface tracking-tight border-b border-outline-variant/30 pb-4">
                  Order Summary
                </h3>

                {/* Subtotals & Taxes */}
                <div className="space-y-3.5 text-sm">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Subtotal</span>
                    <span className="font-bold text-on-surface">${(Number(subtotal) || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Shipping</span>
                    <span className="font-bold text-emerald-600">Free</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Estimated Tax (8%)</span>
                    <span className="font-bold text-on-surface">${(Number(estimatedTax) || 0).toFixed(2)}</span>
                  </div>

                  <div className="border-t border-outline-variant/30 pt-3.5 flex justify-between items-baseline">
                    <span className="text-base font-extrabold text-on-surface">Total</span>
                    <span className="text-2xl font-extrabold text-primary">
                      ${(Number(total) || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Checkout Button */}
                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleProceedToCheckout}
                    className="w-full py-4 rounded-full bg-primary hover:bg-primary-container text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-102"
                  >
                    Proceed to Checkout <ArrowRight className="w-4 h-4" />
                  </button>

                  <Link
                    to="/catalog"
                    className="block text-center text-xs font-bold text-on-surface-variant hover:text-primary transition-colors py-1"
                  >
                    Continue Shopping
                  </Link>
                </div>

                {/* Security Badge */}
                <div className="pt-4 border-t border-outline-variant/20 flex items-center justify-center gap-2 text-[11px] font-semibold text-on-surface-variant">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>256-Bit SSL Encrypted &amp; Verified Checkout</span>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* ─── EMPTY CART STATE ────────────────────────────────────── */
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/40 p-12 text-center max-w-lg mx-auto my-12 shadow-xs space-y-5">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
              <ShoppingBag className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-on-surface">Your Shopping Bag is Empty</h2>
              <p className="text-sm text-on-surface-variant mt-2 max-w-sm mx-auto">
                Looks like you haven't added any garments yet. Explore our luxury collection and try on looks with our AI fitting studio.
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
    </div>
  );
}
