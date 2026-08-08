import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Heart, Sparkles, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import ProductImage from './ProductImage';

export default function ProductCard({ product, featured = false }) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { cartItems, addToCart, updateCartQuantity, wishlistItems, toggleWishlist } = useStore();
  const isWishlisted = isAuthenticated
    ? wishlistItems.some((item) => item.productId === (product.id || product._id))
    : false;

  const totalQuantity = useMemo(() => {
    return cartItems
      .filter((item) => item.productId === (product.id || product._id))
      .reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems, product]);

  const cartItemForProduct = useMemo(
    () => cartItems.find((item) => item.productId === (product.id || product._id)),
    [cartItems, product]
  );
  const activeSize = cartItemForProduct ? cartItemForProduct.size : product.sizes?.[0] || 'Standard';

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
    <Link to={`/product/${product.id || product._id}`} className={`product-tile ${featured ? 'product-tile--featured' : ''}`}>
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
                  updateCartQuantity({ productId: product.id || product._id, size: activeSize, quantity: totalQuantity - 1 });
                }}
              >
                -
              </button>
              <span className="qty-val" style={{ fontWeight: 'bold', fontSize: '13px' }}>{totalQuantity} in bag</span>
              <button
                type="button"
                className="qty-btn"
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', padding: '0 8px' }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isAuthenticated) { navigate('/auth'); return; }
                  updateCartQuantity({ productId: product.id || product._id, size: activeSize, quantity: totalQuantity + 1 });
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
