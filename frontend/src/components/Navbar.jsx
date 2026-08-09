import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Heart, Menu, Moon, Search, ShoppingBag, Sun, User, X } from 'lucide-react';
import BrandLogo from './BrandLogo';
import { NAV_ITEMS } from '../data/products';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';

export default function Navbar({ theme, onToggleTheme }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { cartItems, wishlistItems } = useStore();
  const cartCount = isAuthenticated ? cartItems.reduce((sum, item) => sum + item.quantity, 0) : 0;
  const wishlistCount = isAuthenticated ? wishlistItems.length : 0;

  return (
    <header className="site-frame">
      <div className="top-ribbon">
        <div className="container top-ribbon__inner">
          <span>Curated style platform</span>
          <span>Try-on enabled on selected fashion, beauty, and eyewear</span>
          <span>Free shipping on orders above $120</span>
        </div>
      </div>

      <div className="container">
        <div className="site-header">
          <Link to="/">
            <BrandLogo />
          </Link>

          <nav className={`site-nav ${isMenuOpen ? 'site-nav--open' : ''}`}>
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `site-nav__link ${isActive ? 'is-active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}

            {/* Admin Panel Link - Renders only for Admins */}
            {isAuthenticated && user?.isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) => `site-nav__link ${isActive ? 'is-active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
                style={{ color: '#ff4444', fontWeight: 'bold' }} // Optional: slight highlight for the admin link
              >
                Admin Panel
              </NavLink>
            )}
          </nav>

          <div className="site-actions">
            <label className="header-search">
              <Search size={16} />
              <input type="text" placeholder="Search products, edits, collections" />
            </label>
            <button className="icon-button" type="button" onClick={onToggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link className="icon-button nav-badge" to={isAuthenticated ? '/account' : '/auth'} aria-label="Wishlist">
              <Heart size={18} />
              {wishlistCount > 0 && <span>{wishlistCount}</span>}
            </Link>
            <Link className="icon-button nav-badge" to={isAuthenticated ? '/account' : '/auth'} aria-label="Shopping bag">
              <ShoppingBag size={18} />
              {cartCount > 0 && <span>{cartCount}</span>}
            </Link>
            <Link className="icon-button" to={isAuthenticated ? '/account' : '/auth'} aria-label="Account">
              <User size={18} />
            </Link>
            <button
              className="icon-button nav-toggle"
              type="button"
              aria-label="Toggle navigation"
              onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
            >
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}