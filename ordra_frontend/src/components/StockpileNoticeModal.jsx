import React, { useState } from 'react';
import {
  X, Bell, ChevronRight, Copy, MessageCircle,
  CheckCheck, AlertTriangle, ArrowLeft, ArrowRight
} from 'lucide-react';
import './StockpileNoticeModal.css';

// ── Helpers ──────────────────────────────────────────────────────
function daysSince(isoString) {
  const ms = Date.now() - new Date(isoString).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function buildMessage(template = '', order) {
  const days = daysSince(order.createdAt);
  return template
    .replace(/{{name}}/g, order.customer)
    .replace(/{{id}}/g, order.orderId)
    .replace(/{{item}}/g, order.item)
    .replace(/{{days}}/g, days);
}

// ── Component ──────────────────────────────────────────────────────
export default function StockpileNoticeModal({ orders = [], template = '', onClose, onNotified }) {
  const [step, setStep] = useState(0); // which order we're on
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [sentIndexes, setSentIndexes] = useState(new Set());

  const current = orders[step];
  if (!current) return null;

  const total = orders.length;
  const message = buildMessage(template, current);

  const handleWhatsApp = () => {
    const phone = current.customerPhone?.replace(/\D/g, '');
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');

    // Mark this order as sent
    const next = new Set(sentIndexes);
    next.add(step);
    setSentIndexes(next);

    // Notify the parent to call markNotified
    onNotified([current._id]);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopiedIndex(step);
      setTimeout(() => setCopiedIndex(null), 2000);

      const next = new Set(sentIndexes);
      next.add(step);
      setSentIndexes(next);
      onNotified([current._id]);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = message;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedIndex(step);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const handlePrev = () => setStep(s => Math.max(0, s - 1));
  const handleNext = () => setStep(s => Math.min(total - 1, s + 1));

  const isSent = sentIndexes.has(step);
  const allSent = sentIndexes.size === total;

  return (
    <div className="snm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="snm-modal">
        {/* Header */}
        <div className="snm-header">
          <div className="snm-header-left">
            <div className="snm-icon-wrap">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="snm-title">Stockpile Notice</h2>
              <p className="snm-subtitle">
                {total === 1
                  ? '1 customer to notify'
                  : `Customer ${step + 1} of ${total}`}
              </p>
            </div>
          </div>
          <button className="snm-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Progress bar (only for bulk) */}
        {total > 1 && (
          <div className="snm-progress-bar">
            <div
              className="snm-progress-fill"
              style={{ width: `${((step + 1) / total) * 100}%` }}
            />
          </div>
        )}

        {/* Customer info */}
        <div className="snm-customer-card">
          <div className="snm-avatar">{current.customer?.substring(0, 2).toUpperCase()}</div>
          <div>
            <span className="snm-customer-name">{current.customer}</span>
            <span className="snm-customer-phone">{current.customerPhone}</span>
          </div>
          {isSent && (
            <div className="snm-sent-badge">
              <CheckCheck size={13} /> Notified
            </div>
          )}
        </div>

        {/* Order info */}
        <div className="snm-order-info">
          <span className="snm-order-id">{current.orderId}</span>
          <span className="snm-dot">·</span>
          <span className="snm-order-item">{current.item}</span>
          <span className="snm-dot">·</span>
          <span className="snm-days-tag">
            <AlertTriangle size={12} />
            {daysSince(current.createdAt)} days stockpiling
          </span>
        </div>

        {/* Message preview */}
        <div className="snm-preview-label">Message Preview</div>
        <div className="snm-preview">{message}</div>

        {/* Actions */}
        <div className="snm-actions">
          <button className="snm-btn wa" onClick={handleWhatsApp}>
            <MessageCircle size={17} />
            Send via WhatsApp
          </button>
          <button className="snm-btn copy" onClick={handleCopy}>
            {copiedIndex === step
              ? <><CheckCheck size={16} /> Copied!</>
              : <><Copy size={16} /> Copy Message</>}
          </button>
        </div>

        {/* Navigation (multi-order) */}
        {total > 1 && (
          <div className="snm-nav">
            <button
              className="snm-nav-btn"
              onClick={handlePrev}
              disabled={step === 0}
            >
              <ArrowLeft size={15} /> Previous
            </button>

            <div className="snm-dots">
              {orders.map((_, i) => (
                <button
                  key={i}
                  className={`snm-dot-btn ${i === step ? 'active' : ''} ${sentIndexes.has(i) ? 'sent' : ''}`}
                  onClick={() => setStep(i)}
                />
              ))}
            </div>

            {step < total - 1 ? (
              <button className="snm-nav-btn next" onClick={handleNext}>
                Next <ArrowRight size={15} />
              </button>
            ) : (
              <button
                className={`snm-nav-btn done ${allSent ? 'all-sent' : ''}`}
                onClick={onClose}
              >
                {allSent ? <><CheckCheck size={15} /> All Done!</> : 'Finish'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
