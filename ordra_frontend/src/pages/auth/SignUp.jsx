import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import AuthLayout from '../../layouts/AuthLayout';
import { useAuth } from '../../context/AuthContext';

function getPasswordStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthClass = ['', 'filled-weak', 'filled-fair', 'filled-good', 'filled-strong'];

export default function SignUp() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(form.password);

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required';
    if (!form.lastName.trim()) e.lastName = 'Last name is required';
    if (!form.email.includes('@')) e.email = 'Enter a valid email address';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    return e;
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(er => ({ ...er, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    login({ name: `${form.firstName} ${form.lastName}`, email: form.email, provider: 'email' });
    navigate('/app');
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const data = await res.json();
        login({ ...data, provider: 'google' });
        navigate('/app');
      } catch {
        setErrors({ general: 'Google sign-in failed. Please try again.' });
      }
    },
    onError: () => setErrors({ general: 'Google sign-in failed. Please try again.' }),
  });

  return (
    <AuthLayout activeTab={0}>
      {/* Tabs */}
      <div className="auth-tabs">
        <Link to="/auth/signup" className="auth-tab active">Sign Up</Link>
        <Link to="/auth/login" className="auth-tab">Log In</Link>
      </div>

      <h1 className="auth-title">Create Your Account</h1>
      <p className="auth-subtitle">Join thousands of sellers on Ordra</p>

      {errors.general && (
        <p className="auth-error-text" style={{ marginBottom: '1rem' }}>{errors.general}</p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Name row */}
        <div className="auth-name-row">
          <div className="auth-field">
            <label htmlFor="firstName">First Name</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon"><User size={16} /></span>
              <input
                id="firstName" name="firstName" type="text"
                className={`auth-input${errors.firstName ? ' error' : ''}`}
                placeholder="John"
                value={form.firstName} onChange={handleChange}
              />
            </div>
            {errors.firstName && <p className="auth-error-text">{errors.firstName}</p>}
          </div>
          <div className="auth-field">
            <label htmlFor="lastName">Last Name</label>
            <div className="auth-input-wrapper">
              <span className="auth-input-icon"><User size={16} /></span>
              <input
                id="lastName" name="lastName" type="text"
                className={`auth-input${errors.lastName ? ' error' : ''}`}
                placeholder="Doe"
                value={form.lastName} onChange={handleChange}
              />
            </div>
            {errors.lastName && <p className="auth-error-text">{errors.lastName}</p>}
          </div>
        </div>

        {/* Email */}
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

        {/* Password */}
        <div className="auth-field">
          <label htmlFor="password">Password</label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon"><Lock size={16} /></span>
            <input
              id="password" name="password" type={showPw ? 'text' : 'password'}
              className={`auth-input${errors.password ? ' error' : ''}`}
              placeholder="Min. 8 characters"
              value={form.password} onChange={handleChange}
            />
            <button type="button" className="auth-input-toggle" onClick={() => setShowPw(v => !v)}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {form.password && (
            <>
              <div className="pw-strength-bar">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className={`pw-strength-seg${strength >= n ? ' ' + strengthClass[strength] : ''}`} />
                ))}
              </div>
              <p className="pw-strength-label">{strengthLabel[strength]}</p>
            </>
          )}
          {errors.password && <p className="auth-error-text">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div className="auth-field">
          <label htmlFor="confirm">Confirm Password</label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon"><Lock size={16} /></span>
            <input
              id="confirm" name="confirm" type={showConfirm ? 'text' : 'password'}
              className={`auth-input${errors.confirm ? ' error' : ''}`}
              placeholder="Re-enter password"
              value={form.confirm} onChange={handleChange}
            />
            <button type="button" className="auth-input-toggle" onClick={() => setShowConfirm(v => !v)}>
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirm && <p className="auth-error-text">{errors.confirm}</p>}
        </div>

        <button type="submit" className="auth-btn primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
          {loading ? <span className="spinner" /> : 'Create Account'}
        </button>
      </form>

      <div className="auth-divider">Or continue with</div>

      <div className="auth-social-row">
        <button className="auth-social-btn" onClick={() => googleLogin()} type="button">
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
        >
          <svg width="18" height="18" viewBox="0 0 814 1000">
            <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-38.8-155.5-127.4C46 790.7 0 663 0 541.8 0 347 117.8 247.3 233.4 247.3c63.1 0 118.7 41.5 159.2 41.5 38.8 0 99.6-43.9 168.2-43.9 26.5 0 108.2 2.9 154.4 87zM504.3 84.1c14.3-25 25-60.3 25-95.6 0-4.9-.3-9.9-1-14.8-25.1 1-55.2 14.3-73.9 41.5-16.4 23.6-30 59.2-30 94.5 0 5.2.6 10.3 1.2 12.1 2.2.3 5.8.9 9.4.9 22.4 0 51.5-12.6 69.3-38.6z" />
          </svg>
          Apple
        </button>
      </div>

      <p className="auth-switch">
        Already have an account? <Link to="/auth/login">Log In</Link>
      </p>
    </AuthLayout>
  );
}
