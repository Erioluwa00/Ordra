import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './CustomerModal.css';

export default function CustomerModal({ isOpen, onClose, onSave, initialData }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setForm({
          name: initialData.name || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          address: initialData.address || '',
          notes: initialData.notes || ''
        });
      } else {
        setForm({ name: '', email: '', phone: '', address: '', notes: '' });
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(er => ({ ...er, [name]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) {
      setErrors(e2);
      return;
    }
    const capitalizedName = form.name.trim().split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
    onSave({ ...form, name: capitalizedName });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initialData ? 'Edit Customer' : 'Add New Customer'}</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                id="name" name="name" type="text"
                className={`form-input${errors.name ? ' error' : ''}`}
                placeholder="e.g. Sarah Jenkins"
                value={form.name} onChange={handleChange}
              />
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  id="phone" name="phone" type="tel"
                  className={`form-input${errors.phone ? ' error' : ''}`}
                  placeholder="e.g. 08012345678"
                  value={form.phone} onChange={handleChange}
                />
                {errors.phone && <p className="form-error">{errors.phone}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address (Optional)</label>
                <input
                  id="email" name="email" type="email"
                  className="form-input"
                  placeholder="e.g. sarah@example.com"
                  value={form.email} onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="address">Delivery Address (Optional)</label>
              <input
                id="address" name="address" type="text"
                className="form-input"
                placeholder="e.g. 12 Admiralty Way, Lekki Phase 1"
                value={form.address} onChange={handleChange}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="notes">Customer Notes (Internal Context)</label>
              <textarea
                id="notes" name="notes"
                className="form-input"
                style={{ height: '80px', resize: 'none' }}
                placeholder="e.g. VIP, always pays on time, prefers morning delivery..."
                value={form.notes} onChange={handleChange}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="action-btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="action-btn primary">
              {initialData ? 'Save Changes' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
