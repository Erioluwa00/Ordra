import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuthActions } from "@convex-dev/auth/react";
import AuthLayout from '../../layouts/AuthLayout';

export default function LogIn() {
  const navigate = useNavigate();
  const { signIn } = useAuthActions();

  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email.includes('@')) e.email = 'Enter a valid email address';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    setErrors(er => ({ ...er, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setLoading(true);
    
    try {
      await signIn("password", { 
        email: form.email, 
        password: form.password,
        flow: "signIn" 
      });
    } catch (err) {
      console.error(err);
      setErrors({ general: 'Invalid email or password. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      await signIn("google", { redirectTo: "/app" });
    } catch (err) {
      console.error(err);
      setErrors({ general: 'Google sign-in failed. Please try again.' });
      setLoading(false);
    }
  };

  return (
    <AuthLayout activeTab={1}>
      <div className="auth-tabs">
        <Link to="/auth/signup" className="auth-tab">Sign Up</Link>
        <Link to="/auth/login" className="auth-tab active">Log In</Link>
      </div>

      <h1 className="auth-title">Welcome Back</h1>
      <p className="auth-subtitle">Log in to your Ordra account</p>

      {errors.general && (
        <p className="auth-error-text" style={{ marginBottom: '1rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>
          {errors.general}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="email">Email Address</label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon"><Mail size={16} /></span>
            <input
              id="email" name="email" type="email"
              className={`auth-input${errors.email ? ' error' : ''}`}
              placeholder="you@example.com"
              value={form.email} onChange={handleChange}
            />
          </div>
          {errors.email && <p className="auth-error-text">{errors.email}</p>}
        </div>

        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon"><Lock size={16} /></span>
            <input
              id="password" name="password" type={showPw ? 'text' : 'password'}
              className={`auth-input${errors.password ? ' error' : ''}`}
              placeholder="Enter your password"
              value={form.password} onChange={handleChange}
            />
            <button type="button" className="auth-input-toggle" onClick={() => setShowPw(v => !v)}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="auth-error-text">{errors.password}</p>}
        </div>

        <div className="auth-meta-row">
          <label className="auth-checkbox-label">
            <input
              type="checkbox" name="remember"
              checked={form.remember} onChange={handleChange}
            />
            Remember me
          </label>
          <Link to="/auth/forgot-password" className="auth-forgot-link">Forgot password?</Link>
        </div>

        <button type="submit" className="auth-btn primary" disabled={loading}>
          {loading ? <span className="spinner" /> : 'Log In'}
        </button>
      </form>

      <div className="auth-divider">Or continue with</div>

      <div className="auth-social-row">
        <button className="auth-social-btn" onClick={handleGoogleLogin} type="button" disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.2 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.3 2.7l5.7-5.7C33.7 7.3 29.1 5 24 5 13 5 4 14 4 25s9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.7-.4-4.9z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c2.8 0 5.3 1 7.3 2.7l5.7-5.7C33.7 7.3 29.1 5 24 5c-7.7 0-14.4 4.4-17.7 9.7z" />
            <path fill="#4CAF50" d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.4 36.5 26.8 37.5 24 37.5c-5.2 0-9.6-3.4-11.2-8H6.5C9.8 39.8 16.3 45 24 45z" />
            <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.2 5.2C40.8 35.4 44 30.6 44 25c0-1.3-.1-2.7-.4-4.9z" />
          </svg>
          Google
        </button>
        <button
          className="auth-social-btn"
          type="button"
          onClick={() => alert('Apple Sign In requires an Apple Developer account. Coming soon!')}
          disabled={loading}
        >
          <svg width="18" height="18" viewBox="0 0 814 1000">
            <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-38.8-155.5-127.4C46 790.7 0 663 0 541.8 0 347 117.8 247.3 233.4 247.3c63.1 0 118.7 41.5 159.2 41.5 38.8 0 99.6-43.9 168.2-43.9 26.5 0 108.2 2.9 154.4 87zM504.3 84.1c14.3-25 25-60.3 25-95.6 0-4.9-.3-9.9-1-14.8-25.1 1-55.2 14.3-73.9 41.5-16.4 23.6-30 59.2-30 94.5 0 5.2.6 10.3 1.2 12.1 2.2.3 5.8.9 9.4.9 22.4 0 51.5-12.6 69.3-38.6z" />
          </svg>
          Apple
        </button>
      </div>

      <p className="auth-switch" style={{ opacity: loading ? 0.5 : 1 }}>
        Don't have an account? <Link to="/auth/signup">Sign Up</Link>
      </p>
    </AuthLayout>
  );
}
