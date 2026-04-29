import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuthActions } from "@convex-dev/auth/react";
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
  const location = useLocation();
  const { signIn } = useAuthActions();
  
  // If user tries to access this page directly without submitting email, send them back
  const email = location.state?.email;
  useEffect(() => {
    if (!email) navigate('/auth/forgot-password');
  }, [email, navigate]);

  const [otp, setOtp] = useState(['', '', '', '', '', '']); // Convex generates 6 character OTPs
  const otpRefs = useRef([]);
  
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [timeLeft, setTimeLeft] = useState(60);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft]);

  const handleResend = async () => {
    if (timeLeft > 0 || resending) return;
    setResending(true);
    setErrors(er => ({ ...er, general: '' }));
    try {
      await signIn("password", { email, flow: "reset" });
      setTimeLeft(60);
    } catch (err) {
      console.error(err);
      setErrors({ general: 'Failed to resend code. Please try again.' });
    } finally {
      setResending(false);
    }
  };

  const strength = getPasswordStrength(form.password);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const pasted = value.slice(0, 6).split('');
      const newOtp = [...otp];
      for (let i = 0; i < pasted.length; i++) {
        if (index + i < 6) newOtp[index + i] = pasted[i];
      }
      setOtp(newOtp);
      const nextFocus = Math.min(index + pasted.length, 5);
      otpRefs.current[nextFocus]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setErrors(er => ({ ...er, otp: '', general: '' }));

    // Auto focus next
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const validate = () => {
    const e = {};
    if (otp.join('').length < 6) e.otp = 'Please enter the 6-character verification code';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    return e;
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(er => ({ ...er, [e.target.name]: '', general: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    
    setLoading(true);
    
    try {
      await signIn("password", { 
        email, 
        code: otp.join(''), 
        newPassword: form.password, 
        flow: "reset-verification" 
      });
      
      setSuccess(true);
      setTimeout(() => navigate('/auth/login'), 3000);
    } catch (err) {
      console.error(err);
      setErrors({ general: 'Invalid verification code. Please check your email and try again.' });
    } finally {
      setLoading(false);
    }
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
      <Link to="/auth/forgot-password" className="auth-back-link">
        <ArrowLeft size={16} /> Back
      </Link>

      <h1 className="auth-title">Verify & Reset</h1>
      <p className="auth-subtitle">
        We sent a 6-character code to <strong>{email}</strong>. Enter it below to set a new password.
      </p>

      {errors.general && (
        <p className="auth-error-text" style={{ marginBottom: '1rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>
          {errors.general}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="auth-field">
          <label>Verification Code</label>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', marginBottom: '8px' }}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => otpRefs.current[i] = el}
                type="text"
                maxLength={6}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                style={{
                  width: '52px',
                  height: '60px',
                  textAlign: 'center',
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  borderRadius: '10px',
                  border: '2px solid var(--border-main)',
                  background: 'transparent',
                  color: '#111827'
                }}
              />
            ))}
          </div>
          {errors.otp && <p className="auth-error-text">{errors.otp}</p>}
          
          <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', textAlign: 'center', color: '#6b7280' }}>
            {timeLeft > 0 ? (
              <span>Didn't receive the code? Resend in 0:{timeLeft.toString().padStart(2, '0')}</span>
            ) : (
              <span>
                Didn't receive the code?{' '}
                <button 
                  type="button" 
                  onClick={handleResend}
                  disabled={resending}
                  style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: '600', cursor: 'pointer', padding: 0 }}
                >
                  {resending ? 'Resending...' : 'Resend Code'}
                </button>
              </span>
            )}
          </div>
        </div>

        <div className="auth-field" style={{ marginTop: '1.5rem' }}>
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
          {loading ? <span className="spinner" /> : 'Verify & Reset Password'}
        </button>
      </form>
    </AuthLayout>
  );
}
