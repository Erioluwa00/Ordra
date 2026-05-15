import React, { useState, useEffect } from 'react';
import { X, Star, MessageSquareHeart, Lightbulb, Bug } from 'lucide-react';
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import './FeedbackModal.css';

export default function FeedbackModal({ isOpen, onClose }) {
  const [type, setType] = useState('general_feedback');
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [message, setMessage] = useState('');
  const [businessHandle, setBusinessHandle] = useState('');
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  const [errorMsg, setErrorMsg] = useState('');

  const submitFeedbackMutation = useMutation(api.feedback.submitFeedback);

  useEffect(() => {
    if (isOpen) {
      setType('general_feedback');
      setRating(5);
      setHoveredRating(0);
      setMessage('');
      setBusinessHandle('');
      setStatus('idle');
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMsg('Please enter a message or feedback details.');
      return;
    }

    setStatus('submitting');
    setErrorMsg('');

    try {
      await submitFeedbackMutation({
        rating,
        type,
        message: message.trim(),
        businessHandle: businessHandle.trim() || undefined,
      });
      setStatus('success');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Feedback submission error:", err);
      setStatus('error');
      setErrorMsg('Failed to submit feedback. Please check your connection and try again.');
    }
  };

  const types = [
    { id: 'general_feedback', label: 'General Review', icon: <MessageSquareHeart size={15} /> },
    { id: 'feature_request', label: 'Feature Request', icon: <Lightbulb size={15} /> },
    { id: 'report_issue', label: 'Report Issue', icon: <Bug size={15} /> },
  ];

  return (
    <div className="modal-backdrop feedback-backdrop" onClick={onClose}>
      <div className="modal-content feedback-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2>Leave Feedback</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {status === 'success' ? (
          <div className="feedback-success-state">
            {/* <div className="success-icon-circle">🎉</div> */}
            <h3>Thank you for your feedback!</h3>
            <p>Your review helps us improve Ordra for small businesses everywhere.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="feedback-form">
            <div className="modal-body">
              {/* Type selector */}
              <div className="form-group">
                <label className="feedback-label">Category</label>
                <div className="feedback-type-pills">
                  {types.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      className={`feedback-type-pill ${type === t.id ? 'active' : ''}`}
                      onClick={() => setType(t.id)}
                    >
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Star Rating */}
              <div className="form-group">
                <label className="feedback-label">
                  Rating: <strong>{hoveredRating || rating} Stars</strong>
                </label>
                <div className="feedback-stars">
                  {[1, 2, 3, 4, 5].map(star => {
                    const isFilled = star <= (hoveredRating || rating);
                    return (
                      <button
                        key={star}
                        type="button"
                        className={`star-btn ${isFilled ? 'filled' : ''}`}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                      >
                        <Star size={24} fill={isFilled ? '#f59e0b' : 'none'} color={isFilled ? '#f59e0b' : 'var(--text-muted)'} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Message */}
              <div className="form-group">
                <label htmlFor="feedback-msg" className="feedback-label">
                  {type === 'report_issue' ? 'Describe the issue *' : type === 'feature_request' ? 'What feature would you like to see? *' : 'Your review or experience *'}
                </label>
                <textarea
                  id="feedback-msg"
                  className="form-input feedback-textarea"
                  placeholder={
                    type === 'report_issue'
                      ? 'Please provide details on what happened...'
                      : type === 'feature_request'
                      ? 'e.g. Integrate with simple logistics delivery partners...'
                      : 'e.g. Ordra has saved me so much time with customer tracking...'
                  }
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Handle (Optional) */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="business-handle" className="feedback-label">Business / Social Handle</label>
                  <span className="feedback-optional-badge">Free Exposure</span>
                </div>
                <input
                  id="business-handle"
                  type="text"
                  className="form-input"
                  placeholder="e.g. @stylebyamira (Instagram / Twitter)"
                  value={businessHandle}
                  onChange={e => setBusinessHandle(e.target.value)}
                />
                <p className="feedback-subtext">Leave your handle to be considered for our public "Trusted by Vendors" homepage feature!</p>
              </div>

              {errorMsg && <p className="form-error" style={{ marginTop: '1rem' }}>{errorMsg}</p>}
            </div>

            <div className="modal-footer">
              <button type="button" className="action-btn secondary" onClick={onClose} disabled={status === 'submitting'}>
                Cancel
              </button>
              <button type="submit" className="action-btn primary" disabled={status === 'submitting'}>
                {status === 'submitting' ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
