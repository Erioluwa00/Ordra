import React, { useEffect } from 'react';
import { X, Zap, Check, Calendar, Bell } from 'lucide-react';
import './TrialWelcomeModal.css';

export default function TrialWelcomeModal({ days = 14, onClose }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="tw-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="tw-modal">
        <button className="tw-close" onClick={onClose}><X size={18} /></button>
        
        <div className="tw-icon-wrap">
          <Zap size={32} fill="currentColor" />
        </div>

        <h2 className="tw-title">Welcome to Ordra Pro</h2>
        <p className="tw-subtitle">We've activated your <strong>{days}-day free trial</strong>.</p>
        
        <div className="tw-features">
          <div className="tw-feature">
            <div className="tw-f-icon"><Check size={16} /></div>
            <div>
              <strong>Full Pro Access</strong>
              <span>Unlimited orders, WhatsApp reminders, and deep analytics.</span>
            </div>
          </div>
          <div className="tw-feature">
            <div className="tw-f-icon"><Bell size={16} /></div>
            <div>
              <strong>No Surprises</strong>
              <span>We'll send you a reminder 2 days before your trial ends.</span>
            </div>
          </div>
          <div className="tw-feature">
            <div className="tw-f-icon"><Calendar size={16} /></div>
            <div>
              <span>Your trial expires on <strong>{new Date(Date.now() + days * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}</strong>.</span>
            </div>
          </div>
        </div>

        <button className="tw-btn" onClick={onClose}>Explore Pro Features</button>
      </div>
    </div>
  );
}
