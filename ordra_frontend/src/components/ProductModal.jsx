import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { X, Tag, Package, CreditCard, CheckCircle2, History, TrendingUp, TrendingDown } from 'lucide-react';
import './ProductModal.css';

export default function ProductModal({ isOpen, onClose, onSave, initialData = null, categories = [] }) {
  const nameRef = useRef(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('0');
  const [errors, setErrors] = useState({});

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  
  const logs = useQuery(api.products.getProductLogs, 
    initialData?._id ? { productId: initialData._id } : "skip"
  );

  const relativeDate = (dateStr) => {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setCategory(initialData.category || categories[0] || 'General');
        setPrice(initialData.price || '');
        setQuantity(initialData.quantity !== undefined ? initialData.quantity : '0');
      } else {
        setName('');
        setCategory(categories.length > 0 ? categories[0] : 'General');
        setPrice('');
        setQuantity('0');
      }
      setIsCustomCategory(categories.length === 0);
      setErrors({});
      setTimeout(() => nameRef.current?.focus(), 100);
    }
  }, [isOpen, initialData, categories]);

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Product name is required';
    if (!category.trim()) e.category = 'Category is required';
    if (!price || isNaN(price)) e.price = 'Valid price is required';
    if (quantity === '' || isNaN(quantity)) e.quantity = 'Quantity is required';
    return e;
  };

  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const payload = {
      name: capitalize(name.trim()),
      category: capitalize(category.trim()),
      price: Number(price),
      quantity: Number(quantity),
      inStock: Number(quantity) > 0
    };

    if (initialData?._id) {
      payload._id = initialData._id;
    }

    onSave(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="p-modal-backdrop" onClick={onClose}>
      <div className="p-modal-content" onClick={e => e.stopPropagation()}>
        <div className="p-modal-header">
          <div className="p-modal-header-left">
            <div className="p-modal-icon"><Package size={20} /></div>
            <div>
              <h2 className="p-modal-title">{initialData ? 'Edit Product' : 'Add New Product'}</h2>
              <p className="p-modal-subtitle">Define your item details and pricing</p>
            </div>
          </div>
          <button className="p-modal-close" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-modal-form">
          <div className="p-modal-body">
            <div className="p-form-group">
              <label className="p-form-label"><Tag size={14} /> <span>Product Name</span></label>
              <input
                ref={nameRef}
                type="text"
                className={`p-form-input ${errors.name ? 'error' : ''}`}
                placeholder="e.g. Vanilla Sponge Cake"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              {errors.name && <p className="p-form-error">{errors.name}</p>}
            </div>

            <div className="p-form-row">
              <div className="p-form-group">
                <label className="p-form-label"><Package size={14} /> <span>Category</span></label>
                {isCustomCategory ? (
                   <input 
                     autoFocus
                     type="text"
                     className={`p-form-input ${errors.category ? 'error' : ''}`}
                     placeholder="Type custom category..."
                     value={category}
                     onChange={e => setCategory(e.target.value)}
                   />
                ) : (
                  <select 
                    className="p-form-input"
                    value={category}
                    onChange={e => {
                      if (e.target.value === '___NEW___') {
                        setIsCustomCategory(true);
                        setCategory('');
                      } else {
                        setCategory(e.target.value);
                      }
                    }}
                  >
                    {categories.length === 0 && <option value="" disabled>Select category...</option>}
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="___NEW___">+ Add New Category</option>
                  </select>
                )}
                {errors.category && <p className="p-form-error">{errors.category}</p>}
              </div>

              <div className="p-form-group">
                <label className="p-form-label"><CreditCard size={14} /> <span>Price (₦)</span></label>
                <input
                  type="number"
                  className={`p-form-input ${errors.price ? 'error' : ''}`}
                  placeholder="0.00"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                />
                {errors.price && <p className="p-form-error">{errors.price}</p>}
              </div>

              <div className="p-form-group">
                <label className="p-form-label"><Package size={14} /> <span>Initial Stock</span></label>
                <input
                  type="number"
                  className={`p-form-input ${errors.quantity ? 'error' : ''}`}
                  placeholder="0"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                />
                {errors.quantity && <p className="p-form-error">{errors.quantity}</p>}
              </div>
            </div>

            {/* Inventory History Section */}
            {initialData && (
              <div className="p-history-section">
                <div className="p-history-header">
                  <History size={16} />
                  <span>Stock History</span>
                </div>
                
                <div className="p-history-list">
                  {!logs ? (
                    <div className="p-history-loading">Loading history...</div>
                  ) : logs.length === 0 ? (
                    <div className="p-history-empty">No activity recorded yet.</div>
                  ) : (
                    logs.map((log) => (
                      <div key={log._id} className="p-history-item">
                        <div className={`p-history-indicator ${log.quantityChange > 0 ? 'up' : 'down'}`}>
                          {log.quantityChange > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        </div>
                        <div className="p-history-details">
                          <div className="p-history-main">
                            <span className="p-history-reason">{log.reason}</span>
                            <span className={`p-history-change ${log.quantityChange > 0 ? 'pos' : 'neg'}`}>
                              {log.quantityChange > 0 ? '+' : ''}{log.quantityChange}
                            </span>
                          </div>
                          <div className="p-history-meta">
                            {log.type} • {relativeDate(log.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="p-modal-footer">
            <button type="button" className="p-btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="p-btn-primary">
              <CheckCircle2 size={18} />
              <span>{initialData ? 'Save Changes' : 'Create Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
