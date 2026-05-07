import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Zap, BarChart3, CreditCard, MessageCircle, CheckSquare, Package } from 'lucide-react';
import './UpgradeModal.css';

const FEATURE_CONFIG = {
  orders: {
    icon: <Package size={28} />,
    iconBg: '#fef3c7',
    iconColor: '#d97706',
    title: "You've Reached Your Monthly Limit",
    subtitle: '50 / 50 orders used this month',
    description: 'Free users can create up to 50 orders per month. Upgrade to Pro for unlimited orders.',
    highlight: 'Unlimited orders/month',
    cta: 'Upgrade to Pro — ₦5,000/mo',
    secondaryCta: 'Orders reset on the 1st',
  },
  whatsapp: {
    icon: <MessageCircle size={28} />,
    iconBg: '#dcfce7',
    iconColor: '#16a34a',
    title: 'WhatsApp Messaging is Pro',
    subtitle: 'Send instant updates to your customers',
    description: 'Generate pre-formatted order updates and payment reminders. Send directly to your customer\'s WhatsApp with one tap.',
    highlight: 'WhatsApp quick messages + reminders',
    cta: 'Upgrade to Pro — ₦5,000/mo',
    secondaryCta: null,
  },
  analytics: {
    icon: <BarChart3 size={28} />,
    iconBg: '#ede9fe',
    iconColor: '#7c3aed',
    title: 'Unlock Business Insights',
    subtitle: 'Revenue trends, best sellers & more',
    description: 'See exactly which products are making you money, who your best customers are, and track revenue growth over time.',
    highlight: 'Full analytics dashboard',
    cta: 'Upgrade to Pro — ₦5,000/mo',
    secondaryCta: null,
  },
  debts: {
    icon: <CreditCard size={28} />,
    iconBg: '#fee2e2',
    iconColor: '#dc2626',
    title: 'Track Who Owes You Money',
    subtitle: 'Never forget an outstanding payment',
    description: 'See every customer\'s outstanding balance at a glance and send WhatsApp payment reminders with a single tap.',
    highlight: 'Debt tracker + WhatsApp reminders',
    cta: 'Upgrade to Pro — ₦5,000/mo',
    secondaryCta: null,
  },
  bulk: {
    icon: <CheckSquare size={28} />,
    iconBg: '#e0e7ff',
    iconColor: '#4f46e5',
    title: 'Bulk Actions are Pro',
    subtitle: 'Manage dozens of orders at once',
    description: 'Select multiple orders and update their status or delete them all at once — instead of clicking one by one.',
    highlight: 'Bulk select, update & delete',
    cta: 'Upgrade to Pro — ₦5,000/mo',
    secondaryCta: null,
  },
};

import usePlan from '../hooks/usePlan';
import { useAuth } from '../context/AuthContext';
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function UpgradeModal({ feature = 'orders', onClose }) {
  const config = FEATURE_CONFIG[feature] || FEATURE_CONFIG.orders;
  const plan = usePlan();
  const { user } = useAuth();
  const activateTrial = useMutation(api.settings.activateTrial);

  // Load Paystack script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handlePaystack = () => {
    if (typeof window.PaystackPop === 'undefined') {
      alert("Paystack is still loading. Please try again in a second.");
      return;
    }

    const handler = window.PaystackPop.setup({
      key: 'pk_test_0550e62b160543b3f08e0374ae5954ba0d08ba65', // FIXME: Replace with your actual public key
      email: user?.email || '',
      amount: 500000, // ₦5,000 in kobo
      currency: 'NGN',
      ref: `ORD-${Date.now()}`,
      metadata: {
        userId: plan.userId,
        plan: 'pro'
      },
      callback: (response) => {
        // This is called when payment is successful
        // We'll wait for the webhook to update the backend
        onClose();
        alert("Payment successful! Your Pro plan will be activated within a minute.");
      },
      onClose: () => {
        console.log("Payment window closed");
      }
    });

    handler.openIframe();
  };

  const handleTrial = async () => {
    try {
      await activateTrial();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to start trial. Please try again.");
    }
  };

  return (
    <div className="upgrade-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="upgrade-modal" role="dialog" aria-modal="true">

        {/* Close button */}
        <button className="upgrade-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        {/* Icon */}
        <div className="upgrade-icon-wrap" style={{ background: config.iconBg, color: config.iconColor }}>
          {config.icon}
        </div>

        {/* Content */}
        <div className="upgrade-zap-badge">
          <Zap size={12} fill="currentColor" /> Pro Feature
        </div>
        <h2 className="upgrade-title">{config.title}</h2>
        <p className="upgrade-subtitle">{config.subtitle}</p>
        <p className="upgrade-description">{config.description}</p>

        {/* Highlight chip */}
        <div className="upgrade-highlight">
          <span className="upgrade-check">✓</span>
          {config.highlight}
        </div>

        {/* What you get with Pro */}
        <div className="upgrade-perks">
          {[
            'Unlimited orders/month',
            'WhatsApp messaging & reminders',
            'Full analytics dashboard',
            'Debt tracker',
            'Bulk actions',
            'Full customer history',
          ].map((perk) => (
            <div key={perk} className="upgrade-perk">
              <span className="upgrade-perk-check">✓</span>
              {perk}
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="upgrade-cta-stack">
          <button className="upgrade-cta-btn" onClick={handlePaystack}>
            <Zap size={16} fill="currentColor" />
            {config.cta}
          </button>
          
          {plan.plan === 'free' && (
            <button className="upgrade-trial-btn" onClick={handleTrial}>
              Try Pro Free for 14 Days
            </button>
          )}
        </div>

        {config.secondaryCta && (
          <p className="upgrade-secondary">{config.secondaryCta}</p>
        )}
        <button className="upgrade-dismiss" onClick={onClose}>Maybe later</button>

      </div>
    </div>
  );
}
