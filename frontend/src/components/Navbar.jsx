import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Heart, Menu, Moon, Search, ShoppingBag, Sun, User, X, Sparkles, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';

export default function Navbar({ theme, onToggleTheme }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { cartItems, wishlistItems } = useStore();

  const cartCount = isAuthenticated ? cartItems.reduce((sum, item) => sum + item.quantity, 0) : 0;
  const wishlistCount = isAuthenticated ? wishlistItems.length : 0;

  return (
    <nav className="top-0 z-50 sticky bg-surface/90 shadow-sm backdrop-blur-md border-b border-outline-variant/30">
      {/* Top ribbon banner */}
      <div className="bg-primary/5 text-primary-fixed-variant text-xs py-1.5 px-4 text-center border-b border-outline-variant/20 hidden sm:block">
        <div className="max-w-container-max mx-auto flex justify-between items-center font-medium">
          <span>✨ Experience Next-Gen AI Virtual Fitting Room</span>
          <span className="font-semibold text-primary">FITSY Exclusive: Instant Garment Overlay &amp; Fit Analysis</span>
          <span>🚚 Free Express Shipping Worldwide</span>
        </div>
      </div>

      <div className="flex justify-between items-center w-full px-4 md:px-margin-desktop py-3.5 max-w-container-max mx-auto">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-primary-container flex items-center justify-center text-on-primary shadow-md group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold tracking-tighter text-primary font-sans">
            FITSY
          </span>
        </Link>

        {/* Navigation Links (Desktop) */}
        <div className="hidden md:flex gap-8 items-center">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `text-sm font-semibold transition-colors duration-200 py-1 ${
                isActive ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'
              }`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/catalog"
            end
            className={({ isActive }) =>
              `text-sm font-semibold transition-colors duration-200 py-1 ${
                isActive ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'
              }`
            }
          >
            Shop All
          </NavLink>
          <NavLink
            to="/catalog?category=Outerwear"
            className={({ isActive }) =>
              `text-sm font-semibold transition-colors duration-200 py-1 ${
                isActive ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'
              }`
            }
          >
            Outerwear
          </NavLink>
          <NavLink
            to="/catalog?category=Tops"
            className={({ isActive }) =>
              `text-sm font-semibold transition-colors duration-200 py-1 ${
                isActive ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'
              }`
            }
          >
            Tops
          </NavLink>
          <NavLink
            to="/catalog?category=Bottoms"
            className={({ isActive }) =>
              `text-sm font-semibold transition-colors duration-200 py-1 ${
                isActive ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'
              }`
            }
          >
            Bottoms
          </NavLink>
          <NavLink
            to="/catalog?category=Dresses"
            className={({ isActive }) =>
              `text-sm font-semibold transition-colors duration-200 py-1 ${
                isActive ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'
              }`
            }
          >
            Dresses
          </NavLink>
          <NavLink
            to="/catalog?tryon=active"
            className={({ isActive }) =>
              `text-sm font-semibold flex items-center gap-1.5 transition-colors duration-200 py-1 ${
                isActive ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'
              }`
            }
          >
            <Sparkles className="w-4 h-4 text-primary" />
            Virtual Try-On
          </NavLink>
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `text-sm font-semibold flex items-center gap-1.5 transition-colors duration-200 py-1 ${
                isActive ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4" />
            Admin Portal
          </NavLink>
        </div>

        {/* Trailing Action Icons */}
        <div className="flex items-center gap-3 md:gap-4 text-primary">
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <Link
            to="/wishlist"
            className="relative p-2 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant"
            title="Wishlist"
          >
            <Heart className="w-5 h-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link
            to="/cart"
            className="relative p-2 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant"
            title="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          <Link
            to={isAuthenticated ? '/account' : '/auth'}
            className="flex items-center gap-2 p-1.5 pl-2 pr-3 rounded-full border border-outline-variant/60 hover:border-primary transition-all text-on-surface"
          >
            <User className="w-5 h-5 text-primary" />
            <span className="text-xs font-semibold hidden sm:inline">
              {isAuthenticated ? (user?.name || 'Account') : 'Sign In'}
            </span>
          </Link>

          <button
            className="md:hidden p-2 text-on-surface-variant"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-surface border-b border-outline-variant/40 px-6 py-4 flex flex-col gap-4 shadow-lg">
          <NavLink
            to="/"
            onClick={() => setIsMenuOpen(false)}
            className="text-base font-medium text-on-surface hover:text-primary"
          >
            Home
          </NavLink>
          <NavLink
            to="/catalog"
            onClick={() => setIsMenuOpen(false)}
            className="text-base font-medium text-on-surface hover:text-primary"
          >
            Shop All
          </NavLink>
          <NavLink
            to="/catalog?category=Outerwear"
            onClick={() => setIsMenuOpen(false)}
            className="text-base font-medium text-on-surface hover:text-primary"
          >
            Outerwear
          </NavLink>
          <NavLink
            to="/catalog?category=Tops"
            onClick={() => setIsMenuOpen(false)}
            className="text-base font-medium text-on-surface hover:text-primary"
          >
            Tops
          </NavLink>
          <NavLink
            to="/catalog?category=Bottoms"
            onClick={() => setIsMenuOpen(false)}
            className="text-base font-medium text-on-surface hover:text-primary"
          >
            Bottoms
          </NavLink>
          <NavLink
            to="/catalog?category=Dresses"
            onClick={() => setIsMenuOpen(false)}
            className="text-base font-medium text-on-surface hover:text-primary"
          >
            Dresses
          </NavLink>
          <NavLink
            to="/catalog?tryon=active"
            onClick={() => setIsMenuOpen(false)}
            className="text-base font-medium text-on-surface hover:text-primary flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            Virtual Try-On
          </NavLink>
          <NavLink
            to="/admin"
            onClick={() => setIsMenuOpen(false)}
            className="text-base font-medium text-on-surface hover:text-primary flex items-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            Admin Portal
          </NavLink>
        </div>
      )}
    </nav>
  );
}
