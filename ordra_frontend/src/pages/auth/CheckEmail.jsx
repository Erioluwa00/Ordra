import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout';

export default function CheckEmail() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const email = state?.email || 'your email';
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    setResending(true);
    await new Promise(r => setTimeout(r, 1000));
    setResending(false);
    setResent(true);
    setTimeout(() => setResent(false), 4000);
  };

  return (
    <AuthLayout activeTab={2}>
      <Link to="/auth/forgot-password" className="auth-back-link">
        <ArrowLeft size={16} /> Back
      </Link>

      <div className="auth-success-state">
        <div className="auth-success-icon">
          <Mail size={32} />
        </div>

        <h1 className="auth-title" style={{ textAlign: 'center' }}>Check Your Email</h1>
        <p style={{ color: '#6b7280', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '1.75rem', textAlign: 'center' }}>
          We sent a password reset link to{' '}
          <strong style={{ color: '#111827' }}>{email}</strong>.
          Check your inbox and click the link to reset your password.
        </p>

        <div className="auth-info-box">
          <span className="auth-info-box-icon"><Mail size={18} /></span>
          <p>
            Didn't receive it? Check your <strong>spam folder</strong> — it sometimes ends up there.
          </p>
        </div>

        <button
          className="auth-btn primary"
          onClick={handleResend}
          disabled={resending}
          style={{ marginBottom: '1rem' }}
        >
          {resending
            ? <><span className="spinner" /> Resending…</>
            : resent
            ? '✓ Email Resent!'
            : <><RefreshCw size={16} /> Resend Email</>
          }
        </button>

        <button
          type="button"
          className="auth-btn"
          style={{ background: '#f3f4f6', color: '#374151' }}
          onClick={() => navigate('/auth/reset-password')}
        >
          I have the reset link →
        </button>
      </div>

      <p className="auth-switch" style={{ marginTop: '2rem' }}>
        <Link to="/auth/login">← Back to Log In</Link>
      </p>
    </AuthLayout>
  );
}
