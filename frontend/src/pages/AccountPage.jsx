import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import {
  Heart,
  Package,
  Trash2,
  User,
  Clock,
  RotateCcw,
  Sparkles,
  Ruler,
  CheckCircle2,
  Truck,
  ShoppingBag,
  ArrowRight,
  LogOut,
  ShieldCheck,
  LayoutDashboard,
  Settings,
  Edit3,
  Sliders,
  ChevronRight,
  Camera,
  X,
  ExternalLink
} from 'lucide-react';
import ProductImage from '../components/ProductImage';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import * as api from '../services/api';

export default function AccountPage() {
  const { isAuthenticated, logout, user } = useAuth();
  const { cartItems, wishlistItems, removeFromCart, updateCartQuantity, toggleWishlist, addToCart } = useStore();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Editable body measurements
  const [measurements, setMeasurements] = useState({
    height: "5' 10\"",
    chest: '38"',
    waist: '32"',
    hips: '39"',
  });

  // Saved outfits demo data
  const savedOutfits = [
    {
      id: 'outfit_1',
      title: 'Trench & Silk Edit',
      fitScore: '98% Fit',
      image: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=900',
      garment: 'Silk Trench (M)',
      category: 'Outerwear',
      date: 'Aug 22, 2026',
    },
    {
      id: 'outfit_2',
      title: 'Contour Denim & Midi',
      fitScore: '95% Fit',
      image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=900',
      garment: 'Contour Denim Jacket (S)',
      category: 'Dresses',
      date: 'Aug 19, 2026',
    },
    {
      id: 'outfit_3',
      title: 'Luxe Office Blazer',
      fitScore: '99% Fit',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=900',
      garment: 'Contour Blazer (38R)',
      category: 'Outerwear',
      date: 'Aug 15, 2026',
    },
  ];

  // Quick wishlist items
  const quickWishlistItems = wishlistItems.slice(0, 3);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  useEffect(() => {
    if (isAuthenticated) {
      const fetchOrders = async () => {
        try {
          const { data, error } = await api.orders.getMyOrders();
          if (!error && Array.isArray(data)) {
            setOrders(data);
          }
        } catch {
          // Fallback
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrders();
    }
  }, [isAuthenticated]);

  // Fallback guard in case ProtectedRoute is bypassed
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

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
        
        {/* ─── 1. TOP PROFILE BANNER (Stitch LUXE.AI) ─────────────────── */}
        <section className="bg-surface-container-lowest p-6 md:p-8 rounded-3xl shadow-xs border border-outline-variant/40 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="relative group">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300"
                alt={user?.name || 'Alex Johnson'}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-4 border-surface-container-low shadow-sm"
              />
              <button
                onClick={() => setIsEditingProfile(true)}
                className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full shadow-md hover:bg-primary-container transition-all cursor-pointer"
                title="Edit avatar"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2.5 mb-1">
                <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
                  {user?.name || 'Alex Johnson'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-bold uppercase tracking-wider">
                  PREMIUM
                </span>
                {user?.isAdmin && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Admin
                  </span>
                )}
              </div>
              <p className="text-on-surface-variant text-sm font-medium">
                {user?.email || 'alex.johnson@example.com'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {user?.isAdmin && (
              <Link
                to="/admin"
                className="px-5 py-2.5 rounded-full bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 font-bold text-xs transition-all flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-4 h-4" /> Admin Portal
              </Link>
            )}
            <button
              onClick={() => setIsEditingProfile(true)}
              className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary-container text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Profile
            </button>
            <button
              onClick={() => showToast('Account preferences are up to date.')}
              className="px-5 py-2.5 rounded-full border border-outline-variant text-on-surface hover:bg-surface-container font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" /> Settings
            </button>
            <button
              onClick={logout}
              className="p-2.5 rounded-full border border-outline-variant text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-all cursor-pointer"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* ─── 2. MAIN DASHBOARD GRID (2 COLUMNS) ─────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── LEFT COLUMN: Smart Fit & Active Order (5 Cols) ────────── */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Smart Fit Profile Card */}
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/40 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
                <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-primary" /> Smart Fit Profile
                </h3>
                <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  AI Calibrated
                </span>
              </div>

              {/* 2x2 Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">HEIGHT</p>
                  <p className="text-lg font-extrabold text-on-surface mt-0.5">{measurements.height}</p>
                </div>
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">CHEST</p>
                  <p className="text-lg font-extrabold text-on-surface mt-0.5">{measurements.chest}</p>
                </div>
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">WAIST</p>
                  <p className="text-lg font-extrabold text-on-surface mt-0.5">{measurements.waist}</p>
                </div>
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">HIPS</p>
                  <p className="text-lg font-extrabold text-on-surface mt-0.5">{measurements.hips}</p>
                </div>
              </div>

              <button
                onClick={() => setIsCalibrating(true)}
                className="w-full py-3 rounded-full border border-primary/40 hover:bg-primary/10 text-primary font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <Sparkles className="w-4 h-4 text-primary" /> Recalibrate with AI
              </button>
            </div>

            {/* Active Order Tracker */}
            <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/40 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
                <h3 className="text-base font-bold text-on-surface flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" /> Active Order
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-[11px]">
                  SHIPPED
                </span>
              </div>

              <div className="flex items-center gap-4">
                <img
                  src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=300"
                  alt="Structured Wool Coat"
                  className="w-16 h-16 rounded-2xl object-cover bg-surface-container shrink-0 shadow-xs"
                />
                <div>
                  <h4 className="font-bold text-sm text-on-surface">Structured Wool Coat</h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">Order #LX-84920 • Tracking #TRK-9842</p>
                  <p className="text-xs font-semibold text-primary mt-1">Expected Delivery: Tomorrow, 2:00 PM</p>
                </div>
              </div>

              {/* Step Progress Bar */}
              <div className="pt-2">
                <div className="flex justify-between items-center relative">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-outline-variant/40 -translate-y-1/2 z-0" />
                  <div className="absolute top-1/2 left-0 w-3/4 h-0.5 bg-primary -translate-y-1/2 z-0" />

                  {/* Step 1 */}
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </div>
                    <span className="text-[10px] font-medium text-on-surface">Ordered</span>
                  </div>

                  {/* Step 2 */}
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold">
                      ✓
                    </div>
                    <span className="text-[10px] font-medium text-on-surface">Processing</span>
                  </div>

                  {/* Step 3 */}
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-primary text-white ring-4 ring-primary/20 flex items-center justify-center text-[10px] font-bold animate-pulse">
                      🚚
                    </div>
                    <span className="text-[10px] font-bold text-primary">Shipped</span>
                  </div>

                  {/* Step 4 */}
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center text-[10px] font-bold">
                      4
                    </div>
                    <span className="text-[10px] font-medium text-on-surface-variant">Delivered</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN: Saved Outfits & Quick Wishlist (7 Cols) ──── */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* My Saved Outfits Card */}
            <div className="bg-surface-container-lowest p-6 md:p-8 rounded-3xl border border-outline-variant/40 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
                <div>
                  <h3 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> My Saved Outfits
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">High-fidelity 3D garment renders generated for your silhouette</p>
                </div>
                <Link
                  to="/catalog?tryon=active"
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* 3 Outfits Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {savedOutfits.map((outfit) => (
                  <div
                    key={outfit.id}
                    onClick={() => setSelectedOutfit(outfit)}
                    className="group rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant/30 hover:border-primary transition-all duration-300 shadow-2xs hover:shadow-md cursor-pointer flex flex-col"
                  >
                    <div className="relative aspect-3/4 overflow-hidden bg-surface-container">
                      <img
                        src={outfit.image}
                        alt={outfit.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-xs text-white font-extrabold text-[10px] flex items-center gap-1 shadow-md">
                        <Sparkles className="w-2.5 h-2.5 text-primary" /> {outfit.fitScore}
                      </span>
                    </div>

                    <div className="p-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-on-surface group-hover:text-primary transition-colors">
                          {outfit.title}
                        </h4>
                        <p className="text-[11px] text-on-surface-variant mt-0.5 truncate">
                          {outfit.garment}
                        </p>
                      </div>
                      <span className="text-[10px] text-primary font-bold mt-2 inline-flex items-center gap-1">
                        Open Look <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Wishlist Card */}
            <div className="bg-surface-container-lowest p-6 md:p-8 rounded-3xl border border-outline-variant/40 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
                <div>
                  <h3 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
                    <Heart className="w-4 h-4 text-primary" /> Quick Wishlist
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {wishlistItems.length} curated garments saved for later
                  </p>
                </div>
                <Link
                  to="/wishlist"
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* 3 Horizontal Items */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {quickWishlistItems.map((item) => (
                  <div
                    key={item.productId}
                    className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/30 hover:border-primary transition-all flex flex-col justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-14 rounded-xl object-cover bg-surface-container shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-xs text-on-surface truncate">{item.name}</h4>
                        <p className="text-xs font-extrabold text-primary mt-0.5">${item.price}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        addToCart({ product: item });
                        showToast(`Added ${item.name} to your Shopping Bag!`);
                      }}
                      className="w-full py-1.5 rounded-xl bg-surface-container-lowest hover:bg-primary hover:text-white text-on-surface font-bold text-[11px] border border-outline-variant/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <ShoppingBag className="w-3 h-3" /> Move to Bag
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ─── MODAL: AI Recalibrate Fit ───────────────────────────────── */}
      {isCalibrating && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
              <h3 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> Recalibrate Smart Fit
              </h3>
              <button
                onClick={() => setIsCalibrating(false)}
                className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-on-surface-variant">
                Update your body parameters. Fitsy AI recalculates drape geometry and size mapping in real-time.
              </p>

              <div>
                <label className="block font-bold text-on-surface mb-1">Height</label>
                <input
                  type="text"
                  value={measurements.height}
                  onChange={(e) => setMeasurements({ ...measurements, height: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-on-surface mb-1">Chest</label>
                  <input
                    type="text"
                    value={measurements.chest}
                    onChange={(e) => setMeasurements({ ...measurements, chest: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-on-surface mb-1">Waist</label>
                  <input
                    type="text"
                    value={measurements.waist}
                    onChange={(e) => setMeasurements({ ...measurements, waist: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-on-surface mb-1">Hips</label>
                  <input
                    type="text"
                    value={measurements.hips}
                    onChange={(e) => setMeasurements({ ...measurements, hips: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface font-medium"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  setIsCalibrating(false);
                  showToast('Smart Fit Profile recalibrated successfully!');
                }}
                className="w-full py-3 rounded-full bg-primary hover:bg-primary-container text-white font-bold text-xs shadow-md transition-all mt-4 cursor-pointer"
              >
                Save &amp; Recalibrate Silhouette
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Outfit Preview ────────────────────────────────────── */}
      {selectedOutfit && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
              <h3 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> {selectedOutfit.title}
              </h3>
              <button
                onClick={() => setSelectedOutfit(null)}
                className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative aspect-4/5 rounded-2xl overflow-hidden bg-surface-container">
              <img
                src={selectedOutfit.image}
                alt={selectedOutfit.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-4 right-4 px-3 py-1 bg-black/80 backdrop-blur-md text-white font-extrabold text-xs rounded-full shadow-lg">
                {selectedOutfit.fitScore} Accuracy
              </span>
            </div>

            <div className="flex gap-3">
              <Link
                to="/catalog"
                onClick={() => setSelectedOutfit(null)}
                className="w-1/2 py-2.5 rounded-full border border-outline-variant text-on-surface font-bold text-xs text-center hover:bg-surface-container"
              >
                Shop Similar
              </Link>
              <Link
                to="/catalog?tryon=active"
                onClick={() => setSelectedOutfit(null)}
                className="w-1/2 py-2.5 rounded-full bg-primary text-white font-bold text-xs text-center hover:bg-primary-container shadow-md"
              >
                Try On in Live Studio
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: Edit Profile ──────────────────────────────────────── */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
              <h3 className="text-lg font-extrabold text-on-surface flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-primary" /> Edit Profile Details
              </h3>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-on-surface mb-1">Full Name</label>
                <input
                  type="text"
                  defaultValue={user?.name || 'Alex Johnson'}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/50 bg-surface-container-low text-on-surface font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface mb-1">Email Address</label>
                <input
                  type="email"
                  defaultValue={user?.email || 'alex.johnson@example.com'}
                  disabled
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/30 bg-surface-container text-on-surface-variant font-medium opacity-70"
                />
              </div>

              <button
                onClick={() => {
                  setIsEditingProfile(false);
                  showToast('Profile information updated successfully!');
                }}
                className="w-full py-3 rounded-full bg-primary hover:bg-primary-container text-white font-bold text-xs shadow-md transition-all mt-4 cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
