import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Search, Plus, Edit2, Trash2, X,
  Phone, MapPin, Mail, ShoppingBag, Wallet,
  Clock, CheckCircle2, XCircle, RotateCcw,
  Package, Truck, Zap, MessageCircle, ChevronRight,
  TrendingUp, Calendar, FileText
} from 'lucide-react';
import CustomerModal from '../../components/CustomerModal';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';
import NewOrderModal from '../../components/NewOrderModal';
import OrderDrawer, {
  STATUS_CONFIG,
  PAYMENT_CONFIG,
  formatCurrency,
  relativeDate
} from '../../components/OrderDrawer';
import './Customers.css';

// ─────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────


// ─────────────────────────────────────────────────
// Mock Data (Removed)
// ─────────────────────────────────────────────────

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────

const getInitials = (name = '') => {
  const p = name.trim().split(' ');
  return p.length > 1 ? (p[0][0] + p[p.length - 1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
};



// ─────────────────────────────────────────────────
// Customer History Drawer
// ─────────────────────────────────────────────────

function CustomerDrawer({ customer, onClose, onEdit, onOrderClick }) {
  if (!customer) return null;

  // Real orders for this customer from DB
  const liveOrders = useQuery(api.orders.getOrdersByPhone, { phone: customer.phone });
  const isLoading = liveOrders === undefined;
  const orders = liveOrders || [];

  // Quick derived stats from actual orders
  const totalSpent     = orders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + (o.total || 0), 0);
  const outstanding    = orders.filter(o => o.paymentStatus !== 'paid' && o.status !== 'Cancelled')
                               .reduce((s, o) => s + ((o.total || 0) - (o.amountPaid || 0)), 0);
  const lastOrder      = orders[0];
  const completedCount = orders.filter(o => o.status === 'Delivered').length;

  const openWhatsApp = () => {
    const clean = customer.phone.replace(/\D/g, '');
    const intl   = clean.startsWith('0') ? '234' + clean.slice(1) : clean;
    const msg    = encodeURIComponent(`Hello ${customer.name}! 👋`);
    window.open(`https://wa.me/${intl}?text=${msg}`, '_blank');
  };

  return (
    <div className="cust-drawer-backdrop" onClick={onClose}>
      <aside className="cust-drawer" onClick={e => e.stopPropagation()}>

        {/* ── Header */}
        <div className="cust-drawer-header">
          <div className="cust-drawer-avatar">{getInitials(customer.name)}</div>
          <div className="cust-drawer-identity">
            <h2 className="cust-drawer-name">{customer.name}</h2>
            <span className="cust-drawer-since">
              <Calendar size={12} /> Customer since {new Date().getFullYear()}
            </span>
          </div>
          <div className="cust-drawer-header-actions">
            <button className="icon-btn" onClick={() => { onClose(); onEdit(customer); }} title="Edit customer">
              <Edit2 size={15} />
            </button>
            <button className="icon-btn" onClick={onClose} title="Close">
              <X size={17} />
            </button>
          </div>
        </div>

        <div className="cust-drawer-body">

          {/* ── Stat pills */}
          <div className="cust-drawer-stats">
            <div className="cust-stat-pill">
              <ShoppingBag size={14} />
              <div>
                <span className="cust-stat-val">{orders.length}</span>
                <span className="cust-stat-lbl">Orders</span>
              </div>
            </div>
            <div className="cust-stat-pill">
              <Wallet size={14} />
              <div>
                <span className="cust-stat-val" style={{ color: '#16a34a' }}>
                  ₦{totalSpent.toLocaleString('en-NG')}
                </span>
                <span className="cust-stat-lbl">Total Spent</span>
              </div>
            </div>
            <div className="cust-stat-pill">
              <TrendingUp size={14} />
              <div>
                <span className="cust-stat-val" style={{ color: outstanding > 0 ? '#d97706' : '#16a34a' }}>
                  ₦{outstanding.toLocaleString('en-NG')}
                </span>
                <span className="cust-stat-lbl">Outstanding</span>
              </div>
            </div>
            <div className="cust-stat-pill">
              <CheckCircle2 size={14} />
              <div>
                <span className="cust-stat-val">{completedCount}</span>
                <span className="cust-stat-lbl">Completed</span>
              </div>
            </div>
          </div>

          {/* ── Customer Notes */}
          <div className="cust-drawer-section">
            <p className="cust-drawer-section-title"><FileText size={14} /> Customer Notes</p>
            <div className="cust-notes-box">
              {customer.notes ? (
                <p className="cust-notes-text">{customer.notes}</p>
              ) : (
                <p className="cust-notes-empty">No notes for this customer yet.</p>
              )}
            </div>
          </div>

          {/* ── Contact info */}
          <div className="cust-drawer-section">
            <p className="cust-drawer-section-title">Contact</p>
            <div className="cust-contact-list">
              <div className="cust-contact-row">
                <Phone size={14} />
                <span>{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="cust-contact-row">
                  <Mail size={14} />
                  <span>{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className="cust-contact-row">
                  <MapPin size={14} />
                  <span>{customer.address}</span>
                </div>
              )}
            </div>
            <button className="cust-wa-btn" onClick={openWhatsApp}>
              <MessageCircle size={14} /> Message on WhatsApp
            </button>
          </div>

          {/* ── Order history */}
          <div className="cust-drawer-section">
            <p className="cust-drawer-section-title">
              Order History
              <span className="cust-history-count">{orders.length}</span>
            </p>

            {orders.length === 0 ? (
              <div className="cust-no-orders">
                <ShoppingBag size={28} />
                <p>No orders yet</p>
              </div>
            ) : (
              <div className="cust-order-list">
                {orders.map(order => {
                  const sc  = STATUS_CONFIG[order.status]  || STATUS_CONFIG.Pending;
                  const pc  = PAYMENT_CONFIG[order.paymentStatus] || PAYMENT_CONFIG.unpaid;
                  const bal = (order.total || 0) - (order.amountPaid || 0);

                  return (
                    <div
                      key={order._id}
                      className="cust-order-card"
                      onClick={() => onOrderClick(order)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="cust-order-card-top">
                        <span className="cust-order-id">{order.orderId || order._id}</span>
                        <div className="cust-order-badges">
                          <span className="ord-badge" style={{ color: sc.color, background: sc.bg }}>
                            {sc.icon} {order.status}
                          </span>
                          <span className="ord-pay-badge" style={{ color: pc.color, background: pc.bg }}>
                            {pc.label}
                          </span>
                        </div>
                      </div>
                      <p className="cust-order-items">{order.item}</p>
                      <div className="cust-order-card-foot">
                        <div className="cust-order-amounts">
                          <span className="cust-order-total">{formatCurrency(order.total)}</span>
                          {bal > 0 && (
                            <span className="cust-order-bal">
                              {formatCurrency(bal)} outstanding
                            </span>
                          )}
                        </div>
                        <span className="cust-order-date">{relativeDate(order.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* ── Footer: last order summary */}
        {lastOrder && (
          <div className="cust-drawer-footer">
            <span className="cust-footer-label">Last order</span>
            <span className="cust-footer-val">{relativeDate(lastOrder.createdAt)} · {formatCurrency(lastOrder.total)}</span>
          </div>
        )}
      </aside>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Main Customers Page
// ─────────────────────────────────────────────────

import { db, saveCustomerToCache, addToSyncQueue } from '../../lib/db';
import { useOffline } from '../../context/OfflineContext';

export default function Customers() {
  const { isOnline, refreshPending } = useOffline();
  const [localCustomers, setLocalCustomers] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const liveCustomers = useQuery(api.orders.getCustomers);
  const createCust = useMutation(api.orders.createCustomer);
  const updateCust = useMutation(api.orders.updateCustomer);
  const deleteCust = useMutation(api.orders.deleteCustomer);
  
  const updateOrderStatus = useMutation(api.orders.updateOrderStatus);
  const updateOrderPayment = useMutation(api.orders.updateOrderPaymentStatus);

  useEffect(() => {
    if (liveCustomers) {
      setLocalCustomers(liveCustomers);
      setIsInitialLoad(false);
      // Background cache update
      liveCustomers.forEach(c => saveCustomerToCache(c));
    } else if (!isOnline) {
      // Load from IndexedDB if offline and Convex is loading/unavailable
      db.customers.toArray().then(cached => {
        setLocalCustomers(cached || []);
        setIsInitialLoad(false);
      });
    }
  }, [liveCustomers, isOnline]);

  const isLoading = isInitialLoad;
  const customers = localCustomers;

  const [searchQuery, setSearchQuery] = useState('');

  // Modal (add/edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [custToDelete, setCustToDelete] = useState(null);

  // History drawer
  const [drawerCustomer, setDrawerCustomer] = useState(null);

  // Order Detail Drawer
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [duplicateOrderData, setDuplicateOrderData] = useState(null);

  const filteredCustomers = useMemo(() => {
    let list = [...customers];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
      );
    }
    return list;
  }, [customers, searchQuery]);

  const handleOpenModal = (customer = null) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleSaveCustomer = async (formData) => {
    try {
      if (isOnline) {
        if (editingCustomer) {
          await updateCust({
            customerId: editingCustomer._id,
            email: formData.email,
            notes: formData.notes
          });
        } else {
          await createCust({
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            notes: formData.notes
          });
        }
      } else {
        // OFFLINE
        const tempId = `OFFLINE-CUST-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        const offlineCust = {
          ...formData,
          _id: tempId,
          totalOrders: 0,
          lifetimeValue: 0,
          isOffline: true
        };
        
        // Optimistic UI
        setLocalCustomers(p => [offlineCust, ...p]);
        await saveCustomerToCache(offlineCust);
        
        await addToSyncQueue(editingCustomer ? 'UPDATE_CUSTOMER' : 'CREATE_CUSTOMER', 
          editingCustomer ? { customerId: editingCustomer._id, ...formData } : formData
        );
        refreshPending();
      }
      handleCloseModal();
    } catch (err) {
      alert(err.message || "Failed to save customer");
    }
  };

  const handleDelete = async () => {
    if (!custToDelete) return;
    await deleteCust({ customerId: custToDelete._id });
    if (drawerCustomer?._id === custToDelete._id) setDrawerCustomer(null);
    setCustToDelete(null);
  };

  const handleOrderStatusChange = async (orderId, newStatus) => {
    setSelectedOrder(prev => prev?._id === orderId ? { ...prev, status: newStatus } : prev);
    await updateOrderStatus({ orderId, status: newStatus });
  };

  const handleMarkPaid = async (orderId) => {
    const order = selectedOrder;
    if (!order) return;
    setSelectedOrder(prev =>
      prev?._id === orderId
        ? { ...prev, paymentStatus: 'paid', amountPaid: prev.total }
        : prev
    );
    await updateOrderPayment({ orderId, paymentStatus: 'paid', amountPaid: order.total });
  };

  const handleDuplicate = (order) => {
    setDuplicateOrderData(order);
    setIsOrderModalOpen(true);
    setSelectedOrder(null);
  };

  return (
    <div>
      {/* ── Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">{customers.length} total customer{customers.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="page-actions">
          <button className="action-btn primary" onClick={() => handleOpenModal(null)}>
            <Plus size={18} /> Add Customer
          </button>
        </div>
      </div>

      {/* ── Search */}
      <div className="table-controls">
        <Search className="table-search-icon" size={18} />
        <input
          type="text"
          className="table-search-input"
          placeholder="Search by name, phone or email..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* ── Table */}
      <div className="table-container">

        {/* DESKTOP */}
        <div className="ord-table-wrapper">
          <table className="full-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Orders</th>
                <th>Lifetime Value</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                        <div className="skeleton" style={{ width: '100px', height: '16px' }} />
                      </div>
                    </td>
                    <td><div className="skeleton" style={{ width: '120px', height: '16px' }} /></td>
                    <td><div className="skeleton" style={{ width: '100px', height: '16px' }} /></td>
                    <td><div className="skeleton" style={{ width: '40px', height: '16px' }} /></td>
                    <td><div className="skeleton" style={{ width: '90px', height: '16px' }} /></td>
                    <td></td>
                  </tr>
                ))
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                    No customers found.
                  </td>
                </tr>
              ) : filteredCustomers.map(cust => (
                <tr
                  key={cust._id}
                  className="cust-row"
                  onClick={() => setDrawerCustomer(cust)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div className="cust-cell">
                      <div className="c-avatar">{getInitials(cust.name)}</div>
                      <div>
                        <span className="cust-name">{cust.name}</span>
                        {cust.email && <span className="cust-email">{cust.email}</span>}
                      </div>
                    </div>
                  </td>
                  <td><span className="cust-phone">{cust.phone}</span></td>
                  <td>
                    <span className="cust-val-primary" style={{ maxWidth: 200, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cust.address || '—'}
                    </span>
                  </td>
                  <td>
                    <span className="cust-orders-badge">{cust.totalOrders}</span>
                  </td>
                  <td><span className="cust-val-primary" style={{ color: '#16a34a' }}>{formatCurrency(cust.lifetimeValue)}</span></td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="action-menu">
                      <button className="icon-btn" onClick={() => handleOpenModal(cust)} title="Edit" aria-label="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button className="icon-btn delete" onClick={() => setCustToDelete(cust)} title="Delete" aria-label="Delete">
                        <Trash2 size={16} />
                      </button>
                      <button className="icon-btn" onClick={() => setDrawerCustomer(cust)} title="View history" aria-label="View history">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS */}
        <div className="mobile-card-view">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="cust-card">
                <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                  <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                  <div className="skeleton" style={{ width: '120px', height: '20px' }} />
                </div>
                <div className="skeleton" style={{ width: '100%', height: '14px', marginBottom: '8px' }} />
                <div className="skeleton" style={{ width: '80%', height: '14px' }} />
              </div>
            ))
          ) : filteredCustomers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>No customers found.</div>
          ) : filteredCustomers.map(cust => (
            <div key={cust._id} className="cust-card" onClick={() => setDrawerCustomer(cust)} style={{ cursor: 'pointer' }}>
              <div className="cust-card-header">
                <div className="cust-cell">
                  <div className="c-avatar">{getInitials(cust.name)}</div>
                  <div>
                    <span className="cust-name">{cust.name}</span>
                    <span className="cust-email">{cust.phone}</span>
                  </div>
                </div>
                <div className="action-menu" onClick={e => e.stopPropagation()}>
                  <button className="icon-btn" onClick={() => handleOpenModal(cust)}><Edit2 size={16} /></button>
                  <button className="icon-btn delete" onClick={() => setCustToDelete(cust)}><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="cust-card-details">
                {cust.email && (
                  <div className="detail-row">
                    <span className="detail-label">Email</span>
                    <span className="detail-value" style={{ fontWeight: 400 }}>{cust.email}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="detail-label">Address</span>
                  <span className="detail-value" style={{ fontWeight: 400 }}>{cust.address || '—'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Orders</span>
                  <span className="detail-value">{cust.totalOrders}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Lifetime Value</span>
                  <span className="detail-value" style={{ color: '#16a34a' }}>{formatCurrency(cust.lifetimeValue)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Modals */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCustomer}
        initialData={editingCustomer}
      />

      <ConfirmDeleteModal
        isOpen={!!custToDelete}
        onClose={() => setCustToDelete(null)}
        onConfirm={handleDelete}
        itemName={custToDelete?.name}
      />

      <CustomerDrawer
        customer={drawerCustomer}
        onClose={() => setDrawerCustomer(null)}
        onEdit={(cust) => { handleOpenModal(cust); }}
        onOrderClick={(order) => setSelectedOrder(order)}
      />

      <OrderDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleOrderStatusChange}
        onMarkPaid={handleMarkPaid}
        onDuplicate={handleDuplicate}
      />

      <NewOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => {
          setIsOrderModalOpen(false);
          setDuplicateOrderData(null);
        }}
        initialData={duplicateOrderData}
      />
    </div>
  );
}
