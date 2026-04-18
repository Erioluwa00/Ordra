import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import SignUp from './pages/auth/SignUp';
import LogIn from './pages/auth/LogIn';
import ForgotPassword from './pages/auth/ForgotPassword';
import CheckEmail from './pages/auth/CheckEmail';
import ResetPassword from './pages/auth/ResetPassword';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Redirect already-logged-in users away from auth pages
function AuthGuard({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/app" replace /> : children;
}

// Redirect logged-out users away from protected pages
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/auth/login" replace />;
}

function AppRoutes() {
  const { user, logout } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />

      {/* Auth pages — redirect to /app if already logged in */}
      <Route path="/auth/signup" element={<AuthGuard><SignUp /></AuthGuard>} />
      <Route path="/auth/login" element={<AuthGuard><LogIn /></AuthGuard>} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/check-email" element={<CheckEmail />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />

      {/* Protected app */}
      <Route path="/app/*" element={
        <ProtectedRoute>
          <div style={{
            display: 'flex', height: '100vh', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', gap: '1rem',
            fontFamily: 'Inter, sans-serif'
          }}>
            <h2 style={{ color: '#111827' }}>
              👋 Welcome, {user?.name || 'there'}!
            </h2>
            <p style={{ color: '#6b7280' }}>Dashboard coming soon.</p>
            <button
              onClick={logout}
              style={{
                background: '#9333ea', color: 'white',
                border: 'none', borderRadius: '8px',
                padding: '0.6rem 1.25rem', fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Log Out
            </button>
          </div>
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
