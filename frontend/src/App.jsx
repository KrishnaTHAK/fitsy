import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AppErrorBoundary from './components/AppErrorBoundary';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import AdminRoute from './components/AdminRoute';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ProductsProvider } from './context/ProductsContext';
import { StoreProvider } from './context/StoreContext';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductPage from './pages/ProductPage';
import AuthPage from './pages/AuthPage';
import AccountPage from './pages/AccountPage';
import WishlistPage from './pages/WishlistPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import StaticPage from './pages/StaticPage';
import AdminPage from './pages/AdminPage';
import AdminDashboard from './pages/AdminDashboard';
import { safeStorageGet, safeStorageSet } from './utils/safeStorage';
import './index.css';

function App() {
  const [theme, setTheme] = useState(() => safeStorageGet('fitsy-theme', 'dark'));

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    safeStorageSet('fitsy-theme', theme);
  }, [theme]);

  return (
    <AppErrorBoundary>
      {/*
        Provider order matters:
          AuthProvider    — user session (contexts below can call useAuth)
          ProductsProvider — catalog data (API → static fallback)
          StoreProvider   — cart + wishlist (needs user from AuthProvider)
      */}
      <AuthProvider>
        <ProductsProvider>
          <StoreProvider>
            <Router>
              <div className="app-shell flex flex-col min-h-screen">
                <Navbar
                  theme={theme}
                  onToggleTheme={() =>
                    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
                  }
                />
                <main className="page-shell flex-1">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/catalog" element={<Catalog />} />
                    <Route path="/product/:id" element={<ProductPage />} />
                    <Route
                      path="/admin"
                      element={
                        <AdminRoute>
                          <AdminPage />
                        </AdminRoute>
                      }
                    />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/wishlist" element={<WishlistPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route
                      path="/account"
                      element={
                        <ProtectedRoute>
                          <AccountPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/checkout"
                      element={
                        <ProtectedRoute>
                          <CheckoutPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/privacy"
                      element={
                        <StaticPage
                          title="Privacy Policy"
                          body="Fitsy stores account, wishlist, and cart data locally in this demo. A production version should use secure backend services, encrypted credentials, and proper consent handling."
                        />
                      }
                    />
                    <Route
                      path="/policy"
                      element={
                        <StaticPage
                          title="Platform Policy"
                          body="Fitsy is a concept storefront. Product previews, try-on rendering, and account flows are provided for demonstration purposes and should be backed by production APIs before launch."
                        />
                      }
                    />
                    <Route
                      path="/admin-dashboard"
                      element={
                        <AdminRoute>
                          <AdminDashboard />
                        </AdminRoute>
                      }
                    />
                  </Routes>
                </main>
                <Footer />
              </div>
            </Router>
          </StoreProvider>
        </ProductsProvider>
      </AuthProvider>
    </AppErrorBoundary>
  );
}

export default App;
