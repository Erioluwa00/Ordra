import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  X, Plus, Trash2, MessageCircle,
  ChevronDown, CheckCircle2, AlertCircle, Package,
  User, MapPin, CreditCard, Zap, Tag, Calendar, Flag, Globe
} from 'lucide-react';
import './NewOrderModal.css';
import { useProducts } from '../context/ProductContext';
import { useOffline } from '../context/OfflineContext';
import { db, saveOrderToCache, addToSyncQueue } from '../lib/db';

// ── Helpers ─────────────────────────────────────────────────────────────────
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

const formatCurrency = (val) => {
  const num = Number(String(val).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return '₦0';
  return '₦' + num.toLocaleString('en-NG');
};

const STATUS_OPTIONS = [
  { value: 'new', label: 'New', color: '#6366f1' },
  { value: 'processing', label: 'Processing', color: '#2563eb' },
  { value: 'ready', label: 'Ready', color: '#7c3aed' },
  { value: 'delivered', label: 'Delivered', color: '#16a34a' },
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444' },
];

const COUNTRY_CODES = [
  { code: '234', label: '🇳🇬 +234' },
  { code: '233', label: '🇬🇭 +233' },
  { code: '44', label: '🇬🇧 +44' },
  { code: '1', label: '🇺🇸 +1' },
  { code: '27', label: '🇿🇦 +27' },
  { code: '254', label: '🇰🇪 +254' },
  { code: '971', label: '🇦🇪 +971' },
  { code: '256', label: '🇺🇬 +256' },
];

export default function NewOrderModal({ isOpen, onClose, initialData = null }) {
  const { isOnline, refreshPending } = useOffline();
  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  const { products } = useProducts();

  // ── Mutations & Queries
  const createOrder = useMutation(api.orders.createOrder);
  const updateOrder = useMutation(api.orders.updateOrder);
  const customers = useQuery(api.orders.getCustomers);

  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [countryCode, setCountryCode] = useState('234');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCustId, setSelectedCustId] = useState(null); // Tracks if we've "locked in" an existing customer

  const [items, setItems] = useState([{ id: Date.now(), desc: '', qty: 1, price: '' }]);
  const [activeCatalogRow, setActiveCatalogRow] = useState(null);
  const [deliveryAddr, setDeliveryAddr] = useState('');
  const [orderSource, setOrderSource] = useState('whatsapp');
  const [orderStatus, setOrderStatus] = useState('new');
  const [paymentStatus, setPaymentStatus] = useState('unpaid');
  const [amountPaid, setAmountPaid] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEditing = initialData && initialData._id && !initialData.isDuplicate;

  const suggestionRef = useRef(null);

  // ── Derived
  const subtotal = items.reduce((acc, it) => {
    const p = Number(String(it.price).replace(/[^0-9.]/g, '')) || 0;
    return acc + p * (Number(it.qty) || 1);
  }, 0);

  // Suggestions logic
  const suggestions = useMemo(() => {
    if (!custName.trim() || !customers || selectedCustId) return [];
    const query = custName.toLowerCase();
    return customers
      .filter(c => c.name.toLowerCase().includes(query) || c.phone.includes(query))
      .slice(0, 5);
  }, [custName, customers, selectedCustId]);

  const selectCustomer = (customer) => {
    setCustName(customer.name);
    setCustPhone(customer.phone);
    if (customer.address) setDeliveryAddr(customer.address);
    setSelectedCustId(customer._id);
    setShowSuggestions(false);
  };

  // Handle click outside for suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setCustName(initialData.customer || '');
        setCustPhone(initialData.customerPhone || '');
        setDeliveryAddr(initialData.deliveryAddress || '');
        setOrderSource(initialData.source || 'whatsapp');
        setOrderStatus((initialData.status || 'new').toLowerCase());
        setPaymentStatus(initialData.paymentStatus || 'unpaid');
        setAmountPaid(String(initialData.amountPaid || ''));
        setNotes(initialData.notes || '');
        setDeliveryDate(initialData.deliveryDate || '');
        setIsUrgent(!!initialData.isUrgent);
        
        // For duplicates/edits, we don't necessarily lock the ID unless we match it
        setSelectedCustId(null);
        if (initialData.items) {
          setItems(initialData.items.map((it, idx) => ({
            id: Date.now() + idx,
            productId: it.productId,
            desc: it.desc || '',
            qty: it.qty || 1,
            price: String(it.price || '')
          })));
        }
      } else {
        setCustName('');
        setCustPhone('');
        setSelectedCustId(null);
        setItems([{ id: Date.now(), desc: '', qty: 1, price: '' }]);
        setDeliveryAddr('');
        setOrderSource('whatsapp');
        setOrderStatus('new');
        setPaymentStatus('unpaid');
        setAmountPaid('');
        setDeliveryDate('');
        setIsUrgent(false);
        setNotes('');
      }
      setErrors({});
      setSubmitted(false);
      setSaving(false);
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [isOpen, initialData]);

  const updateItem = (id, field, val) => {
    setItems(p => p.map(it => {
      if (it.id === id) {
        const updated = { ...it, [field]: val };
        // If they manually edit description, clear productId unless they pick a suggestion
        if (field === 'desc') updated.productId = undefined;
        return updated;
      }
      return it;
    }));
  };

  const selectProduct = (itemId, product) => {
    setItems(p => p.map(it => it.id === itemId ? {
      ...it,
      productId: product._id,
      desc: product.name,
      price: String(product.price)
    } : it));
    setActiveCatalogRow(null);
  };

  const togglePayment = (val) => {
    setPaymentStatus(val);
    if (val === 'paid') setAmountPaid(String(subtotal));
    if (val === 'unpaid') setAmountPaid('');
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setSubmitted(true);
    const e = {};
    if (!custName.trim()) e.custName = 'Customer name is required';
    if (!custPhone.trim()) e.custPhone = 'Phone number is required';
    if (!items.some(it => it.desc.trim())) e.items = 'Add at least one item';

    if (Object.keys(e).length) { setErrors(e); return; }

    const capitalizedName = custName.trim().split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');

    let finalPhone = custPhone.trim();
    const isSocialHandle = finalPhone.startsWith('@') || /[a-zA-Z]/.test(finalPhone);
    
    // International formatting for phone numbers
    if (!isSocialHandle && /^\d+$/.test(finalPhone)) {
      if (finalPhone.startsWith('0')) {
        finalPhone = countryCode + finalPhone.slice(1);
      } else if (!finalPhone.startsWith(countryCode)) {
        finalPhone = countryCode + finalPhone;
      }
    }

    setSaving(true);
    try {
      const orderPayload = {
        customerName: capitalizedName,
        customerPhone: finalPhone,
        items: items.filter(it => it.desc.trim()).map(it => ({
          productId: it.productId,
          desc: it.desc,
          qty: Number(it.qty),
          price: Number(it.price)
        })),
        total: subtotal,
        amountPaid: Number(amountPaid) || 0,
        paymentStatus,
        status: orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1),
        deliveryAddress: deliveryAddr || '—',
        notes,
        deliveryDate: deliveryDate || undefined,
        isUrgent: isUrgent || undefined,
        source: orderSource,
      };

      if (isOnline) {
        if (isEditing) {
          await updateOrder({
            orderId: initialData._id,
            ...orderPayload
          });
        } else {
          await createOrder(orderPayload);
        }
      } else {
        // OFFLINE MODE
        const tempId = `OFFLINE-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        const offlineOrder = {
          ...orderPayload,
          _id: tempId,
          orderId: tempId,
          customer: capitalizedName,
          item: orderPayload.items[0]?.desc || 'Multiple items',
          createdAt: new Date().toISOString(),
          isOffline: true
        };

        // 1. Save to local cache so it appears in the list immediately
        await saveOrderToCache(offlineOrder);
        
        // 2. Add to sync queue (include tempId for cleanup)
        await addToSyncQueue(isEditing ? 'UPDATE_ORDER' : 'CREATE_ORDER', 
          isEditing 
            ? { orderId: initialData._id, ...orderPayload, tempId } 
            : { ...orderPayload, tempId }
        );

        // 3. Trigger UI update for sync indicator
        refreshPending();
        
        console.log(`[Offline] Order ${tempId} saved locally and queued for sync.`);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save order. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const openWhatsApp = () => {
    if (!custPhone) return;
    const clean = custPhone.replace(/\D/g, '');
    const intl = clean.startsWith('0') ? countryCode + clean.slice(1) : clean;
    const itemLines = items.filter(it => it.desc.trim())
      .map(it => `• ${it.desc} × ${it.qty} — ${formatCurrency(Number(it.price || 0) * Number(it.qty))}`)
      .join('\n');
    const msg = encodeURIComponent(
      `Hello ${custName}! 👋 Here's your order summary:\n\n${itemLines}\n\nTotal: ${formatCurrency(subtotal)}\nPayment: ${paymentStatus === 'paid' ? '✅ Paid' : '⏳ Pending'}\n\nThank you!`
    );
    window.open(`https://wa.me/${intl}?text=${msg}`, '_blank');
  };

  if (!isOpen) return null;

  const selectedStatus = STATUS_OPTIONS.find(s => s.value === orderStatus);

  return (
    <div className="nom-backdrop" onClick={onClose}>
      <div className="nom-sheet" onClick={e => e.stopPropagation()}>
        <div className="nom-header">
          <div className="nom-header-left">
            <div className="nom-header-icon"><Zap size={18} /></div>
            <div>
              <h2 className="nom-title">{isEditing ? 'Edit Order' : 'New Order'}</h2>
              <p className="nom-subtitle">{isEditing ? `Updating ${initialData.orderId}` : 'Fill in the details below'}</p>
            </div>
          </div>
          <button className="nom-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', flex: '1 1 0', minHeight: 0 }}>
          <div className="nom-body">
            <section className="nom-section">
              <div className="nom-section-label">
                <User size={14} /><span>Customer & Source</span>
              </div>
              <div className="nom-form-group nom-name-wrap" ref={suggestionRef}>
                <input
                  ref={nameRef}
                  type="text"
                  className={`nom-input${errors.custName ? ' error' : ''}${selectedCustId ? ' nom-input--linked' : ''}`}
                  placeholder="Customer name *"
                  value={custName}
                  autoComplete="off"
                  onFocus={() => !selectedCustId && setShowSuggestions(true)}
                  onChange={e => {
                    setCustName(e.target.value);
                    setSelectedCustId(null);
                    setShowSuggestions(true);
                  }}
                />
                {selectedCustId && (
                  <div className="nom-linked-badge">
                    <CheckCircle2 size={12} /> Returning
                  </div>
                )}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="nom-suggestions">
                    {suggestions.map(c => (
                      <div key={c._id} className="nom-suggestion-item" onClick={() => selectCustomer(c)}>
                        <div className="nom-suggestion-avatar">{getInitials(c.name)}</div>
                        <div className="nom-suggestion-info">
                          <span className="nom-suggestion-name">{c.name}</span>
                          <span className="nom-suggestion-phone">{c.phone}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {errors.custName && <p className="nom-error">{errors.custName}</p>}
              </div>

              <div className="nom-source-row">
                <div className="nom-form-group">
                  <div className="nom-phone-wrap">
                    {!custPhone.startsWith('@') && !/[a-zA-Z]/.test(custPhone) && (
                      <div className="nom-country-picker">
                        <select 
                          value={countryCode} 
                          onChange={e => setCountryCode(e.target.value)}
                          className="nom-country-select"
                        >
                          {COUNTRY_CODES.map(c => (
                            <option key={c.code} value={c.code}>{c.label}</option>
                          ))}
                        </select>
                        <ChevronDown size={12} className="nom-country-chevron" />
                      </div>
                    )}
                    <input
                      ref={phoneRef}
                      type="text"
                      className={`nom-input${errors.custPhone ? ' error' : ''}${selectedCustId ? ' nom-input--linked' : ''}`}
                      placeholder={custPhone.startsWith('@') ? "@handle" : "Phone or @handle *"}
                      value={custPhone}
                      autoComplete="off"
                      onChange={e => {
                        setCustPhone(e.target.value);
                        setSelectedCustId(null);
                        if (submitted) setErrors(e => ({ ...e, custPhone: null }));
                      }}
                    />
                  </div>
                  {errors.custPhone && <p className="nom-error">{errors.custPhone}</p>}
                </div>

                <div className="nom-form-group">
                  <div className="nom-select-wrap">
                    <select 
                      className="nom-input nom-select" 
                      value={orderSource} 
                      onChange={e => setOrderSource(e.target.value)}
                      style={{ paddingLeft: '32px' }}
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok</option>
                      <option value="facebook">Facebook</option>
                      <option value="physical">In-Store</option>
                      <option value="other">Other</option>
                    </select>
                    <Globe size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <ChevronDown size={14} className="nom-select-chevron" />
                  </div>
                </div>
              </div>
            </section>


            <section className="nom-section">
              <div className="nom-section-label">
                <Package size={14} /><span>Order Items</span>
              </div>
              <div className="nom-items-list">
                {items.map((item, idx) => (
                  <div key={item.id} className="nom-item-row-wrapper">
                    <div className="nom-item-row">
                      <div className="nom-item-desc-wrap">
                        <input
                          type="text"
                          className="nom-input"
                          placeholder="Item description"
                          value={item.desc}
                          onFocus={() => setActiveCatalogRow(item.id)}
                          onChange={e => {
                            updateItem(item.id, 'desc', e.target.value);
                            setActiveCatalogRow(item.id);
                          }}
                        />
                        {activeCatalogRow === item.id && item.desc.length > 0 && products?.filter(p => p.name.toLowerCase().includes(item.desc.toLowerCase())).length > 0 && (
                          <div className="nom-catalog-suggestions">
                            {products
                              .filter(p => p.name.toLowerCase().includes(item.desc.toLowerCase()))
                              .slice(0, 5)
                              .map(p => (
                                <div key={p._id} className="nom-catalog-item" onClick={() => selectProduct(item.id, p)}>
                                  <div className="nom-cat-info">
                                    <span className="nom-cat-name">{p.name}</span>
                                    <span className="nom-cat-price">{formatCurrency(p.price)}</span>
                                  </div>
                                  <span className={`nom-cat-stock ${p.quantity <= 0 ? 'out' : p.quantity < 5 ? 'low' : ''}`}>
                                    {p.quantity <= 0 ? (p.quantity === 0 ? 'Out' : `${Math.abs(p.quantity)} Owed`) : `${p.quantity} left`}
                                  </span>
                                </div>
                              ))
                            }
                          </div>
                        )}
                      </div>
                      <input
                        type="number" min="1"
                        className="nom-input nom-qty"
                        value={item.qty}
                        onChange={e => updateItem(item.id, 'qty', e.target.value)}
                      />
                      <div className="nom-price-wrap">
                        <span className="nom-price-prefix">₦</span>
                        <input
                          type="number" min="0"
                          className="nom-input nom-price-input"
                          value={item.price}
                          onChange={e => updateItem(item.id, 'price', e.target.value)}
                        />
                      </div>
                      {items.length > 1 && (
                        <button type="button" className="nom-remove-item" onClick={() => setItems(items.filter(it => it.id !== item.id))}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" className="nom-add-item-btn" onClick={() => setItems([...items, { id: Date.now(), desc: '', qty: 1, price: '' }])}>
                <Plus size={14} /> Add Item
              </button>
              {errors.items && (
                <div className="nom-item-error-banner">
                  <AlertCircle size={14} />
                  <span>{errors.items}</span>
                </div>
              )}
              {subtotal > 0 && (
                <div className="nom-subtotal">
                  <span>Order Total</span>
                  <span className="nom-subtotal-val">{formatCurrency(subtotal)}</span>
                </div>
              )}
            </section>

            <section className="nom-section">
              <div className="nom-two-col">
                <div className="nom-form-group">
                  <div className="nom-section-label"><CreditCard size={14} /><span>Payment</span></div>
                  <div className="nom-toggle-group">
                    <button type="button" className={`nom-toggle${paymentStatus === 'unpaid' ? ' active unpaid' : ''}`} onClick={() => togglePayment('unpaid')}>Unpaid</button>
                    <button type="button" className={`nom-toggle${paymentStatus === 'partial' ? ' active partial' : ''}`} onClick={() => togglePayment('partial')}>Partial</button>
                    <button type="button" className={`nom-toggle${paymentStatus === 'paid' ? ' active paid' : ''}`} onClick={() => togglePayment('paid')}>Paid</button>
                  </div>
                  {paymentStatus === 'partial' && (
                    <div className="nom-price-wrap" style={{ marginTop: '0.6rem' }}>
                      <span className="nom-price-prefix">₦</span>
                      <input
                        type="number" min="0"
                        className="nom-input nom-price-input"
                        placeholder="Amount paid"
                        value={amountPaid}
                        onChange={e => setAmountPaid(e.target.value)}
                      />
                    </div>
                  )}
                </div>
                <div className="nom-form-group">
                  <div className="nom-section-label"><Zap size={14} /><span>Status</span></div>
                  <select className="nom-select" value={orderStatus} onChange={e => setOrderStatus(e.target.value)}>
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.label}>{s.label}</option>)}
                  </select>
                </div>
              </div>
            </section>

            <section className="nom-section">
              <div className="nom-section-label">
                <Calendar size={14} /><span>Priority & Delivery</span>
              </div>
              <div className="nom-two-col">
                <div className="nom-form-group">
                  <span className="nom-field-sub">Desired Delivery Date</span>
                  <div className="nom-date-input-wrap">
                    <Calendar size={16} className="nom-date-icon" />
                    <input
                      type="date"
                      className="nom-input nom-date-input"
                      value={deliveryDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setDeliveryDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="nom-form-group">
                  <span className="nom-field-sub">Order Urgency</span>
                  <label className={`nom-urgent-toggle ${isUrgent ? 'active' : ''}`}>
                    <input
                      type="checkbox"
                      checked={isUrgent}
                      onChange={e => setIsUrgent(e.target.checked)}
                      className="nom-hidden-checkbox"
                    />
                    <div className="nom-toggle-inner">
                      <Flag size={14} />
                      <span>{isUrgent ? 'Marked as Urgent' : 'Normal Priority'}</span>
                    </div>
                  </label>
                </div>
              </div>
            </section>

            <section className="nom-section nom-section--last">
              <div className="nom-form-group">
                <div className="nom-section-label"><MapPin size={14} /><span>Delivery Address</span></div>
                <input
                  type="text" className="nom-input"
                  placeholder="e.g. 12 Admiralty Way, Lekki"
                  value={deliveryAddr}
                  onChange={e => setDeliveryAddr(e.target.value)}
                />
              </div>
              <div className="nom-form-group" style={{ marginBottom: 0 }}>
                <div className="nom-section-label" style={{ marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Notes (optional)</span>
                </div>
                <textarea
                  className="nom-input nom-textarea"
                  placeholder="Any special instructions..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </section>
          </div>

          <div className="nom-footer">
            <button type="button" className="nom-wa-btn" onClick={openWhatsApp} disabled={!custPhone}>
              <MessageCircle size={16} /><span>WhatsApp</span>
            </button>
            <div className="nom-footer-right">
              <button type="button" className="action-btn secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="action-btn primary nom-submit" disabled={saving}>
                {saving ? <div className="spinner" /> : <>{isEditing ? <><CheckCircle2 size={16} /> Save Changes</> : <><Plus size={16} /> Create Order</>}</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
