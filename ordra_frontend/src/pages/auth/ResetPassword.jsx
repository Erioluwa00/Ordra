import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout';

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

export default function ResetPassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = getPasswordStrength(form.password);

  const validate = () => {
    const e = {};
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
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    setSuccess(true);
    setTimeout(() => navigate('/auth/login'), 3000);
  };

  if (success) {
    return (
      <AuthLayout activeTab={2}>
        <div className="auth-success-state">
          <div className="auth-success-icon">
            <CheckCircle2 size={36} />
          </div>
          <h2>Password Reset!</h2>
          <p>
            Your password has been changed successfully.<br />
            Redirecting you to Log In…
          </p>
          <Link to="/auth/login" className="auth-btn primary" style={{ textAlign: 'center', textDecoration: 'none' }}>
            Go to Log In
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout activeTab={2}>
      <Link to="/auth/check-email" className="auth-back-link">
        <ArrowLeft size={16} /> Back
      </Link>

      <h1 className="auth-title">Set New Password</h1>
      <p className="auth-subtitle">
        Choose a strong password you haven't used before.
      </p>

      <form onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label htmlFor="password">New Password</label>
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

        <div className="auth-field">
          <label htmlFor="confirm">Confirm Password</label>
          <div className="auth-input-wrapper">
            <span className="auth-input-icon"><Lock size={16} /></span>
            <input
              id="confirm" name="confirm" type={showConfirm ? 'text' : 'password'}
              className={`auth-input${errors.confirm ? ' error' : ''}`}
              placeholder="Re-enter new password"
              value={form.confirm} onChange={handleChange}
            />
            <button type="button" className="auth-input-toggle" onClick={() => setShowConfirm(v => !v)}>
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirm && <p className="auth-error-text">{errors.confirm}</p>}
        </div>

        <button type="submit" className="auth-btn primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
          {loading ? <span className="spinner" /> : 'Reset Password'}
        </button>
      </form>
    </AuthLayout>
  );
}
