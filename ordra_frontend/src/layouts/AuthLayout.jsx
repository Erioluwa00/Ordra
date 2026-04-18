import React from 'react';
import { Link } from 'react-router-dom';
import '../layouts/AuthLayout.css';

export default function AuthLayout({ children, activeTab }) {
  return (
    <div className="auth-root">
      {/* ── LEFT PANEL ── */}
      <div className="auth-left">
        <div className="auth-left-logo">Ordra</div>

        {/* Decorative Art */}
        <div className="auth-left-art">
          <div className="art-circle-lg" />
          <div className="art-circle-md" />
          <div className="art-circle-sm" />
          <div className="art-rect" />
          <div className="art-dot-cluster">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="art-dot" />
            ))}
          </div>
        </div>

        <div className="auth-left-footer">
          <div className="auth-left-tagline">Your orders.<br />Sorted.</div>
          <p className="auth-left-sub">
            Stop losing sales in DMs. Ordra gives you a beautiful,
            organised space to manage every customer and every order.
          </p>
          <div className="auth-left-dots">
            <div className={`auth-dot${activeTab === 0 ? ' active' : ''}`} />
            <div className={`auth-dot${activeTab === 1 ? ' active' : ''}`} />
            <div className={`auth-dot${activeTab === 2 ? ' active' : ''}`} />
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="auth-right">
        <Link to="/" className="auth-mobile-logo">Ordra</Link>
        <div className="auth-form-wrapper">
          {children}
        </div>
      </div>
    </div>
  );
}
