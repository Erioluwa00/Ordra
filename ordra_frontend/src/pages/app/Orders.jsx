import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Plus, Search, MessageCircle,
  ChevronDown, Clock, CheckCircle2, XCircle,
  Package, Truck, RotateCcw, ArrowUpDown,
  MapPin, CreditCard, FileText, X, ChevronRight,
  AlertCircle, Zap, CheckCheck, Copy, Flag, Calendar, Bell, Archive, Lock
} from 'lucide-react';
import NewOrderModal from '../../components/NewOrderModal';
import StockpileNoticeModal from '../../components/StockpileNoticeModal';
import usePlan from '../../hooks/usePlan';
import OrderDrawer, {
  StatusBadge,
  PaymentBadge,
  STATUS_CONFIG,
  PAYMENT_CONFIG,
  STATUS_TRANSITIONS,
  formatCurrency,
  relativeDate
} from '../../components/OrderDrawer';
import './Orders.css';

// ─────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────
const ALL_STATUSES = ['All', 'New', 'Pending', 'Processing', 'Ready', 'Delivered', 'Cancelled'];

const getInitials = (name = '') => {
  const p = name.trim().split(' ');
  return p.length > 1 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
};

// ─────────────────────────────────────────────────
// Mock Data (Removed)
// ─────────────────────────────────────────────────

// ─────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────


// ── Quick Pay button — shown on row hover for unpaid/partial orders
function QuickPayButton({ order, onMarkPaid, flashing }) {
  if (order.paymentStatus === 'paid') {
    return <PaymentBadge status="paid" />;
  }
  const balance = formatCurrency((order.total || 0) - (order.amountPaid || 0));
  return (
    <div className="ord-quick-pay-wrap">
      <PaymentBadge status={order.paymentStatus} />
      <button
        className={`ord-quick-pay-btn${flashing ? ' flashing' : ''}`}
        title={`Mark ${balance} as paid`}
        onMouseDown={e => { e.stopPropagation(); onMarkPaid(order._id); }}
      >
        <CheckCheck size={12} />
        Mark Paid
      </button>
    </div>
  );
}

// Inline status changer dropdown
function StatusChanger({ orderId, current, onChange }) {
  const [open, setOpen] = useState(false);
  const next = STATUS_TRANSITIONS[current] || [];
  if (next.length === 0) return <StatusBadge status={current} />;

  return (
    <div className="ord-status-changer" onBlur={(e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
    }} tabIndex={-1}>
      <button
        className="ord-status-trigger"
        style={{ color: STATUS_CONFIG[current]?.color, background: STATUS_CONFIG[current]?.bg }}
        onClick={() => setOpen(o => !o)}
      >
        {STATUS_CONFIG[current]?.icon}
        {current}
        <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <div className="ord-status-menu">
          <div style={{ padding: '4px 8px', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Move to</div>
          {next.map(s => (
            <button key={s} className="ord-status-option"
              style={{ color: STATUS_CONFIG[s]?.color }}
              onClick={() => { onChange(orderId, s); setOpen(false); }}
            >
              {STATUS_CONFIG[s]?.icon} {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


// ─────────────────────────────────────────────────
// Main Orders Page
// ─────────────────────────────────────────────────
export default function Orders() {
  const liveOrders = useQuery(api.orders.getAllOrders);
  const liveSettings = useQuery(api.settings.getSettings);
  const updateStatus = useMutation(api.orders.updateOrderStatus);
  const updatePayment = useMutation(api.orders.updateOrderPaymentStatus);
  const markNotifiedMutation = useMutation(api.orders.markNotified);
  
  const isLoading = liveOrders === undefined;
  const orders = liveOrders || [];
  const stockpileDays = liveSettings?.stockpileDays ?? 7;
  const stockpileTemplate = liveSettings?.templateStockpile ?? '';

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPayment, setFilterPayment] = useState('all');
  const [filterStockpile, setFilterStockpile] = useState(false);
  const [sortBy, setSortBy] = useState('date_desc');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stockpileModalOrders, setStockpileModalOrders] = useState(null); // null = closed
  const [selectedOrderIds, setSelectedOrderIds] = useState(new Set());
  const [duplicateOrderData, setDuplicateOrderData] = useState(null);
  const [flashedId, setFlashedId] = useState(null);
  const [filterUrgent, setFilterUrgent] = useState(false);
  const bulkUpdate = useMutation(api.orders.bulkUpdateOrders);

  const plan = usePlan();
  const isLocked = plan.isFree && !plan.isTrial;

  const handleNewOrder = () => {
    if (plan.orderLimitReached) {
      window.dispatchEvent(new CustomEvent('ordra:upgrade', { detail: { feature: 'orders' } }));
      return;
    }
    setIsModalOpen(true);
  };

  const location = useLocation();

  useEffect(() => {
    if (location.state?.filterUrgent) {
      setFilterUrgent(true);
    }
    if (location.state?.filterStatus) {
      setFilterStatus(location.state.filterStatus);
    }
    if (location.state?.filterPayment) {
      setFilterPayment(location.state.filterPayment);
    }
  }, [location.state]);

  const isUpcoming = (isoDate, days = 2) => {
    if (!isoDate) return false;
    const diff = new Date(isoDate).getTime() - Date.now();
    return diff > 0 && diff < days * 24 * 3600000;
  };

  const isStockpiling = (order) => {
    if (order.paymentStatus !== 'paid') return false;
    if (order.status === 'Delivered' || order.status === 'Cancelled') return false;
    const ms = Date.now() - new Date(order.createdAt).getTime();
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    return days >= stockpileDays;
  };

  const stockpilingCount = useMemo(() => orders.filter(isStockpiling).length, [orders, stockpileDays]);

  // ── Handlers
  const handleDuplicate = (order) => {
    setDuplicateOrderData(order);
    setIsModalOpen(true);
    setSelectedOrder(null);
  };

  // ── Derived stats
  const stats = useMemo(() => ({
    total:     orders.length,
    active:    orders.filter(o => !['Delivered','Cancelled'].includes(o.status)).length,
    revenue:   orders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + (o.total || 0), 0),
    unpaid:    orders.filter(o => o.paymentStatus !== 'paid' && o.status !== 'Cancelled').reduce((s, o) => s + ((o.total || 0) - (o.amountPaid || 0)), 0),
  }), [orders]);

  // ── Filtered + sorted list
  const displayed = useMemo(() => {
    let list = [...orders];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        (o.customer || '').toLowerCase().includes(q) ||
        (o.orderId || '').toLowerCase().includes(q) ||
        (o.item || '').toLowerCase().includes(q) ||
        (o.customerPhone || '').includes(q)
      );
    }
    if (filterStatus !== 'All') list = list.filter(o => o.status === filterStatus);
    if (filterPayment !== 'all') list = list.filter(o => o.paymentStatus === filterPayment);
    if (filterUrgent) {
      list = list.filter(o => (o.isUrgent || isUpcoming(o.deliveryDate)) && o.status !== 'Delivered' && o.status !== 'Cancelled');
    }
    if (filterStockpile) {
      list = list.filter(o => isStockpiling(o));
    }

    list.sort((a, b) => {
      if (sortBy === 'date_desc' || sortBy === 'date_asc') {
        const aUrgent = a.isUrgent || isUpcoming(a.deliveryDate);
        const bUrgent = b.isUrgent || isUpcoming(b.deliveryDate);
        if (aUrgent && !bUrgent) return -1;
        if (!aUrgent && bUrgent) return 1;
      }
      if (sortBy === 'date_desc') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'date_asc')  return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'amount_desc') return b.total - a.total;
      if (sortBy === 'amount_asc')  return a.total - b.total;
      return 0;
    });
    return list;
  }, [orders, search, filterStatus, filterPayment, sortBy, filterUrgent, filterStockpile, stockpileDays]);

  // ── Handlers
  const handleStatusChange = async (orderId, newStatus) => {
    // Optimistic UI for drawer
    setSelectedOrder(prev => prev?._id === orderId ? { ...prev, status: newStatus } : prev);
    await updateStatus({ orderId, status: newStatus });
  };

  const handleMarkPaid = useCallback(async (orderId) => {
    const order = orders.find(o => o._id === orderId);
    if (!order) return;

    // Optimistic UI for drawer
    setSelectedOrder(prev =>
      prev?._id === orderId
        ? { ...prev, paymentStatus: 'paid', amountPaid: prev.total }
        : prev
    );
    setFlashedId(orderId);
    setTimeout(() => setFlashedId(null), 900);

    // Persist to DB
    await updatePayment({ orderId, paymentStatus: 'paid', amountPaid: order.total });
  }, [orders, updatePayment]);
  // ── Bulk Actions
  const toggleSelectAll = () => {
    if (selectedOrderIds.size === displayed.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(displayed.map(o => o._id)));
    }
  };

  const toggleSelectOrder = (e, id) => {
    e.stopPropagation();
    const next = new Set(selectedOrderIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedOrderIds(next);
  };

  const handleBulkUpdate = async (type, val) => {
    const ids = Array.from(selectedOrderIds);
    const args = { orderIds: ids };
    if (type === 'status') args.status = val;
    if (type === 'payment') args.paymentStatus = val;

    setSelectedOrderIds(new Set());
    await bulkUpdate(args);
  };

  return (
    <div className="ord-page">

      {/* ── Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">{stats.total} total · {stats.active} active</p>
        </div>
        <div className="page-actions">
          <button className="action-btn primary" onClick={handleNewOrder}>
            <Plus size={18} /> New Order
          </button>
        </div>
      </div>

      {/* ── Summary Cards */}
      <div className="ord-summary-grid">
        <div className="ord-summary-card">
          <span className="ord-summary-label">Total Orders</span>
          <span className="ord-summary-val">{stats.total}</span>
        </div>
        <div className="ord-summary-card">
          <span className="ord-summary-label">Active</span>
          <span className="ord-summary-val" style={{ color: '#6366f1' }}>{stats.active}</span>
        </div>
        <div className="ord-summary-card">
          <span className="ord-summary-label">Revenue</span>
          <span className="ord-summary-val" style={{ color: '#16a34a' }}>{formatCurrency(stats.revenue)}</span>
        </div>
        <div className="ord-summary-card">
          <span className="ord-summary-label">Outstanding</span>
          <span className="ord-summary-val" style={{ color: stats.unpaid > 0 ? '#d97706' : '#16a34a' }}>
            {formatCurrency(stats.unpaid)}
          </span>
        </div>
      </div>

      {/* ── Filters Bar */}
      <div className="ord-filters">
        {/* Search */}
        <div className="ord-search-wrap">
          <Search size={16} className="ord-search-icon" />
          <input
            type="text"
            className="ord-search-input"
            placeholder="Search by name, order ID or item..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="ord-search-clear" onClick={() => setSearch('')}><X size={14} /></button>
          )}
        </div>

        <div className="ord-filter-right">
          {/* Urgent filter toggle */}
          <button 
            className={`ord-priority-toggle ${filterUrgent ? 'active' : ''}`}
            onClick={() => setFilterUrgent(!filterUrgent)}
            title="Show high priority orders"
          >
            <Flag size={14} fill={filterUrgent ? "currentColor" : "none"} />
            <span>Priority</span>
          </button>
          {/* Payment filter */}
          <div className="ord-select-wrap">
            <CreditCard size={14} className="ord-select-icon" />
            <select className="ord-select" value={filterPayment} onChange={e => setFilterPayment(e.target.value)}>
              <option value="all">All Payments</option>
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
            <ChevronDown size={13} className="ord-select-chevron" />
          </div>

          {/* Sort */}
          <div className="ord-select-wrap">
            <ArrowUpDown size={14} className="ord-select-icon" />
            <select className="ord-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="date_desc">Newest first</option>
              <option value="date_asc">Oldest first</option>
              <option value="amount_desc">Highest amount</option>
              <option value="amount_asc">Lowest amount</option>
            </select>
            <ChevronDown size={13} className="ord-select-chevron" />
          </div>
        </div>
      </div>

      {/* ── Status Tab Pills */}
      <div className="ord-status-tabs">
        {ALL_STATUSES.map(s => {
          const count    = s === 'All' ? orders.length : orders.filter(o => o.status === s).length;
          const isActive = filterStatus === s;
          // Active: solid fill (purple for All, status colour for others) + white text
          // Inactive: transparent bg + subtle border
          const activeStyle = isActive && s !== 'All'
            ? { background: STATUS_CONFIG[s]?.color, borderColor: STATUS_CONFIG[s]?.color, color: 'white', boxShadow: `0 2px 8px ${STATUS_CONFIG[s]?.color}44` }
            : {};
          const inactiveStyle = !isActive && s !== 'All'
            ? { borderColor: STATUS_CONFIG[s]?.color + '55', color: STATUS_CONFIG[s]?.color }
            : !isActive
              ? { borderColor: '#e5e7eb' }
              : {};
          return (
            <button
              key={s}
              className={`ord-status-tab${isActive ? ' active' : ' inactive'}`}
              style={{ ...activeStyle, ...inactiveStyle }}
              onClick={() => setFilterStatus(s)}
            >
              {s}
              {count > 0 && <span className="ord-tab-count">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* ── Stockpile Filter Tab (appears only when there are stockpiling orders) */}
      {stockpilingCount > 0 && (
        <button
          className={`ord-stockpile-tab${filterStockpile ? ' active' : ''}`}
          onClick={() => {
            setFilterStockpile(f => !f);
            setFilterStatus('All');
            setFilterPayment('all');
            setFilterUrgent(false);
          }}
        >
          <Archive size={14} />
          Stockpiling
          <span className="ord-stockpile-count">{stockpilingCount}</span>
        </button>
      )}

      {/* ── Orders Table / Cards */}
      <div className="table-container">

        {/* DESKTOP TABLE */}
        <div className="ord-table-wrapper">
          <table className="ord-table full-table">
            <thead>
              <tr>
                <th style={{ width: '48px' }}>
                  <input 
                    type="checkbox" 
                    className="custom-checkbox"
                    checked={displayed.length > 0 && selectedOrderIds.size === displayed.length}
                    onChange={() => {
                      if (isLocked) {
                        window.dispatchEvent(new CustomEvent('ordra:upgrade', { detail: { feature: 'bulk' } }));
                        return;
                      }
                      toggleSelectAll();
                    }}
                  />
                </th>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td><div className="skeleton" style={{ width: '60px', height: '16px' }} /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                        <div className="skeleton" style={{ width: '100px', height: '16px' }} />
                      </div>
                    </td>
                    <td><div className="skeleton" style={{ width: '150px', height: '16px' }} /></td>
                    <td><div className="skeleton" style={{ width: '80px', height: '16px' }} /></td>
                    <td><div className="skeleton" style={{ width: '70px', height: '24px', borderRadius: '99px' }} /></td>
                    <td><div className="skeleton" style={{ width: '80px', height: '24px', borderRadius: '99px' }} /></td>
                    <td><div className="skeleton" style={{ width: '60px', height: '16px' }} /></td>
                    <td></td>
                  </tr>
                ))
              ) : displayed.length === 0 ? (
                <tr>
                  <td colSpan={8} className="ord-empty">
                    <div className="ord-empty-inner">
                      <Package size={32} />
                      <p>No orders match your filters</p>
                      <button className="ord-empty-clear" onClick={() => { 
                        setSearch(''); 
                        setFilterStatus('All'); 
                        setFilterPayment('all');
                        setFilterUrgent(false);
                      }}>
                        Clear filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : displayed.map(order => (
                <tr
                  key={order._id}
                  className={`ord-row${flashedId === order._id ? ' paid-flash' : ''}${selectedOrderIds.has(order._id) ? ' selected' : ''}`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <td onClick={e => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      className="custom-checkbox"
                      checked={selectedOrderIds.has(order._id)}
                      onChange={(e) => {
                        if (isLocked) {
                          window.dispatchEvent(new CustomEvent('ordra:upgrade', { detail: { feature: 'bulk' } }));
                          return;
                        }
                        toggleSelectOrder(e, order._id);
                      }}
                    />
                  </td>
                  <td><span className="ord-id">{order.orderId}</span></td>
                  <td>
                    <div className="cust-cell">
                      <div className="c-avatar">{getInitials(order.customer)}</div>
                      <div>
                        <span className="cust-name">{order.customer}</span>
                        <span className="cust-email">{order.customerPhone}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="ord-item-cell">
                      <span className="ord-item-text">{order.item}</span>
                      {(order.isUrgent || isUpcoming(order.deliveryDate)) && (
                        <div className="ord-priority-tag">
                          <Flag size={10} fill="currentColor" />
                          {order.isUrgent ? 'URGENT' : 'UPCOMING'}
                        </div>
                      )}
                      {isStockpiling(order) && (
                        <div className="ord-stockpile-tag">
                          <Archive size={10} />
                          STOCKPILING
                        </div>
                      )}
                    </div>
                  </td>
                  <td><span className="ord-amount">{formatCurrency(order.total)}</span></td>
                  <td onClick={e => e.stopPropagation()}>
                    <QuickPayButton
                      order={order}
                      onMarkPaid={handleMarkPaid}
                      flashing={flashedId === order.id}
                    />
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <StatusChanger orderId={order._id} current={order.status} onChange={handleStatusChange} />
                  </td>
                  <td>
                    <div className="ord-date-cell">
                      <span className="ord-date">{relativeDate(order.createdAt)}</span>
                      {order.notifiedAt && (
                        <span className="ord-notified-tag">
                          <Bell size={10} /> Notified
                        </span>
                      )}
                      {order.deliveryDate && (
                        <span className="ord-delivery-date">
                          <Calendar size={10} /> {new Date(order.deliveryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <ChevronRight size={16} className="ord-arrow" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS */}
        <div className="mobile-card-view">
          {displayed.length > 0 && (
            <div className="mobile-select-all-bar">
              <input 
                type="checkbox" 
                className="custom-checkbox"
                checked={displayed.length > 0 && selectedOrderIds.size === displayed.length}
                onChange={toggleSelectAll}
              />
              <span>Select All ({displayed.length})</span>
            </div>
          )}
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="ord-mobile-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                    <div className="skeleton" style={{ width: '100px', height: '16px' }} />
                  </div>
                  <div className="skeleton" style={{ width: '60px', height: '20px', borderRadius: '12px' }} />
                </div>
                <div className="skeleton" style={{ width: '100%', height: '14px', marginBottom: '8px' }} />
                <div className="skeleton" style={{ width: '80%', height: '14px' }} />
              </div>
            ))
          ) : displayed.length === 0 ? (
            <div className="ord-empty" style={{ padding: '3rem 1rem' }}>
              <div className="ord-empty-inner">
                <Package size={32} />
                <p>No orders match your filters</p>
                <button className="ord-empty-clear" onClick={() => { 
                  setSearch(''); 
                  setFilterStatus('All'); 
                  setFilterPayment('all');
                  setFilterUrgent(false);
                }}>
                  Clear filters
                </button>
              </div>
            </div>
          ) : displayed.map(order => (
            <div
              key={order._id}
              className={`ord-mobile-card${flashedId === order._id ? ' paid-flash' : ''}${selectedOrderIds.has(order._id) ? ' selected' : ''}`}
              onClick={() => setSelectedOrder(order)}
            >
              <div className="ord-mobile-card-select" onClick={e => toggleSelectOrder(e, order._id)}>
                <input 
                  type="checkbox" 
                  className="custom-checkbox"
                  checked={selectedOrderIds.has(order._id)} 
                  readOnly 
                />
              </div>
              <div className="ord-mobile-card-content">
                <div className="ord-mobile-card-top">
                  <div className="cust-cell">
                    <div className="c-avatar">{getInitials(order.customer)}</div>
                    <div>
                      <span className="cust-name">{order.customer}</span>
                      <span className="cust-email">{order.orderId}</span>
                    </div>
                  </div>
                  <div className="ord-mobile-badges">
                    <StatusBadge status={order.status} />
                    <PaymentBadge status={order.paymentStatus} />
                  </div>
                </div>
                <div className="ord-mobile-card-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="ord-item-text">{order.item}</span>
                    {order.isUrgent && <span className="ord-mobile-priority-tag urgent">URGENT</span>}
                    {isUpcoming(order.deliveryDate) && !order.isUrgent && <span className="ord-mobile-priority-tag upcoming">UPCOMING</span>}
                    {isStockpiling(order) && <span className="ord-mobile-priority-tag stockpile">STOCKPILING</span>}
                  </div>
                </div>
                <div className="ord-mobile-card-foot">
                  <span className="ord-amount">{formatCurrency(order.total)}</span>
                  {order.paymentStatus !== 'paid' && order.status !== 'Cancelled' ? (
                    <button
                      className="ord-mobile-pay-btn"
                      onMouseDown={e => { e.stopPropagation(); handleMarkPaid(order._id); }}
                    >
                      <CheckCheck size={12} /> Mark Paid
                    </button>
                  ) : (
                    <span className="ord-date">{relativeDate(order.createdAt)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Detail Drawer */}
      <OrderDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleStatusChange}
        onMarkPaid={handleMarkPaid}
        onDuplicate={handleDuplicate}
      />

      {/* ── New Order Modal */}
      <NewOrderModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setDuplicateOrderData(null);
        }}
        initialData={duplicateOrderData}
      />

      {/* ── Bulk Action Bar */}
      {selectedOrderIds.size > 0 && (
        <div className="ord-bulk-bar">
          <div className="ord-bulk-info">
            <span className="ord-bulk-count">{selectedOrderIds.size}</span>
          </div>
          <div className="ord-bulk-actions">
            <button className="ord-bulk-btn" onClick={() => handleBulkUpdate('payment', 'paid')}>
              <CheckCheck size={16} /> <span className="bulk-btn-text">Paid</span>
            </button>
            <button className="ord-bulk-btn" onClick={() => handleBulkUpdate('status', 'Delivered')}>
              <Truck size={16} /> <span className="bulk-btn-text">Delivered</span>
            </button>
            <button
              className="ord-bulk-btn notify"
              onClick={() => {
                if (isLocked) {
                  window.dispatchEvent(new CustomEvent('ordra:upgrade', { detail: { feature: 'whatsapp' } }));
                  return;
                }
                const selectedStockpiling = displayed.filter(
                  o => selectedOrderIds.has(o._id) && isStockpiling(o)
                );
                const allSelected = displayed.filter(o => selectedOrderIds.has(o._id));
                setStockpileModalOrders(selectedStockpiling.length > 0 ? selectedStockpiling : allSelected);
              }}
            >
              <Bell size={16} /> <span className="bulk-btn-text">Notify</span>
              {isLocked && <Lock size={12} style={{ marginLeft: '6px', color: '#a78bfa' }} />}
            </button>
            <button className="ord-bulk-btn cancel" onClick={() => setSelectedOrderIds(new Set())}>
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Stockpile Notice Modal */}
      {stockpileModalOrders && (
        <StockpileNoticeModal
          orders={stockpileModalOrders}
          template={stockpileTemplate}
          onClose={() => setStockpileModalOrders(null)}
          onNotified={async (ids) => {
            await markNotifiedMutation({ orderIds: ids });
          }}
        />
      )}

    </div>
  );
}
