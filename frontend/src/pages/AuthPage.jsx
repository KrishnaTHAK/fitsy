import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login, register, loading } = useAuth();
  const [mode, setMode] = useState('login');
  const [feedback, setFeedback] = useState('');
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    password: '',
  });

  if (isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname || '/account'} replace />;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormState((currentValue) => ({
      ...currentValue,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      name: formState.name || formState.email.split('@')[0],
      email: formState.email,
      password: formState.password,
    };

    const result = await (mode === 'login' ? login(payload) : register(payload));

    if (!result.success) {
      setFeedback(result.message);
      return;
    }

    setFeedback('');
    navigate('/account');
  }

  return (
    <div className="auth-page">
      <div className="container auth-page__layout">
        <section className="auth-page__brand">
          <BrandLogo />
          <span className="eyebrow">Account Access</span>
          <h1>Save favorites, track your bag, and continue your try-on journey.</h1>
          <p>
            This auth layer is implemented as a frontend account flow so your UI and route
            structure are ready for a backend later.
          </p>
          <Link to="/catalog" className="inline-link">
            Continue browsing
          </Link>
        </section>

        <section className="auth-card">
          <div className="auth-card__switch">
            <button
              type="button"
              className={mode === 'login' ? 'is-active' : ''}
              onClick={() => setMode('login')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'is-active' : ''}
              onClick={() => setMode('register')}
            >
              Create Account
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <label>
                Full Name
                <input
                  type="text"
                  name="name"
                  value={formState.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required={mode === 'register'}
                />
              </label>
            )}

            <label>
              Email
              <input
                type="email"
                name="email"
                value={formState.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                name="password"
                value={formState.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
            </label>

            <button type="submit" className="btn-primary auth-form__submit" disabled={loading}>
              {loading ? 'Please wait…' : (mode === 'login' ? 'Sign In to Fitsy' : 'Create Fitsy Account')}
            </button>
            {feedback && <p className="auth-form__feedback">{feedback}</p>}
          </form>
        </section>
      </div>
    </div>
  );
}
