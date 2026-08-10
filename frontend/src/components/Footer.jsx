import { Link } from 'react-router-dom';
import { Sparkles, Send, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-surface-container-low border-t border-outline-variant/40 pt-16 pb-8 text-on-surface">
      <div className="max-w-container-max mx-auto px-4 md:px-margin-desktop">
        {/* Value Proposition Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12 mb-12 border-b border-outline-variant/30">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface/60 border border-outline-variant/30">
            <div className="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-on-surface">AI Garment Fitting</h4>
              <p className="text-xs text-on-surface-variant">Real-time overlay &amp; fit accuracy scoring</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface/60 border border-outline-variant/30">
            <div className="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-on-surface">Fast Global Shipping</h4>
              <p className="text-xs text-on-surface-variant">Free delivery on orders over $120</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface/60 border border-outline-variant/30">
            <div className="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary shrink-0">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-on-surface">Easy 30-Day Returns</h4>
              <p className="text-xs text-on-surface-variant">Hassle-free exchanges &amp; instant refunds</p>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Col */}
          <div className="flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold tracking-tight text-primary font-sans">
                FITSY
              </span>
            </Link>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              FITSY merges high-fashion editorial aesthetics with state-of-the-art AI Virtual Fitting Room technology to let you try on clothes before buying.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="text-sm font-bold uppercase tracking-wider text-on-surface mb-4">Shop &amp; Experience</h5>
            <ul className="flex flex-col gap-2.5 text-sm text-on-surface-variant">
              <li>
                <Link to="/catalog" className="hover:text-primary transition-colors">Shop All Collections</Link>
              </li>
              <li>
                <Link to="/catalog?tryon=active" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Virtual Try-On Room
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-primary transition-colors">Admin Dashboard</Link>
              </li>
              <li>
                <Link to="/account" className="hover:text-primary transition-colors">My Orders &amp; Fitting Room</Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h5 className="text-sm font-bold uppercase tracking-wider text-on-surface mb-4">Categories</h5>
            <ul className="flex flex-col gap-2.5 text-sm text-on-surface-variant">
              <li>
                <Link to="/catalog?category=Outerwear" className="hover:text-primary transition-colors">Jackets &amp; Outerwear</Link>
              </li>
              <li>
                <Link to="/catalog?category=Tops" className="hover:text-primary transition-colors">T-Shirts &amp; Shirts</Link>
              </li>
              <li>
                <Link to="/catalog?category=Dresses" className="hover:text-primary transition-colors">Dresses &amp; Gowns</Link>
              </li>
              <li>
                <Link to="/catalog?category=Pants" className="hover:text-primary transition-colors">Pants &amp; Denim</Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Box */}
          <div>
            <h5 className="text-sm font-bold uppercase tracking-wider text-on-surface mb-4">Stay Inspired</h5>
            <p className="text-sm text-on-surface-variant mb-3">
              Subscribe for new virtual collection drops, exclusive fitting features, and style updates.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-surface border border-outline-variant/60 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="bg-primary text-white p-2.5 rounded-xl hover:bg-primary-container transition-colors shadow-md flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom copyright & policies */}
        <div className="pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-on-surface-variant">
          <p>© 2026 FITSY AI Virtual Fitting Room Platform. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/policy" className="hover:text-primary transition-colors">Platform Policy</Link>
            <span className="flex items-center gap-1 text-primary font-semibold">
              <ShieldCheck className="w-4 h-4" /> SSL Encrypted &amp; Secure
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

