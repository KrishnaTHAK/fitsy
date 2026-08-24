import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Heart, Sparkles, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import ProductImage from './ProductImage';

// Normalize product IDs to strings for reliable === comparisons.
// Static catalog uses numeric ids; backend returns MongoDB ObjectId strings.
const toStr = (v) => String(v ?? '');

export default function ProductCard({ product, featured = false }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { cartItems, addToCart, updateCartQuantity, wishlistItems, toggleWishlist } = useStore();

  const productId = toStr(product.id || product._id);

  // Wishlist check — compare as strings to handle numeric vs ObjectId ids
  const isWishlisted = isAuthenticated
    ? wishlistItems.some((item) => toStr(item.productId) === productId)
    : false;

  // Use the first available size as the default active size for the card
  const defaultSize = product.sizes?.[0] || 'Standard';

  // Find the cart item for this product at the default/active size specifically
  // (not a cross-size aggregate) so the quantity adjuster controls the right item
  const cartItemForProduct = useMemo(
    () => cartItems.find((item) => toStr(item.productId) === productId && item.size === defaultSize),
    [cartItems, productId, defaultSize],
  );

  // Quantity shown on the card is size-specific, not a cross-size total
  const activeSize = cartItemForProduct ? cartItemForProduct.size : defaultSize;
  const sizeQuantity = cartItemForProduct ? cartItemForProduct.quantity : 0;

  // Overall count across all sizes — used only to decide whether to show the
  // quantity adjuster at all (if the product is in the cart in any size)
  const totalQuantity = useMemo(
    () => cartItems.filter((item) => toStr(item.productId) === productId).reduce((sum, item) => sum + item.quantity, 0),
    [cartItems, productId],
  );

  function handleWishlistToggle(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    toggleWishlist({ product });
  }

  return (
    <Link to={`/product/${productId}`} className={`product-tile ${featured ? 'product-tile--featured' : ''}`}>
      <div className="product-tile__media">
        <ProductImage product={product} src={product.image} alt={product.name} className="product-tile__image" loading="lazy" />
        <div className="product-tile__overlay"></div>
        <div className="product-tile__chips">
          <span>{product.badge}</span>
          <button type="button" className={`tile-icon-button ${isWishlisted ? 'is-active' : ''}`} onClick={handleWishlistToggle}>
            <Heart size={14} />
          </button>
        </div>
        <div className="product-tile__ar"><Sparkles size={12} /> AR</div>
      </div>

      <div className="product-tile__body">
        <div className="product-tile__meta">
          <span>{product.category}</span>
          <span><Star size={13} fill="currentColor" /> {product.rating}</span>
        </div>
        <h3>{product.name}</h3>
        <p>{product.accent}</p>
        <div className="product-tile__footer">
          <strong>${product.price.toFixed(2)}</strong>
          <span>{product.inventory} in stock</span>
        </div>
        {totalQuantity > 0 ? (
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <div
              className="quantity-adjuster"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#121212', color: '#ffffff', borderRadius: '6px', flex: 1 }}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <button
                type="button"
                className="qty-btn"
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', padding: '0 8px' }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isAuthenticated) { navigate('/auth'); return; }
                  // Use sizeQuantity (size-specific) so the decrement targets the right item
                  updateCartQuantity({ productId, size: activeSize, quantity: sizeQuantity - 1 });
                }}
              >
                -
              </button>
              <span className="qty-val" style={{ fontWeight: 'bold', fontSize: '13px' }}>
                {sizeQuantity} in bag
              </span>
              <button
                type="button"
                className="qty-btn"
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', padding: '0 8px' }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isAuthenticated) { navigate('/auth'); return; }
                  updateCartQuantity({ productId, size: activeSize, quantity: sizeQuantity + 1 });
                }}
              >
                +
              </button>
            </div>
            <button
              type="button"
              className="btn-primary"
              style={{ padding: '8px 12px', fontSize: '12px', borderRadius: '6px', whiteSpace: 'nowrap' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate('/checkout');
              }}
            >
              Buy Now
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="product-tile__cta" style={{ marginTop: 0 }}>
              <span>Open product</span>
              <ArrowUpRight size={16} />
            </div>
            <button
              type="button"
              className="btn-primary"
              style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px' }}
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isAuthenticated) { navigate('/auth'); return; }
                await addToCart({ product, size: activeSize });
                navigate('/checkout');
              }}
            >
              Buy Now
            </button>
          </div>
        )}
      </div>
    </Link>
  );
}
