import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Heart, Package, Trash2, User, Clock, RotateCcw } from 'lucide-react';
import ProductImage from '../components/ProductImage';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import * as api from '../services/api';

export default function AccountPage() {
  const { isAuthenticated, logout, user } = useAuth();
  const { cartItems, wishlistItems, removeFromCart, updateCartQuantity, toggleWishlist } = useStore();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState(null);
  const [reorderingId, setReorderingId] = useState(null); // tracks which order is being re-added

  // Issue 7: Re-add all items from a past order to the cart
  const handleOrderAgain = async (order) => {
    setReorderingId(order._id);
    for (const item of order.items) {
      if (!item.productId) continue; // skip deleted products
      await addToCart({
        product: {
          id: item.productId._id,
          name: item.productId.name,
          price: item.price,
          image: item.productId.image,
        },
        size: item.size,
      });
    }
    setReorderingId(null);
  };

  useEffect(() => {
    if (isAuthenticated) {
      const fetchOrders = async () => {
        const { data, error } = await api.orders.getMyOrders();
        if (error) {
          setOrdersError(error);
        } else {
          setOrders(data || []);
        }
        setLoadingOrders(false);
      };
      fetchOrders();
    }
  }, [isAuthenticated]);

  // Fallback guard in case ProtectedRoute is bypassed
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="account-page">
      <div className="container account-page__layout">
        <section className="account-hero">
          <span className="eyebrow">My Account</span>
          <h1>Welcome back, {user.name}.</h1>
          <p>
            Your account area is now live with a frontend-ready auth flow. We can connect this to a
            real backend next.
          </p>
          <div className="account-hero__actions">
            <Link to="/catalog" className="btn-secondary">Keep shopping</Link>
            <button type="button" className="btn-primary" onClick={logout}>Log out</button>
          </div>
        </section>

        <section className="account-grid">
          <div className="account-card">
            <User size={18} />
            <strong>{user.email}</strong>
            <span>Primary email</span>
          </div>
          <div className="account-card">
            <Clock size={18} />
            <strong>{orders.length} orders</strong>
            <span>Past purchases</span>
          </div>
          <div className="account-card">
            <Package size={18} />
            <strong>{cartItems.length} cart lines</strong>
            <span>Active bag summary</span>
          </div>
          <div className="account-card">
            <Heart size={18} />
            <strong>{wishlistItems.length} wishlist items</strong>
            <span>Saved favorites</span>
          </div>
        </section>

        <section className="account-lists">
          {/* ─── Order History ──────────────────────────────────────────────── */}
          <div className="account-list">
            <div className="results-head">
              <div>
                <span className="eyebrow">History</span>
                <h2>Your Orders</h2>
              </div>
            </div>
            
            {loadingOrders ? (
              <p className="account-empty">Loading orders...</p>
            ) : ordersError ? (
              <p className="account-empty" style={{ color: 'var(--accent)' }}>Failed to load orders: {ordersError}</p>
            ) : orders.length === 0 ? (
              <p className="account-empty">You haven't placed any orders yet.</p>
            ) : (
              <div className="account-items" style={{ display: 'grid', gap: '1.5rem' }}>
                {orders.map((order) => (
                  <div key={order._id} style={{ border: '1px solid var(--line)', borderRadius: '1.25rem', overflow: 'hidden' }}>
                    
                    {/* Order Header */}
                    <div style={{ background: 'var(--surface)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)' }}>
                      <div>
                        <strong style={{ display: 'block', fontSize: '1.1rem' }}>Order #{order._id.substring(order._id.length - 6).toUpperCase()}</strong>
                        <span style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>
                          {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--accent)' }}>${order.totalPrice.toFixed(2)}</strong>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '1rem', background: order.status === 'Delivered' ? '#dcfce7' : '#fef9c3', color: order.status === 'Delivered' ? '#166534' : '#854d0e', display: 'inline-block', marginTop: '0.2rem' }}>
                          {order.status}
                        </span>
                        {/* Issue 7: Order Again button */}
                        {order.items.length > 0 && (
                          <button
                            onClick={() => handleOrderAgain(order)}
                            disabled={reorderingId === order._id}
                            style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: '1px solid var(--accent)', borderRadius: '0.75rem', padding: '0.3rem 0.75rem', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', whiteSpace: 'nowrap' }}
                          >
                            <RotateCcw size={12} />
                            {reorderingId === order._id ? 'Adding...' : 'Order Again'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
                      {order.items.length === 0 ? (
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--ink-soft)', fontStyle: 'italic' }}>
                          ⚠️ The items in this order are no longer available in the catalog.
                        </p>
                      ) : (
                        order.items.map((item) => (
                          <div key={`${item.productId?._id}-${item.size}`} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <img 
                              src={item.productId?.image} 
                              alt={item.productId?.name} 
                              style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '0.5rem', background: 'var(--surface)' }} 
                            />
                            <div style={{ flex: 1 }}>
                              <strong style={{ fontSize: '0.95rem', display: 'block' }}>{item.productId?.name}</strong>
                              <span style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>Size: {item.size} · Qty: {item.quantity}</span>
                            </div>
                            <strong style={{ fontSize: '0.95rem' }}>${(item.price * item.quantity).toFixed(2)}</strong>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Order Footer / Shipping Details - Issue 9: include phone number */}
                    <div style={{ background: 'var(--surface)', padding: '1rem 1.5rem', borderTop: '1px solid var(--line)', fontSize: '0.85rem', color: 'var(--ink-soft)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                       <Package size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                       <span>
                         <strong>Shipped to: </strong>
                         {order.shippingDetails?.fullName}, {order.shippingDetails?.address}, {order.shippingDetails?.city}
                         {order.shippingDetails?.phoneNumber && (
                           <> &nbsp;·&nbsp; 📞 {order.shippingDetails.phoneNumber}</>
                         )}
                       </span>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── Active Bag ─────────────────────────────────────────────────── */}
          <div className="account-list">
            <div className="results-head">
              <div>
                <span className="eyebrow">Bag</span>
                <h2>Your cart</h2>
              </div>
            </div>
            {cartItems.length === 0 ? (
              <p className="account-empty">Your cart is empty right now.</p>
            ) : (
              <div className="account-items">
                {cartItems.map((item) => (
                  <div key={`${item.productId}-${item.size}`} className="account-item">
                    <ProductImage product={item} src={item.image} alt={item.name} />
                    <div>
                      <strong>
                        <Link to={`/product/${item.productId}`} className="product-link">
                          {item.name}
                        </Link>
                      </strong>
                      <span>Size {item.size}</span>
                      <div className="quantity-adjuster" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <button
                          type="button"
                          className="qty-btn"
                          style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid currentColor', background: 'none', color: 'inherit', cursor: 'pointer', opacity: 0.8 }}
                          onClick={() => updateCartQuantity({ productId: item.productId, size: item.size, quantity: item.quantity - 1 })}
                        >
                          -
                        </button>
                        <span className="qty-val" style={{ minWidth: '20px', textAlign: 'center', color: 'inherit' }}>{item.quantity}</span>
                        <button
                          type="button"
                          className="qty-btn"
                          style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid currentColor', background: 'none', color: 'inherit', cursor: 'pointer', opacity: 0.8 }}
                          onClick={() => updateCartQuantity({ productId: item.productId, size: item.size, quantity: item.quantity + 1 })}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto' }}>
                      <strong style={{ fontSize: '0.95rem' }}>${(item.price * item.quantity).toFixed(2)}</strong>
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => removeFromCart({ productId: item.productId, size: item.size })}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {cartItems.length > 0 && (
                  <div style={{ marginTop: '24px', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
                    <div className="cart-summary" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.9, marginBottom: '16px' }}>
                      <span style={{ fontWeight: '500' }}>Total Order Price</span>
                      <strong style={{ fontSize: '1.25rem' }}>
                        ${cartItems.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)}
                      </strong>
                    </div>
                    <Link to="/checkout" className="btn-primary" style={{ display: 'block', textAlign: 'center', width: '100%' }}>
                      Proceed to Checkout
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── Wishlist ───────────────────────────────────────────────────── */}
          <div className="account-list">
            <div className="results-head">
              <div>
                <span className="eyebrow">Wishlist</span>
                <h2>Saved products</h2>
              </div>
            </div>
            {wishlistItems.length === 0 ? (
              <p className="account-empty">You have no wishlist items yet.</p>
            ) : (
              <div className="account-items">
                {wishlistItems.map((item) => (
                  <div key={item.productId} className="account-item">
                    <ProductImage product={item} src={item.image} alt={item.name} />
                    <div>
                      <strong>
                        <Link to={`/product/${item.productId}`} className="product-link">
                          {item.name}
                        </Link>
                      </strong>
                      <span>{item.category}</span>
                      <span>${item.price.toFixed(2)}</span>
                    </div>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() =>
                        toggleWishlist({
                          product: {
                            id: item.productId,
                            name: item.name,
                            price: item.price,
                            image: item.image,
                            category: item.category,
                          },
                        })
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
