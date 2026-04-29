import React from 'react';
import { AlertCircle, X, Trash2 } from 'lucide-react';
import './ConfirmDeleteModal.css';

export default function ConfirmDeleteModal({ isOpen, onClose, onConfirm, itemName }) {
  if (!isOpen) return null;

  return (
    <div className="cd-modal-backdrop" onClick={onClose}>
      <div className="cd-modal-content" onClick={e => e.stopPropagation()}>
        <button className="cd-modal-close" onClick={onClose}><X size={20} /></button>
        
        <div className="cd-modal-icon-wrap">
          <div className="cd-modal-icon">
            <AlertCircle size={28} />
          </div>
        </div>

        <h3 className="cd-modal-title">Delete Product</h3>
        <p className="cd-modal-text">
          Are you sure you want to delete <strong>{itemName}</strong>? This action cannot be undone.
        </p>

        <div className="cd-modal-actions">
          <button className="cd-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="cd-btn-delete" onClick={onConfirm}>
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
