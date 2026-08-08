import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — wraps any route that requires authentication.
 *
 * Redirects unauthenticated visitors to /auth, preserving the attempted
 * pathname in location.state.from so AuthPage can redirect back after login.
 *
 * Usage in App.jsx:
 *   <Route
 *     path="/account"
 *     element={
 *       <ProtectedRoute>
 *         <AccountPage />
 *       </ProtectedRoute>
 *     }
 *   />
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
}
