import React from 'react';
import {
  X, MessageCircle, Package, MapPin,
  CreditCard, FileText, Zap, CheckCheck, Copy,
  Clock, RotateCcw, Truck, XCircle, Flag, Calendar
} from 'lucide-react';
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import './OrderDrawer.css';

// ─────────────────────────────────────────────────
// Constants & Helpers
// ─────────────────────────────────────────────────

export const STATUS_CONFIG = {
  New: { color: '#6366f1', bg: 'rgba(99, 102, 241, 0.15)', icon: <Zap size={12} /> },
  Pending: { color: '#d97706', bg: 'rgba(217, 119, 6, 0.15)', icon: <Clock size={12} /> },
  Processing: { color: '#2563eb', bg: 'rgba(37, 99, 235, 0.15)', icon: <RotateCcw size={12} /> },
  Ready: { color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.15)', icon: <Package size={12} /> },
  Delivered: { color: '#16a34a', bg: 'rgba(22, 163, 74, 0.15)', icon: <Truck size={12} /> },
  Cancelled: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', icon: <XCircle size={12} /> },
};

export const PAYMENT_CONFIG = {
  paid: { label: 'Paid', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.15)' },
  partial: { label: 'Partial', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.15)' },
  unpaid: { label: 'Unpaid', color: '#d97706', bg: 'rgba(217, 119, 6, 0.15)' },
};

export const STATUS_TRANSITIONS = {
  New: ['Processing', 'Cancelled'],
  Pending: ['Processing', 'Cancelled'],
  Processing: ['Ready', 'Cancelled'],
  Ready: ['Delivered', 'Cancelled'],
  Delivered: [],
  Cancelled: [],
};

// Internal icons since we don't want to export everything

export const formatCurrency = (val) => {
  const n = Number(String(val).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? '₦0' : '₦' + n.toLocaleString('en-NG');
};

export const relativeDate = (iso) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 172800) return 'Yesterday';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return '—'; }
};

// ─────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────

export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
  return (
    <span className="ord-badge" style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.icon}{status}
    </span>
  );
}

export function PaymentBadge({ status }) {
  const cfg = PAYMENT_CONFIG[status] || PAYMENT_CONFIG.unpaid;
  return (
    <span className="ord-pay-badge" style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────

import usePlan from '../hooks/usePlan';

export default function OrderDrawer({ order, onClose, onStatusChange, onMarkPaid, onDuplicate }) {
  if (!order) return null;
  const plan = usePlan();
  const balance = order.total - (order.amountPaid || 0);
  const updatePriority = useMutation(api.orders.updateOrderPriority);

  const handleToggleUrgent = async (e) => {
    e.stopPropagation();
    await updatePriority({
      orderId: order._id,
      isUrgent: !order.isUrgent
    });
  };

  const handleDateChange = async (e) => {
    await updatePriority({
      orderId: order._id,
      deliveryDate: e.target.value || undefined
    });
  };

  const whatsapp = () => {
    const clean = order.customerPhone?.replace(/\D/g, '') || '';
    const intl = clean.startsWith('0') ? '234' + clean.slice(1) : clean;
    const itemLines = (order.items || [])
      .map(it => `• ${it.desc} × ${it.qty} — ${formatCurrency(it.price * it.qty)}`)
      .join('\n');
    const msg = encodeURIComponent(
      `Hello ${order.customer}! 👋 Here's your order update:\n\nOrder ID: ${order.orderId || order.id}\n\n${itemLines}\n\nTotal: ${formatCurrency(order.total)}\nPaid: ${formatCurrency(order.amountPaid)}\nBalance: ${formatCurrency(balance)}\nStatus: ${order.status}\n\nThank you for your order!`
    );
    window.open(`https://wa.me/${intl}?text=${msg}`, '_blank');
  };

  const nextStatuses = STATUS_TRANSITIONS[order.status] || [];

  return (
    <div className="ord-drawer-backdrop" onClick={onClose}>
      <aside className="ord-drawer" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="ord-drawer-header">
          <div>
            <p className="ord-drawer-id">{order.orderId || order.id}</p>
            <h2 className="ord-drawer-name">{order.customer}</h2>
          </div>
          <button className="ord-drawer-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="ord-drawer-body">
          {/* Status + payment badges */}
          <div className="ord-drawer-status-row">
            <StatusBadge status={order.status} />
            <PaymentBadge status={order.paymentStatus} />
            {order.isUrgent && (
              <span className="ord-badge urgent-badge">
                <Flag size={12} fill="currentColor" /> URGENT
              </span>
            )}
          </div>

          {/* Next-status action buttons */}
          {nextStatuses.length > 0 && (
            <div className="ord-drawer-actions">
              {nextStatuses.map(s => (
                <button key={s} className="ord-next-btn"
                  style={{ color: STATUS_CONFIG[s]?.color, borderColor: STATUS_CONFIG[s]?.color + '44', background: STATUS_CONFIG[s]?.bg }}
                  onClick={() => onStatusChange(order._id, s)}
                >
                  {STATUS_CONFIG[s]?.icon} Mark as {s}
                </button>
              ))}
            </div>
          )}

          {/* ── Mark as Paid CTA (only shown when there's an outstanding balance) */}
          {order.paymentStatus !== 'paid' && order.status !== 'Cancelled' && (
            <button
              className="ord-drawer-mark-paid-btn"
              onClick={() => onMarkPaid(order._id)}
            >
              <CheckCheck size={16} />
              Mark {formatCurrency(balance)} as Paid
            </button>
          )}

          {/* Items */}
          <div className="ord-drawer-section">
            <p className="ord-drawer-section-title"><Package size={14} /> Items</p>
            <div className="ord-items-list">
              {(order.items || [{ desc: order.item, qty: 1, price: order.total }]).map((it, i) => (
                <div key={i} className="ord-item-line">
                  <span className="ord-item-desc">{it.desc}</span>
                  <span className="ord-item-qty">× {it.qty}</span>
                  <span className="ord-item-price">{formatCurrency(it.price * it.qty)}</span>
                </div>
              ))}
              <div className="ord-item-total">
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="ord-drawer-section">
            <p className="ord-drawer-section-title"><CreditCard size={14} /> Payment</p>
            <div className="ord-pay-grid">
              <div className="ord-pay-cell">
                <span className="ord-pay-label">Total</span>
                <span className="ord-pay-value">{formatCurrency(order.total)}</span>
              </div>
              <div className="ord-pay-cell">
                <span className="ord-pay-label">Paid</span>
                <span className="ord-pay-value" style={{ color: '#16a34a' }}>{formatCurrency(order.amountPaid)}</span>
              </div>
              <div className="ord-pay-cell">
                <span className="ord-pay-label">Balance</span>
                <span className="ord-pay-value" style={{ color: balance > 0 ? '#d97706' : '#6b7280' }}>
                  {formatCurrency(balance)}
                </span>
              </div>
              <div className="ord-pay-cell">
                <span className="ord-pay-label">Status</span>
                <PaymentBadge status={order.paymentStatus} />
              </div>
            </div>
          </div>

          {/* Delivery */}
          {order.deliveryAddress && (
            <div className="ord-drawer-section">
              <p className="ord-drawer-section-title"><MapPin size={14} /> Delivery Address</p>
              <p className="ord-drawer-text">{order.deliveryAddress}</p>
            </div>
          )}

          {/* Priority & Delivery Date */}
          <div className="ord-drawer-section">
            <p className="ord-drawer-section-title"><Flag size={14} /> Priority & Delivery</p>
            <div className="ord-drawer-priority-controls">
              <div className="ord-drawer-control">
                <span className="ord-control-label">Desired Delivery Date</span>
                <div className="ord-date-edit-wrap">
                  <Calendar size={14} className="ord-date-icon" />
                  <input
                    type="date"
                    className="ord-date-edit-input"
                    value={order.deliveryDate || ''}
                    onChange={handleDateChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              <div className="ord-drawer-control">
                <span className="ord-control-label">Urgency Toggle</span>
                <button
                  className={`ord-urgency-toggle-btn ${order.isUrgent ? 'active' : ''}`}
                  onClick={handleToggleUrgent}
                >
                  <Flag size={14} fill={order.isUrgent ? 'currentColor' : 'none'} />
                  <span>{order.isUrgent ? 'Marked Urgent' : 'Set as Urgent'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="ord-drawer-section">
              <p className="ord-drawer-section-title"><FileText size={14} /> Notes</p>
              <p className="ord-drawer-text">{order.notes}</p>
            </div>
          )}

          {/* Contact & Tools */}
          <div className="ord-drawer-section">
            <p className="ord-drawer-section-title"><Zap size={14} /> Actions</p>
            <div className="ord-drawer-tool-grid">
              <button className="ord-tool-btn wa" onClick={whatsapp}>
                <MessageCircle size={15} /> WhatsApp
              </button>
              <button className="ord-tool-btn duplicate" onClick={() => onDuplicate(order)}>
                <Copy size={15} /> Duplicate
              </button>
            </div>
          </div>
        </div>

        <div className="ord-drawer-footer">
          <span className="ord-drawer-date">Created {relativeDate(order.createdAt)}</span>
        </div>
      </aside>
    </div>
  );
}
