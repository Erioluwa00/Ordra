import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProductProvider } from './context/ProductContext';
import LandingPage from './pages/LandingPage';
import ScrollToTop from './components/ScrollToTop';
import ReloadPrompt from './components/ReloadPrompt';
import SignUp from './pages/auth/SignUp';
import LogIn from './pages/auth/LogIn';
import ForgotPassword from './pages/auth/ForgotPassword';
import CheckEmail from './pages/auth/CheckEmail';
import ResetPassword from './pages/auth/ResetPassword';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/app/Dashboard';
import Customers from './pages/app/Customers';
import Orders from './pages/app/Orders';
import Products from './pages/app/Products';
import AnalyticsPage from './pages/app/Analytics';
import Settings from './pages/app/Settings';
import Debts from './pages/app/Debts';



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
      <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="/app/analytics" element={<AnalyticsPage />} />
        <Route path="customers" element={<Customers />} />
        <Route path="orders" element={<Orders />} />
        <Route path="products" element={<Products />} />
        <Route path="debts" element={<Debts />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import { OfflineProvider } from './context/OfflineContext';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <ProductProvider>
          <AuthProvider>
            <OfflineProvider>
              <ScrollToTop />
              <ReloadPrompt />
              <AppRoutes />
            </OfflineProvider>
          </AuthProvider>
        </ProductProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
