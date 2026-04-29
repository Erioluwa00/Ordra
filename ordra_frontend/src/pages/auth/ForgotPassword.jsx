import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { useAuthActions } from "@convex-dev/auth/react";
import AuthLayout from '../../layouts/AuthLayout';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) { setError('Enter a valid email address'); return; }
    setError('');
    setLoading(true);
    
    try {
      await signIn("password", { email, flow: "reset" });
      navigate('/auth/reset-password', { state: { email } });
    } catch (err) {
      console.error(err);
      if (err.message && err.message.includes("InvalidAccountId")) {
        setError("No account found with this email address.");
      } else {
        setError("Failed to send reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout activeTab={2}>
      <Link to="/auth/login" className="auth-back-link">
        <ArrowLeft size={16} /> Back to Log In
      </Link>

      <h1 className="auth-title">Forgot Password?</h1>
      <p className="auth-subtitle">
        No worries, we'll send a reset link to your email.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="email">Email Address</label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon"><Mail size={16} /></span>
            <input
              id="email" name="email" type="email"
              className={`auth-input${error ? ' error' : ''}`}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
            />
          </div>
          {error && <p className="auth-error-text">{error}</p>}
        </div>

        <button type="submit" className="auth-btn primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
          {loading ? <span className="spinner" /> : 'Send Reset Link'}
        </button>
      </form>

      <p className="auth-switch" style={{ marginTop: '1.75rem' }}>
        Remembered it? <Link to="/auth/login">Log In</Link>
      </p>
    </AuthLayout>
  );
}
