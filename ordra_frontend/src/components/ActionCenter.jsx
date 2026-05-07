import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle, Package, Zap, Clock, CheckCircle2,
  ArrowRight, Sparkles, Truck, Flag, Lock
} from 'lucide-react';
import './ActionCenter.css';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const fmt = (n) => '₦' + Math.round(n).toLocaleString('en-NG');
const ageHours = (iso) => (Date.now() - new Date(iso)) / 3600000;
const isUpcoming = (isoDate, days = 2) => {
  if (!isoDate) return false;
  const diff = new Date(isoDate).getTime() - Date.now();
  return diff > 0 && diff < days * 24 * 3600000;
};

// ─────────────────────────────────────────────
// Action definitions
// Each returns null if the condition isn't met (so it hides cleanly)
// ─────────────────────────────────────────────
function buildActions(orders, products = []) {
  const actions = [];

  // —1 — Priority / Urgent Orders
  const priorityOrders = orders.filter(o => 
    (o.isUrgent || isUpcoming(o.deliveryDate)) && 
    o.status !== 'Delivered' && 
    o.status !== 'Cancelled'
  );
  if (priorityOrders.length > 0) {
    actions.push({
      id:        'priority',
      priority:  -1, // Top of the list
      icon:      <Flag size={18} fill="currentColor" />,
      accent:    '#dc2626', // Bright red
      bg:        '#fef2f2',
      title:     `${priorityOrders.length} priority order${priorityOrders.length > 1 ? 's' : ''} needs attention`,
      sub:       priorityOrders.map(o => o.customer).slice(0, 2).join(', ') +
                 (priorityOrders.length > 2 ? ` +${priorityOrders.length - 2} more` : ''),
      cta:       'Handle now',
      linkTo:    '/app/orders',
      linkState: { filterUrgent: true },
    });
  }

  // 0 — Items on Backorder (Negative Stock)
  const backordered = products.filter(p => p.quantity < 0);
  if (backordered.length > 0) {
    const totalOwed = backordered.reduce((sum, p) => sum + Math.abs(p.quantity), 0);
    actions.push({
      id:        'backorder',
      priority:  0, // High priority
      icon:      <Package size={18} />,
      accent:    '#b91c1c',
      bg:        '#fef2f2',
      title:     `${backordered.length} item${backordered.length > 1 ? 's' : ''} on backorder`,
      sub:       `You owe ${totalOwed} unit${totalOwed > 1 ? 's' : ''} total: ` + 
                 backordered.map(p => p.name).join(', '),
      cta:       'Restock',
      linkTo:    '/app/products',
      linkState: {},
    });
  }

  // 1 — Unpaid / partial orders
  const unpaid = orders.filter(
    o => o.paymentStatus !== 'paid' && o.status !== 'Cancelled'
  );
  const unpaidTotal = unpaid.reduce(
    (s, o) => s + ((o.total || 0) - (o.amountPaid || 0)), 0
  );
  if (unpaid.length > 0) {
    actions.push({
      id:        'unpaid',
      priority:  1,
      icon:      <AlertCircle size={18} />,
      accent:    '#ef4444',
      bg:        '#fef2f2',
      title:     `${unpaid.length} unpaid order${unpaid.length > 1 ? 's' : ''}`,
      sub:       `${fmt(unpaidTotal)} still outstanding`,
      cta:       'Collect now',
      linkTo:    '/app/orders',
      linkState: { filterPayment: 'unpaid' },
    });
  }

  // 2 — Orders ready to deliver
  const ready = orders.filter(o => o.status === 'Ready');
  if (ready.length > 0) {
    actions.push({
      id:        'ready',
      priority:  2,
      icon:      <Truck size={18} />,
      accent:    '#7c3aed',
      bg:        '#ede9fe',
      title:     `${ready.length} order${ready.length > 1 ? 's' : ''} ready to deliver`,
      sub:       ready.map(o => o.customer).slice(0, 2).join(', ') +
                 (ready.length > 2 ? ` +${ready.length - 2} more` : ''),
      cta:       'View orders',
      linkTo:    '/app/orders',
      linkState: { filterStatus: 'Ready' },
    });
  }

  // 3 — New orders (just came in, need to start)
  const newOrders = orders.filter(o => o.status === 'New');
  if (newOrders.length > 0) {
    actions.push({
      id:        'new',
      priority:  3,
      icon:      <Zap size={18} />,
      accent:    '#6366f1',
      bg:        '#eef2ff',
      title:     `${newOrders.length} new order${newOrders.length > 1 ? 's' : ''} waiting`,
      sub:       'Start processing to keep customers updated',
      cta:       'Start now',
      linkTo:    '/app/orders',
      linkState: { filterStatus: 'New' },
    });
  }

  // 4 — Overdue pending (pending > 48h)
  const overdue = orders.filter(
    o => o.status === 'Pending' && ageHours(o.createdAt) > 48
  );
  if (overdue.length > 0) {
    actions.push({
      id:        'overdue',
      priority:  4,
      icon:      <Clock size={18} />,
      accent:    '#d97706',
      bg:        '#fef3c7',
      title:     `${overdue.length} order${overdue.length > 1 ? 's' : ''} stuck in Pending`,
      sub:       'Over 2 days old — customers may be waiting',
      cta:       'Review',
      linkTo:    '/app/orders',
      linkState: { filterStatus: 'Pending' },
    });
  }

  return actions;
}

// ─────────────────────────────────────────────
// ActionCenter component
// ─────────────────────────────────────────────
export default function ActionCenter({ orders = [], products = [], plan = {} }) {
  const actions = useMemo(() => buildActions(orders, products), [orders, products]);
  const isFreeUser = plan.isFree && !plan.isTrial;

  // All clear state
  if (actions.length === 0) {
    return (
      <div className="ac-card ac-all-clear">
        <div className="ac-all-clear-inner">
          <div className="ac-all-clear-icon">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="ac-all-clear-title">You're all caught up! 🎉</p>
            <p className="ac-all-clear-sub">No unpaid orders, no pending deliveries. Great work.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ac-card">
      {/* Header */}
      <div className="ac-header">
        <div className="ac-header-left">
          <Sparkles size={16} className="ac-sparkle" />
          <span className="ac-header-title">What needs your attention</span>
        </div>
        <span className="ac-count-pill">{actions.length} action{actions.length > 1 ? 's' : ''}</span>
      </div>

      {/* Action list */}
      <div className="ac-list">
        {actions.map((action, i) => {
          const isLockedAction = isFreeUser && (action.id === 'priority' || action.id === 'backorder' || action.id === 'unpaid' || action.id === 'overdue');
          
          const itemContent = (
            <div 
              className={`ac-item ${isLockedAction ? 'is-locked' : ''}`}
              style={{ '--ac-accent': action.accent, '--ac-bg': action.bg }}
            >
              {/* Priority indicator */}
              <div className="ac-priority-bar" style={{ background: action.accent }} />

              {/* Icon */}
              <div className="ac-icon-wrap" style={{ background: action.bg, color: action.accent }}>
                {action.icon}
              </div>

              {/* Text */}
              <div className="ac-text">
                <span className="ac-title">{action.title}</span>
                <span className="ac-sub">{action.sub}</span>
              </div>

              {/* CTA */}
              <div className="ac-cta">
                {isLockedAction ? (
                   <div className="ac-lock-badge"><Lock size={12} fill="currentColor" /> Locked</div>
                ) : (
                  <>
                    <span className="ac-cta-text">{action.cta}</span>
                    <ArrowRight size={14} className="ac-arrow" />
                  </>
                )}
              </div>
            </div>
          );

          if (isLockedAction) {
            return (
              <div 
                key={action.id} 
                onClick={() => window.dispatchEvent(new CustomEvent('ordra:upgrade', { detail: { feature: 'analytics' } }))}
                style={{ cursor: 'pointer' }}
              >
                {itemContent}
              </div>
            );
          }

          return (
            <Link
              key={action.id}
              to={action.linkTo}
              state={action.linkState}
              className="ac-link-wrapper"
              style={{ textDecoration: 'none' }}
            >
              {itemContent}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
