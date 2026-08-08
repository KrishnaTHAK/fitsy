import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Lock, Smartphone, CreditCard, AlertCircle } from 'lucide-react';

const CARD_STYLE = {
  style: {
    base: {
      color: '#f4f4f4',
      fontFamily: '"Inter", "Helvetica Neue", sans-serif',
      fontSize: '16px',
      fontSmoothing: 'antialiased',
      '::placeholder': { color: '#888888' },
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
};

/**
 * StripePaymentForm
 * Handles both Card and UPI payment confirmation using Stripe.js hooks.
 * Must be rendered inside an <Elements> provider with a valid clientSecret.
 *
 * Props:
 *  - clientSecret  : Stripe PaymentIntent client_secret
 *  - paymentMethod : 'Credit / Debit Card' | 'UPI / Digital Wallet'
 *  - userInfo      : { name, email } for billing_details
 *  - returnUrl     : URL Stripe redirects to after UPI app approval
 *  - onSuccess     : callback(paymentIntent) when payment succeeds
 *  - onError       : callback(message) on failure
 */
export default function StripePaymentForm({
  clientSecret,
  paymentMethod,
  userInfo,
  returnUrl,
  onSuccess,
  onError,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [upiId, setUpiId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [upiPending, setUpiPending] = useState(false);

  const isUpi = paymentMethod === 'UPI / Digital Wallet';

  // ─── Card Payment ─────────────────────────────────────────────────────────
  const handleCardPayment = async () => {
    if (!stripe || !elements) return;
    setProcessing(true);
    setLocalError(null);

    const cardElement = elements.getElement(CardElement);

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: userInfo?.name || '',
          email: userInfo?.email || '',
        },
      },
    });

    setProcessing(false);

    if (error) {
      setLocalError(error.message);
      onError(error.message);
    } else if (paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent);
    }
  };

  // ─── UPI Payment ──────────────────────────────────────────────────────────
  const handleUpiPayment = async () => {
    if (!stripe) return;
    if (!upiId.trim() || !upiId.includes('@')) {
      setLocalError('Please enter a valid UPI ID (e.g. name@upi).');
      return;
    }

    setProcessing(true);
    setLocalError(null);

    const { error, paymentIntent } = await stripe.confirmUpiPayment(clientSecret, {
      payment_method: {
        upi: { vpa: upiId.trim() },
        billing_details: {
          name: userInfo?.name || '',
          email: userInfo?.email || '',
        },
      },
      return_url: returnUrl,
    });

    setProcessing(false);

    if (error) {
      setLocalError(error.message);
      onError(error.message);
    } else if (paymentIntent?.status === 'succeeded') {
      onSuccess(paymentIntent);
    } else if (paymentIntent?.status === 'requires_action') {
      // User needs to approve in their UPI app; page will redirect via return_url
      setUpiPending(true);
    }
  };

  // ─── UPI Pending Screen ───────────────────────────────────────────────────
  if (upiPending) {
    return (
      <div style={{ padding: '1.5rem', background: 'var(--surface-strong)', borderRadius: '1rem', textAlign: 'center', display: 'grid', gap: '0.75rem' }}>
        <Smartphone size={32} color="var(--accent)" style={{ margin: '0 auto' }} />
        <strong style={{ fontSize: '1.1rem' }}>Check Your UPI App</strong>
        <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: '0.9rem', lineHeight: 1.6 }}>
          A payment request has been sent to <strong>{upiId}</strong>. Please open your UPI app (GPay, PhonePe, Paytm) and approve the payment of ₹{userInfo?.total?.toFixed(2)}.
        </p>
        <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: '0.85rem' }}>
          Once approved, you'll be redirected automatically.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>

      {isUpi ? (
        // ── UPI Input ──────────────────────────────────────────────────────
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <label style={{ display: 'grid', gap: '0.4rem', color: 'var(--ink-soft)', fontSize: '0.9rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Smartphone size={14} /> Your UPI ID
            </span>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="yourname@upi"
              style={{
                padding: '0.9rem 1rem',
                border: '1px solid var(--line)',
                borderRadius: '1rem',
                background: 'var(--surface-strong)',
                color: 'var(--ink)',
                font: 'inherit',
                fontSize: '1rem',
              }}
            />
          </label>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
            🧪 <strong>Test mode:</strong> Use <code style={{ background: 'var(--line)', padding: '1px 4px', borderRadius: '3px' }}>success@razorpay</code> to simulate a successful UPI payment.
          </p>
        </div>
      ) : (
        // ── Card Element ───────────────────────────────────────────────────
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <label style={{ display: 'grid', gap: '0.4rem', color: 'var(--ink-soft)', fontSize: '0.9rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CreditCard size={14} /> Card Details
            </span>
            <div style={{
              padding: '0.9rem 1rem',
              border: '1px solid var(--line)',
              borderRadius: '1rem',
              background: 'var(--surface-strong)',
            }}>
              <CardElement options={CARD_STYLE} />
            </div>
          </label>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--ink-soft)' }}>
            🧪 <strong>Test mode:</strong> Use card <code style={{ background: 'var(--line)', padding: '1px 4px', borderRadius: '3px' }}>4242 4242 4242 4242</code>, any future expiry, any CVC.
          </p>
        </div>
      )}

      {localError && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '0.75rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '0.75rem', color: '#b91c1c', fontSize: '0.9rem' }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          {localError}
        </div>
      )}

      <button
        type="button"
        onClick={isUpi ? handleUpiPayment : handleCardPayment}
        disabled={!stripe || processing}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '1rem',
          borderRadius: '1rem',
          border: 'none',
          background: processing ? 'var(--line)' : 'var(--accent)',
          color: '#fff',
          fontWeight: '700',
          fontSize: '1rem',
          cursor: processing ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s ease',
        }}
      >
        <Lock size={16} />
        {processing ? 'Processing…' : `Pay ${isUpi ? '₹' : '₹'}${userInfo?.total?.toFixed(2) || ''} Securely`}
      </button>

      <p style={{ margin: 0, textAlign: 'center', fontSize: '0.75rem', color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
        <Lock size={11} /> Powered by Stripe · Your payment info never touches our servers
      </p>
    </div>
  );
}
