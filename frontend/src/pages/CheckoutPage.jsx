import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, MapPin, CheckCircle, Package, Plus, Edit3, Smartphone, Truck, ShieldCheck, Sparkles, Trash2, ShoppingBag } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import StripePaymentForm from '../components/StripePaymentForm';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateCartQuantity, clearCartLocal } = useStore();
  const { user, updateAddress } = useAuth();

  const savedAddresses = user?.shippingAddresses || [];

  const [checkoutStep, setCheckoutStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);

  const [selectedAddressIndex, setSelectedAddressIndex] = useState(
    savedAddresses.length > 0 ? 0 : null
  );
  const [showNewForm, setShowNewForm] = useState(savedAddresses.length === 0);
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    phoneNumber: '',
  });

  const [saveLoading, setSaveLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [stripeOrderId, setStripeOrderId] = useState(null);

  const subtotal = useMemo(
    () => (cartItems || []).reduce((total, item) => total + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0),
    [cartItems]
  );
  const shippingFee = subtotal > 120 ? 0 : 15;
  const grandTotal = Math.max(0, subtotal + shippingFee - discount);
  const totalPrice = grandTotal;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- Handlers ---
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.address || !formData.city || !formData.postalCode || !formData.country) {
      setError('Please fill in all required fields (Name, Street, City, Zip, Country).');
      return;
    }

    setSaveLoading(true);
    setError(null);

    const { success: saved, message: saveError } = await updateAddress(formData);
    setSaveLoading(false);

    if (saved) {
      // Clear form inputs
      setFormData({
        fullName: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
        phoneNumber: '',
      });
      // Select the newest address and hide form
      const nextIndex = (user?.shippingAddresses || savedAddresses).length;
      setSelectedAddressIndex(nextIndex);
      setShowNewForm(false);
    } else {
      setError(saveError || 'Could not save shipping address.');
    }
  };

  const handleContinueToReview = () => {
    if (selectedAddressIndex === null || !savedAddresses[selectedAddressIndex]) {
      setError('Please select or add a shipping address to continue.');
      return;
    }
    setError(null);
    setCheckoutStep(2);
  };

  // COD: create order directly
  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) { setError('Your cart is empty.'); return; }
    setOrderLoading(true);
    setError(null);

    const shippingDetails = savedAddresses[selectedAddressIndex];
    const orderItems = cartItems.map((item) => ({
      productId: item.productId, size: item.size, quantity: item.quantity, price: item.price,
    }));

    const { error: apiError } = await api.orders.create({
      items: orderItems, shippingDetails, totalPrice, paymentMethod,
    });

    setOrderLoading(false);
    if (apiError) {
      const isAuthError = apiError.toLowerCase().includes('not authorized') || apiError.toLowerCase().includes('no token') || apiError.toLowerCase().includes('token failed');
      setError(isAuthError ? 'Your session has expired. Please log out and log in again.' : apiError);
    } else {
      setSuccess(true);
      clearCartLocal();
    }
  };

  // Card / UPI: create Stripe PaymentIntent and show payment form
  const handleInitiateStripePayment = async () => {
    if (cartItems.length === 0) { setError('Your cart is empty.'); return; }
    setOrderLoading(true);
    setError(null);

    const shippingDetails = savedAddresses[selectedAddressIndex];
    const orderItems = cartItems.map((item) => ({
      productId: item.productId, size: item.size, quantity: item.quantity, price: item.price,
    }));

    const { data, error: apiError } = await api.orders.createPaymentIntent({
      items: orderItems, shippingDetails, totalPrice, paymentMethod,
    });

    setOrderLoading(false);
    if (apiError) {
      setError(apiError);
    } else {
      setClientSecret(data.clientSecret);
      setStripeOrderId(data.orderId);
    }
  };

  // Called by StripePaymentForm on successful card/UPI payment
  const handleStripeSuccess = async () => {
    setSuccess(true);
    await clearCartLocal();
  };

  // Called by StripePaymentForm on payment error
  const handleStripeError = (message) => {
    setError(message);
  };

  // ─── Render Success Screen ──────────────────────────────────────────────────
  if (success) {
    return (
      <div className="container" style={{ minHeight: '80vh', display: 'grid', placeItems: 'center', textAlign: 'center', padding: '2rem' }}>
        <div style={{ maxWidth: '480px', padding: '3rem', border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: '2rem', boxShadow: 'var(--shadow)', display: 'grid', gap: '1.5rem', placeItems: 'center' }}>
          <CheckCircle size={64} color="var(--accent)" />
          <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Order Confirmed!</h1>
          <p style={{ color: 'var(--ink-soft)', lineHeight: 1.6, margin: 0 }}>
            Thank you for your purchase. Your order has been successfully placed and is now processing.
          </p>
          <Link to="/catalog" className="btn-primary" style={{ width: '100%', textAlign: 'center' }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // ─── Render Empty Cart Screen ────────────────────────────────────────────────
  if (cartItems.length === 0) {
    return (
      <div className="container" style={{ padding: '2rem 0' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', marginBottom: '2rem' }}>Secure Checkout</h1>
        <div style={{ padding: '3rem', border: '1px solid var(--line)', background: 'var(--surface)', borderRadius: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--ink-soft)', marginBottom: '1.5rem' }}>Your cart is empty.</p>
          <Link to="/catalog" className="btn-primary">Browse Catalog</Link>
        </div>
      </div>
    );
  }

  const activeAddress = savedAddresses[selectedAddressIndex];

  // ─── Render Main Checkout ────────────────────────────────────────────────────
  return (
    <div style={{ padding: '2rem 0' }}>
      <div className="container">
        {checkoutStep === 1 ? (
          <Link to="/account" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
            <ArrowLeft size={18} /> Back to account
          </Link>
        ) : (
          <button onClick={() => setCheckoutStep(1)} className="back-link" style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', cursor: 'pointer' }}>
            <ArrowLeft size={18} /> Back to shipping address
          </button>
        )}

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', marginBottom: '2rem' }}>Secure Checkout</h1>

        {/* ── Checkout Steps Indicator ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--line)', paddingBottom: '1rem' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: checkoutStep >= 1 ? '600' : '400', color: checkoutStep >= 1 ? 'var(--ink)' : 'var(--ink-soft)' }}>
             <div style={{ width: 28, height: 28, borderRadius: '50%', background: checkoutStep >= 1 ? 'var(--accent)' : 'var(--line)', color: checkoutStep >= 1 ? 'var(--bg)' : 'var(--ink)', display: 'grid', placeItems: 'center', fontSize: '0.85rem' }}>1</div>
             Shipping
           </div>
           <div style={{ height: 1, flex: 1, maxWidth: 60, background: 'var(--line)' }}></div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: checkoutStep === 2 ? '600' : '400', color: checkoutStep === 2 ? 'var(--ink)' : 'var(--ink-soft)' }}>
             <div style={{ width: 28, height: 28, borderRadius: '50%', background: checkoutStep === 2 ? 'var(--accent)' : 'var(--line)', color: checkoutStep === 2 ? 'var(--bg)' : 'var(--ink)', display: 'grid', placeItems: 'center', fontSize: '0.85rem' }}>2</div>
             Review & Pay
           </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem', alignItems: 'start' }}>
          
          {/* ── Left column: Dynamic Content based on Step ────────────────────── */}
          <div style={{ display: 'grid', gap: '2rem' }}>

            {checkoutStep === 1 && (
              <div style={{ border: '1px solid var(--line)', background: 'var(--surface)', padding: '2rem', borderRadius: '2rem', boxShadow: 'var(--shadow)', display: 'grid', gap: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={20} color="var(--accent)" /> Shipping Address
                </h2>

                {/* Saved Address List ── */}
                {savedAddresses.length > 0 && !showNewForm && (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <p style={{ margin: 0, color: 'var(--ink-soft)' }}>Select a shipping address:</p>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      {savedAddresses.map((addr, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedAddressIndex(idx)}
                          style={{
                            border: selectedAddressIndex === idx ? '2px solid var(--accent)' : '1px solid var(--line)',
                            borderRadius: '1.25rem',
                            padding: '1.25rem',
                            cursor: 'pointer',
                            background: selectedAddressIndex === idx ? 'var(--surface-strong)' : 'transparent',
                            position: 'relative',
                            display: 'grid',
                            gap: '0.4rem',
                            transition: 'border-color 0.2s ease',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '600', color: selectedAddressIndex === idx ? 'var(--accent)' : 'var(--ink)' }}>
                              {addr.fullName}
                            </span>
                            {selectedAddressIndex === idx && <CheckCircle size={18} color="var(--accent)" />}
                          </div>
                          <span style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                            {addr.address}, {addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.postalCode}, {addr.country}
                            {addr.phoneNumber && <div style={{ marginTop: '0.2rem' }}>📞 {addr.phoneNumber}</div>}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowNewForm(true)}
                      style={{
                        justifySelf: 'start',
                        background: 'none',
                        border: '1px dashed var(--accent)',
                        borderRadius: '1rem',
                        padding: '0.6rem 1.25rem',
                        cursor: 'pointer',
                        color: 'var(--accent)',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: '600',
                        marginTop: '0.5rem',
                      }}
                    >
                      <Plus size={16} /> Add a new address
                    </button>
                  </div>
                )}

                {/* New Address Form (Uses <div> and manual onClick validation) ── */}
                {showNewForm && (
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {savedAddresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowNewForm(false)}
                        style={{ justifySelf: 'start', background: 'none', border: '1px solid var(--line)', borderRadius: '0.75rem', padding: '0.3rem 0.85rem', cursor: 'pointer', color: 'var(--ink-soft)', fontSize: '0.85rem' }}
                      >
                        ← Back to saved addresses
                      </button>
                    )}

                    <h3 style={{ margin: '0.5rem 0 0', fontSize: '1.1rem' }}>Enter New Address Information</h3>

                    {[
                      { label: 'Full Name *', name: 'fullName', placeholder: 'John Doe' },
                      { label: 'Street Address *', name: 'address', placeholder: '123 Main St' },
                      { label: 'City *', name: 'city', placeholder: 'New York' },
                      { label: 'State / Province', name: 'state', placeholder: 'NY' },
                      { label: 'Postal Code *', name: 'postalCode', placeholder: '10001' },
                      { label: 'Country *', name: 'country', placeholder: 'United States' },
                      { label: 'Phone Number', name: 'phoneNumber', placeholder: '+1 555 000 0000' },
                    ].map(({ label, name, placeholder }) => (
                      <label key={name} style={{ display: 'grid', gap: '0.45rem', color: 'var(--ink-soft)', fontSize: '0.9rem' }}>
                        {label}
                        <input
                          type="text"
                          name={name}
                          value={formData[name]}
                          onChange={handleChange}
                          placeholder={placeholder}
                          style={{ padding: '0.9rem 1rem', border: '1px solid var(--line)', borderRadius: '1rem', background: 'var(--surface-strong)', color: 'var(--ink)', font: 'inherit' }}
                        />
                      </label>
                    ))}

                    <button
                      type="button"
                      onClick={handleSaveAddress}
                      disabled={saveLoading}
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.9rem 1.5rem',
                        borderRadius: '1rem',
                        border: 'none',
                        background: 'var(--ink)',
                        color: 'var(--bg)',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      {saveLoading ? 'Saving...' : 'Save & Select Address'}
                    </button>
                  </div>
                )}

                {error && <p style={{ color: '#ef4444', margin: 0, padding: '0.5rem', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fca5a5' }}>{error}</p>}

                {/* Continue to Step 2 ── */}
                {!showNewForm && (
                  <button
                    type="button"
                    onClick={handleContinueToReview}
                    disabled={selectedAddressIndex === null}
                    style={{ width: '100%', marginTop: '1rem' }}
                    className="btn-primary"
                  >
                    Continue to Review
                  </button>
                )}
              </div>
            )}

            {checkoutStep === 2 && (
              <div style={{ display: 'grid', gap: '2rem' }}>
                
                {/* ── Review Address Block ── */}
                <div style={{ border: '1px solid var(--line)', background: 'var(--surface)', padding: '2rem', borderRadius: '2rem', boxShadow: 'var(--shadow)', display: 'grid', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.3rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={18} color="var(--accent)" /> Shipping To
                    </h2>
                    <button
                      onClick={() => setCheckoutStep(1)}
                      style={{ background: 'none', border: 'none', padding: 0, color: 'var(--accent)', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}
                    >
                      <Edit3 size={14} /> Change Address
                    </button>
                  </div>

                  {activeAddress && (
                    <div style={{ color: 'var(--ink-soft)', lineHeight: 1.6, padding: '1rem', background: 'var(--surface-strong)', borderRadius: '1rem' }}>
                      <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: '0.2rem' }}>{activeAddress.fullName}</strong>
                      {activeAddress.address}, {activeAddress.city}{activeAddress.state ? `, ${activeAddress.state}` : ''} {activeAddress.postalCode}, {activeAddress.country}
                      {activeAddress.phoneNumber && <div style={{ marginTop: '0.2rem' }}>📞 {activeAddress.phoneNumber}</div>}
                    </div>
                  )}
                </div>

                {/* ── Items Review Block ── */}
                <div style={{ border: '1px solid var(--line)', background: 'var(--surface)', padding: '2rem', borderRadius: '2rem', boxShadow: 'var(--shadow)' }}>
                  <h2 style={{ fontSize: '1.3rem', margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Package size={18} color="var(--accent)" /> Order Items
                  </h2>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {cartItems.map((item) => (
                      <div key={`${item.productId}-${item.size}`} style={{ display: 'flex', gap: '1rem', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--line)' }}>
                        <img src={item.image} alt={item.name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '12px', flexShrink: 0 }} />
                        <div style={{ flex: 1, display: 'grid', gap: '4px' }}>
                          <strong style={{ fontSize: '1.05rem' }}>{item.name}</strong>
                          <span style={{ fontSize: '0.9rem', color: 'var(--ink-soft)' }}>Size: {item.size} | Qty: {item.quantity}</span>
                        </div>
                        <div style={{ textAlign: 'right', display: 'grid', gap: '4px' }}>
                          <strong style={{ fontSize: '1.1rem' }}>${((Number(item.price) || 0) * (Number(item.quantity) || 1)).toFixed(2)}</strong>
                          {item.quantity > 1 && <span style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>${(Number(item.price) || 0).toFixed(2)} each</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
            
          </div>

          {/* ── Right column: Sticky Order Summary & Final Actions ──────────── */}
          <div style={{ position: 'sticky', top: '2rem', border: '1px solid var(--line)', background: 'var(--surface)', padding: '2rem', borderRadius: '2rem', boxShadow: 'var(--shadow)', display: 'grid', gap: '1.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', margin: 0, borderBottom: '1px solid var(--line)', paddingBottom: '1rem' }}>Order Summary</h2>

            <div style={{ display: 'grid', gap: '0.8rem', fontSize: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ink-soft)' }}>Subtotal ({(cartItems || []).reduce((acc, item) => acc + (Number(item.quantity) || 1), 0)} items)</span>
                <span>${(Number(totalPrice) || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ink-soft)' }}>Shipping</span>
                <span style={{ color: 'var(--accent)', fontWeight: '500' }}>Free</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ink-soft)' }}>Taxes</span>
                <span>$0.00</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--line)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', fontWeight: 'bold' }}>
              <span>Grand Total</span>
              <span style={{ color: 'var(--accent)' }}>${(Number(totalPrice) || 0).toFixed(2)}</span>
            </div>

            {/* Payment Method Selector — shown only on Step 2 */}
            {checkoutStep === 2 && (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--ink-soft)' }}>Payment Method</p>
                {[
                  { id: 'card', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, Rupay', icon: <CreditCard size={18} /> },
                  { id: 'upi', label: 'UPI / Digital Wallet', sub: 'GPay, PhonePe, Paytm', icon: <Smartphone size={18} /> },
                  { id: 'cod', label: 'Cash on Delivery', sub: 'Pay when you receive', icon: <Truck size={18} /> },
                ].map(({ id, label, sub, icon }) => {
                  const value = id === 'card' ? 'Credit / Debit Card' : id === 'upi' ? 'UPI / Digital Wallet' : 'Cash on Delivery';
                  const selected = paymentMethod === value;
                  return (
                    <div
                      key={id}
                      onClick={() => setPaymentMethod(value)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        border: selected ? '2px solid var(--accent)' : '1px solid var(--line)',
                        borderRadius: '1rem', padding: '0.85rem 1rem',
                        cursor: 'pointer',
                        background: selected ? 'var(--surface-strong)' : 'transparent',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ color: selected ? 'var(--accent)' : 'var(--ink-soft)', flexShrink: 0 }}>{icon}</div>
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: '0.9rem', color: selected ? 'var(--ink)' : 'var(--ink-soft)', display: 'block' }}>{label}</strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>{sub}</span>
                      </div>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', border: selected ? '2px solid var(--accent)' : '2px solid var(--line)', background: selected ? 'var(--accent)' : 'transparent', flexShrink: 0, transition: 'all 0.15s ease' }} />
                    </div>
                  );
                })}
              </div>
            )}

            {error && checkoutStep === 2 && <p style={{ color: '#ef4444', margin: 0, padding: '0.5rem', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fca5a5', fontSize: '0.9rem' }}>{error}</p>}

            {checkoutStep === 2 && !clientSecret && (
              <button
                type="button"
                onClick={paymentMethod === 'Cash on Delivery' ? handlePlaceOrder : handleInitiateStripePayment}
                disabled={orderLoading}
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '1rem', fontSize: '1.1rem' }}
              >
                <CreditCard size={20} />
                {orderLoading
                  ? (paymentMethod === 'Cash on Delivery' ? 'Placing Order…' : 'Initiating Payment…')
                  : (paymentMethod === 'Cash on Delivery' ? 'Confirm & Place Order' : `Pay ₹${totalPrice.toFixed(2)} via ${paymentMethod === 'UPI / Digital Wallet' ? 'UPI' : 'Card'}`)
                }
              </button>
            )}

            {/* Stripe payment form — shown after PaymentIntent is created */}
            {checkoutStep === 2 && clientSecret && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: { theme: 'night', variables: { borderRadius: '12px' } },
                }}
              >
                <StripePaymentForm
                  clientSecret={clientSecret}
                  paymentMethod={paymentMethod}
                  userInfo={{ name: user?.name, email: user?.email, total: totalPrice }}
                  returnUrl={`${window.location.origin}/checkout`}
                  onSuccess={handleStripeSuccess}
                  onError={handleStripeError}
                />
              </Elements>
            )}

            {checkoutStep === 1 && (
              <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: '0.85rem', textAlign: 'center' }}>
                Please confirm your shipping address to proceed to payment.
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
