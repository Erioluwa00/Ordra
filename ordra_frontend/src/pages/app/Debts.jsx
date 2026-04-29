import React from 'react';
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { 
  CreditCard, Search, MessageCircle, AlertCircle, 
  ChevronRight, Calendar, User, Phone, ShoppingCart
} from 'lucide-react';
import './Debts.css';

const formatCurrency = (amt) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0
  }).format(amt);
};

const relativeDate = (dateStr) => {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
};

export default function Debts() {
  const debtors = useQuery(api.orders.getDebtors);

  const totalOwed = debtors?.reduce((sum, d) => sum + d.totalOwed, 0) || 0;
  const totalDebtors = debtors?.length || 0;
  const oldestDebt = debtors?.length > 0 
    ? [...debtors].sort((a,b) => new Date(a.oldestOrderDate) - new Date(b.oldestOrderDate))[0]?.oldestOrderDate 
    : null;

  const handleWhatsAppRemind = (debtor) => {
    const message = `Hello ${debtor.name}, this is a friendly reminder regarding your outstanding balance of ${formatCurrency(debtor.totalOwed)} for your recent orders with us. Please let us know when you'd like to settle this. Thank you!`;
    window.open(`https://wa.me/${debtor.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const DebtSkeleton = () => (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <tr key={i} className="skeleton-row">
          <td>
            <div className="cust-cell">
              <div className="skeleton-avatar shimmer"></div>
              <div>
                <div className="skeleton-text name shimmer"></div>
                <div className="skeleton-text sub shimmer"></div>
              </div>
            </div>
          </td>
          <td><div className="skeleton-badge shimmer"></div></td>
          <td><div className="skeleton-text date shimmer"></div></td>
          <td><div className="skeleton-text amount shimmer"></div></td>
          <td style={{ textAlign: 'right' }}><div className="skeleton-btn-group shimmer"></div></td>
        </tr>
      ))}
    </>
  );

  return (
    <div className="debts-page">
      <header className="page-header">
        <div>
          <h1 className="page-title">Debt Manager</h1>
          <p className="page-subtitle">Track and recover outstanding payments from customers</p>
        </div>
      </header>

      {/* Summary Grid — Consistent with Orders/Dashboard */}
      <div className="ord-summary-grid">
        <div className="ord-summary-card">
          <span className="ord-summary-label">Total Debt</span>
          {debtors === undefined ? <div className="skeleton-text val shimmer"></div> : <h2 className="ord-summary-val" style={{ color: '#ef4444' }}>{formatCurrency(totalOwed)}</h2>}
        </div>
        <div className="ord-summary-card">
          <span className="ord-summary-label">Debtors</span>
          {debtors === undefined ? <div className="skeleton-text val small shimmer"></div> : <h2 className="ord-summary-val">{totalDebtors}</h2>}
        </div>
        <div className="ord-summary-card">
          <span className="ord-summary-label">Oldest Debt</span>
          {debtors === undefined ? <div className="skeleton-text val small shimmer"></div> : <h2 className="ord-summary-val" style={{ fontSize: '1.25rem' }}>{oldestDebt ? relativeDate(oldestDebt) : 'None'}</h2>}
        </div>
        <div className="ord-summary-card">
          <span className="ord-summary-label">Active Orders</span>
          {debtors === undefined ? <div className="skeleton-text val small shimmer"></div> : <h2 className="ord-summary-val">{debtors?.reduce((sum, d) => sum + d.ordersCount, 0) || 0}</h2>}
        </div>
      </div>

      <div className="debt-list-section">
        <div className="debt-section-header">
          <div className="debt-search-wrap">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Search by customer name or phone..." className="debt-search-input" />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="table-container desktop-only">
          <table className="ord-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Orders</th>
                <th>Oldest Order</th>
                <th>Total Owed</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {debtors === undefined ? (
                <DebtSkeleton />
              ) : debtors.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '4rem' }}>
                    <div className="empty-state">
                      <CreditCard size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                      <p>No outstanding debts found. Your books are clean!</p>
                    </div>
                  </td>
                </tr>
              ) : debtors.map((debtor) => (
                <tr key={debtor.phone} className="ord-row">
                  <td>
                    <div className="cust-cell">
                      <div className="c-avatar">{debtor.name.substring(0, 2).toUpperCase()}</div>
                      <div>
                        <span className="cust-name">{debtor.name}</span>
                        <span className="cust-email">{debtor.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className="debt-count-badge">{debtor.ordersCount} Orders</span></td>
                  <td><span className="ord-date">{relativeDate(debtor.oldestOrderDate)}</span></td>
                  <td><span className="debt-amount-text">{formatCurrency(debtor.totalOwed)}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="debt-actions-cell">
                      <button className="wa-action-btn" onClick={() => handleWhatsAppRemind(debtor)}>
                        <MessageCircle size={14} /> WhatsApp
                      </button>
                      <button className="view-action-btn" onClick={() => window.location.href = `/app/orders?phone=${debtor.phone}`}>
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile List View */}
        <div className="mobile-only debt-mobile-list">
          {debtors?.map((debtor) => (
            <div key={debtor.phone} className="debt-mobile-card">
              <div className="debt-mobile-top">
                <div className="cust-cell">
                  <div className="c-avatar">{debtor.name.substring(0, 2).toUpperCase()}</div>
                  <div>
                    <span className="cust-name">{debtor.name}</span>
                    <span className="cust-email">{debtor.phone}</span>
                  </div>
                </div>
                <div className="debt-amount-badge-mobile">
                  {formatCurrency(debtor.totalOwed)}
                </div>
              </div>
              <div className="debt-mobile-mid">
                <div className="debt-stat">
                  <ShoppingCart size={14} /> {debtor.ordersCount} unpaid
                </div>
                <div className="debt-stat">
                  <Calendar size={14} /> Oldest: {relativeDate(debtor.oldestOrderDate)}
                </div>
              </div>
              <div className="debt-mobile-actions">
                <button className="wa-action-btn" onClick={() => handleWhatsAppRemind(debtor)}>
                  <MessageCircle size={16} /> WhatsApp Remind
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
