import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Camera, Heart, ShoppingBag, Sparkles, Star } from 'lucide-react';
import AROverlay from '../components/AROverlay';
import ProductCard from '../components/ProductCard';
import ProductImage from '../components/ProductImage';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../context/ProductsContext';
import { useStore } from '../context/StoreContext';

export default function ProductPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const { products, getProductById } = useProducts();
  const { cartItems, addToCart, updateCartQuantity, wishlistItems, toggleWishlist } = useStore();

  const product = getProductById(id) || products[0];
  const [isAROpen, setIsAROpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState(product?.sizes?.[0]);
  const [feedback, setFeedback] = useState('');

  const currentCartItem = useMemo(
    () => cartItems.find((item) => item.productId === (product?.id || product?._id) && item.size === selectedSize),
    [cartItems, product, selectedSize]
  );
  const currentQuantity = currentCartItem ? currentCartItem.quantity : 0;

  const relatedProducts = useMemo(
    () => products.filter((item) => item.category === product?.category && (item.id || item._id) !== (product?.id || product?._id)).slice(0, 4),
    [products, product?.category, product?.id, product?._id],
  );

  useEffect(() => {
    setSelectedSize(product?.sizes?.[0]);
    setFeedback('');
  }, [product]);

  const isWishlisted = isAuthenticated
    ? wishlistItems.some((item) => item.productId === (product?.id || product?._id))
    : false;

  function requireAuth() {
    navigate('/auth', {
      state: {
        from: {
          pathname: `/product/${product?.id || product?._id}`,
        },
      },
    });
  }

  async function handleAddToCart() {
    if (!isAuthenticated) {
      requireAuth();
      return;
    }

    await addToCart({ product, size: selectedSize });
    setFeedback(`${product.name} was added to your cart in size ${selectedSize}.`);
  }

  async function handleToggleWishlist() {
    if (!isAuthenticated) {
      requireAuth();
      return;
    }

    await toggleWishlist({ product });
    setFeedback(
      isWishlisted
        ? `${product.name} was removed from your wishlist.`
        : `${product.name} was saved to your wishlist.`,
    );
  }

  if (!product) return null;

  return (
    <div className="product-page">
      <section className="container product-stage">
        <Link to="/catalog" className="back-link">
          <ArrowLeft size={18} /> Back to catalog
        </Link>

        <div className="product-stage__layout">
          <div className="product-gallery">
            <div className="product-gallery__frame">
              <ProductImage
                product={product}
                src={product.image}
                alt={product.name}
                className="product-gallery__image"
              />
            </div>
            <div className="product-gallery__notes">
              <span><Sparkles size={12} /> {product.badge}</span>
              <span>{product.inventory} pieces left</span>
            </div>
          </div>

          <div className="product-summary">
            <span className="eyebrow">{product.category}</span>
            <h1>{product.name}</h1>
            <div className="product-summary__rating">
              <span><Star size={14} fill="currentColor" /> {product.rating}</span>
              <span>124 reviews</span>
            </div>
            <p className="product-summary__price">${product.price.toFixed(2)}</p>
            <p className="product-summary__description">{product.description}</p>

            <div className="product-summary__panel">
              <span>Select size</span>
              <div className="size-options">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`size-button ${selectedSize === size ? 'is-selected' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="product-summary__actions">
              {currentQuantity > 0 ? (
                <div className="btn-primary quantity-adjuster" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', minWidth: '160px' }}>
                  <button
                    type="button"
                    className="qty-btn"
                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold' }}
                    onClick={() => updateCartQuantity({ productId: product.id || product._id, size: selectedSize, quantity: currentQuantity - 1 })}
                  >
                    -
                  </button>
                  <span className="qty-val" style={{ color: 'white', fontWeight: 'bold' }}>{currentQuantity} in bag</span>
                  <button
                    type="button"
                    className="qty-btn"
                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold' }}
                    onClick={() => updateCartQuantity({ productId: product.id || product._id, size: selectedSize, quantity: currentQuantity + 1 })}
                  >
                    +
                  </button>
                </div>
              ) : (
                <button className="btn-primary" type="button" onClick={handleAddToCart}>
                  <ShoppingBag size={18} /> Add to bag
                </button>
              )}
              <button className={`btn-secondary ${isWishlisted ? 'is-selected' : ''}`} type="button" onClick={handleToggleWishlist}>
                <Heart size={18} /> {isWishlisted ? 'Wishlisted' : 'Save to wishlist'}
              </button>
              <button className="btn-secondary" type="button" onClick={() => setIsAROpen(true)}>
                <Camera size={18} /> Virtual Try-On
              </button>
            </div>
            {feedback && <p className="product-feedback">{feedback}</p>}

            <div className="product-summary__facts">
              <div>
                <strong>{product.accent}</strong>
                <span>Core style note</span>
              </div>
              <div>
                <strong>{product.vtoType}</strong>
                <span>Preview mode</span>
              </div>
              <div>
                <strong>{product.inventory}</strong>
                <span>In stock</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="container section-space">
          <div className="results-head">
            <div>
              <span className="eyebrow">Related selection</span>
              <h2>More from {product.category}</h2>
            </div>
          </div>

          <div className="editorial-board__cards">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id || item._id} product={item} />
            ))}
          </div>
        </section>
      )}

      {isAROpen && <AROverlay product={product} onClose={() => setIsAROpen(false)} />}
    </div>
  );
}
