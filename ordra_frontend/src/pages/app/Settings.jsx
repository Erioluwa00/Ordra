import React, { useState, useEffect } from 'react';
import { 
  User, Palette, CreditCard, Bell, MessageSquare, 
  Shield, Save, Trash2, Check, Globe, Zap, Clock, Archive
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import './Settings.css';

export default function Settings() {
  const { user } = useAuth();
  const { theme: globalTheme, setTheme } = useTheme();
  
  const liveSettings = useQuery(api.settings.getSettings);
  const updateSettings = useMutation(api.settings.updateSettings);

  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState(null); // Local state for form editing
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Initialize local state when settings load from Convex
  useEffect(() => {
    if (liveSettings) {
      // Create a clean object without _id or _creationTime for the mutation to accept
      const { _id, _creationTime, userId, ...clean } = liveSettings;
      setSettings(prev => prev ? prev : clean);
    }
  }, [liveSettings]);

  if (!liveSettings || !settings) {
    return (
      <div className="settings-container">
        <div className="page-header">
           <div className="skeleton" style={{ width: '200px', height: '32px', marginBottom: '8px' }} />
           <div className="skeleton" style={{ width: '300px', height: '16px' }} />
        </div>
        <div className="settings-grid">
           <div className="skeleton" style={{ width: '100%', height: '400px', borderRadius: '16px' }} />
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = value;
    
    if (type === 'checkbox') {
      finalValue = checked;
    } else if (type === 'number') {
      finalValue = value === '' ? 0 : Number(value);
    }

    setSettings(prev => ({
      ...prev,
      [name]: finalValue
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(settings);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);
    } catch (err) {
      alert("Failed to save settings: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const navItems = [
    { id: 'profile',   label: 'Profile',    icon: <User size={18} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
    { id: 'templates',  label: 'Templates',  icon: <MessageSquare size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'stockpile',  label: 'Stockpile',  icon: <Archive size={18} /> },
    { id: 'account',    label: 'Security',   icon: <Shield size={18} /> },
  ];

  return (
    <div className="settings-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your business and app preferences</p>
        </div>
        <div className="page-actions">
          <button 
            className={`save-btn ${showSaved ? 'saved' : ''}`} 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : showSaved ? <><Check size={18} /> Saved</> : <><Save size={18} /> Save Changes</>}
          </button>
        </div>
      </div>

      <div className="settings-grid">
        {/* ── Sidebar ── */}
        <nav className="settings-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`settings-nav-btn ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* ── Content ── */}
        <div className="settings-content">
          
          {/* PROFILE SECTION */}
          {activeTab === 'profile' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <h2 className="settings-card-title"><User size={20} /> Business Profile</h2>
                <p className="settings-card-subtitle">Your basic account and business information</p>
              </div>
              <div className="form-section">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    className="settings-input" 
                    type="text" 
                    name="userName"
                    value={user?.name || ''} 
                    disabled 
                    title="Managed by your login provider"
                  />
                  <p className="settings-card-subtitle" style={{fontSize: '0.75rem'}}>Changeable in your Google/Account security</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Business Name</label>
                  <input 
                    className="settings-input" 
                    type="text" 
                    name="businessName"
                    placeholder="e.g. Sarah's Pottery"
                    value={settings.businessName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input 
                    className="settings-input" 
                    type="tel" 
                    name="phone"
                    placeholder="e.g. 08012345678"
                    value={settings.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    className="settings-input" 
                    type="email" 
                    value={user?.email || ''} 
                    disabled 
                  />
                </div>
              </div>
            </div>
          )}

          {/* APPEARANCE SECTION */}
          {activeTab === 'appearance' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <h2 className="settings-card-title"><Palette size={20} /> Personalization</h2>
                <p className="settings-card-subtitle">Customize how the app looks and feels</p>
              </div>
              <div className="form-section">
                <div className="form-group">
                  <label className="form-label">App Theme</label>
                  <div className="theme-grid">
                    <div 
                      className={`theme-option ${settings.theme === 'light' ? 'active' : ''}`}
                      onClick={() => {
                        setSettings(s => ({ ...s, theme: 'light' }));
                        setTheme('light');
                      }}
                    >
                      <div className="theme-preview light"></div>
                      <span className="theme-name">Light</span>
                    </div>
                    <div 
                      className={`theme-option ${settings.theme === 'dark' ? 'active' : ''}`}
                      onClick={() => {
                        setSettings(s => ({ ...s, theme: 'dark' }));
                        setTheme('dark');
                      }}
                    >
                      <div className="theme-preview dark"></div>
                      <span className="theme-name">Dark</span>
                    </div>
                    <div 
                      className={`theme-option ${settings.theme === 'system' ? 'active' : ''}`}
                      onClick={() => {
                        setSettings(s => ({ ...s, theme: 'system' }));
                        setTheme('system');
                      }}
                    >
                      <div className="theme-preview system"></div>
                      <span className="theme-name">System</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MESSAGE TEMPLATES */}
          {activeTab === 'templates' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <h2 className="settings-card-title"><MessageSquare size={20} /> Message Templates</h2>
                <p className="settings-card-subtitle">Personalize the messages you send to customers on WhatsApp</p>
              </div>
              <div className="form-section">
                
                {/* Order Confirmation */}
                <div className="template-editor-group">
                  <div className="template-edit-pane">
                    <label className="form-label">Order Confirmation</label>
                    <textarea 
                      className="settings-input settings-textarea" 
                      name="templateConfirmation"
                      id="templateConfirmation"
                      value={settings.templateConfirmation}
                      onChange={handleChange}
                      placeholder="Hi {{name}}, your order..."
                    />
                    <div className="template-tags">
                      {['{{name}}', '{{id}}', '{{total}}'].map(tag => (
                        <button 
                          key={tag} 
                          className="tag-badge-btn"
                          onClick={() => {
                            const el = document.getElementById('templateConfirmation');
                            const start = el.selectionStart;
                            const end = el.selectionEnd;
                            const text = settings.templateConfirmation;
                            const next = text.substring(0, start) + tag + text.substring(end);
                            setSettings(s => ({ ...s, templateConfirmation: next }));
                            setTimeout(() => {
                              el.focus();
                              el.setSelectionRange(start + tag.length, start + tag.length);
                            }, 10);
                          }}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="template-preview-pane">
                    <span className="preview-label">Live Preview</span>
                    <div className="wa-bubble">
                      {settings.templateConfirmation
                        .replace(/\{\{name\}\}/g, 'John Doe')
                        .replace(/\{\{id\}\}/g, 'ORD-123')
                        .replace(/\{\{total\}\}/g, '₦15,000') || 'Start typing to see preview...'}
                    </div>
                  </div>
                </div>

                <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '1rem 0' }} />

                {/* Payment Reminder */}
                <div className="template-editor-group">
                  <div className="template-edit-pane">
                    <label className="form-label">Payment Reminder</label>
                    <textarea 
                      className="settings-input settings-textarea" 
                      name="templateReminder"
                      id="templateReminder"
                      value={settings.templateReminder}
                      onChange={handleChange}
                    />
                    <div className="template-tags">
                      {['{{name}}', '{{id}}', '{{balance}}'].map(tag => (
                        <button 
                          key={tag} 
                          className="tag-badge-btn"
                          onClick={() => {
                            const el = document.getElementById('templateReminder');
                            const start = el.selectionStart;
                            const end = el.selectionEnd;
                            const text = settings.templateReminder;
                            const next = text.substring(0, start) + tag + text.substring(end);
                            setSettings(s => ({ ...s, templateReminder: next }));
                            setTimeout(() => {
                              el.focus();
                              el.setSelectionRange(start + tag.length, start + tag.length);
                            }, 10);
                          }}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="template-preview-pane">
                    <span className="preview-label">Live Preview</span>
                    <div className="wa-bubble">
                      {settings.templateReminder
                        .replace(/\{\{name\}\}/g, 'John Doe')
                        .replace(/\{\{id\}\}/g, 'ORD-123')
                        .replace(/\{\{balance\}\}/g, '₦5,200') || 'Start typing to see preview...'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="template-notice-box">
                 <p className="template-notice-text">
                    <Zap size={16} /> 
                    <span>These placeholders (like <strong>{"{{name}}"}</strong>) are automatically replaced with real customer details when you send a message.</span>
                 </p>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <h2 className="settings-card-title"><Bell size={20} /> Notifications</h2>
                <p className="settings-card-subtitle">Choose what you want to be notified about</p>
              </div>
              <div className="form-section">

                {/* ── Inventory Alerts ── */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <p className="form-label" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 700 }}>
                    <Zap size={13} /> Inventory Alerts
                  </p>
                  <div className="form-group">
                    <label className="form-label">Low Stock Alert Threshold</label>
                    <p className="settings-card-subtitle" style={{ marginBottom: '0.6rem' }}>
                      Get a notification when a product's stock drops to or below this number of units.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <input
                        className="settings-input"
                        type="number"
                        min="1"
                        max="100"
                        name="lowStockThreshold"
                        value={settings.lowStockThreshold ?? 5}
                        onChange={handleChange}
                        style={{ maxWidth: '120px' }}
                      />
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>units</span>
                    </div>
                  </div>
                </div>

                <div style={{ height: '1px', background: 'var(--border-subtle)', marginBottom: '1.5rem' }} />

                {/* ── Push / Summary Toggles ── */}
                <p className="form-label" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 700 }}>
                  <Bell size={13} /> Alert Preferences
                </p>

                <div className="toggle-group">
                  <div className="toggle-info">
                    <span className="toggle-label">Payment Reminders</span>
                    <span className="toggle-desc">Get alerted for overdue payments from customers.</span>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      name="notifyPayments"
                      checked={settings.notifyPayments}
                      onChange={handleChange}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="toggle-group">
                  <div className="toggle-info">
                    <span className="toggle-label">Daily Summary</span>
                    <span className="toggle-desc">A morning overview of your orders and revenue.</span>
                  </div>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      name="notifySummary"
                      checked={settings.notifySummary}
                      onChange={handleChange}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}


          {/* STOCKPILE SETTINGS */}
          {activeTab === 'stockpile' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <h2 className="settings-card-title"><Archive size={20} /> Stockpile Notices</h2>
                <p className="settings-card-subtitle">Configure when orders are flagged as stockpiling and customize the pickup reminder message sent to customers.</p>
              </div>
              <div className="form-section">
                <div className="form-group">
                  <label className="form-label">Stockpile Threshold (Days)</label>
                  <p className="settings-card-subtitle" style={{ marginBottom: '0.6rem' }}>
                    Flag a paid, uncollected order as "stockpiling" after this many days.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input
                      className="settings-input"
                      type="number"
                      min="1"
                      max="60"
                      name="stockpileDays"
                      value={settings.stockpileDays ?? 7}
                      onChange={handleChange}
                      style={{ maxWidth: '120px' }}
                    />
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>days after order is placed</span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Pickup Reminder Template</label>
                  <textarea
                    className="settings-input settings-textarea"
                    name="templateStockpile"
                    value={settings.templateStockpile ?? ''}
                    onChange={handleChange}
                  />
                  <div className="template-tags">
                    <span className="tag-badge">{"{{name}}"}</span>
                    <span className="tag-badge">{"{{id}}"}</span>
                    <span className="tag-badge">{"{{item}}"}</span>
                    <span className="tag-badge">{"{{days}}"}</span>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(245,158,11,0.08)', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.25)' }}>
                <p style={{ fontSize: '0.8125rem', color: '#b45309', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', lineHeight: 1.6 }}>
                  <Archive size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <span>When an order matches the threshold, it appears under the <strong>Stockpiling</strong> filter on the Orders page. Select multiple orders and hit <strong>Notify</strong> to send pickup reminders via WhatsApp or clipboard — one customer at a time.</span>
                </p>
              </div>
            </div>
          )}

          {/* ACCOUNT SECURITY */}
          {activeTab === 'account' && (
            <div className="settings-content">
              <div className="settings-card">
                <div className="settings-card-header">
                  <h2 className="settings-card-title"><Shield size={20} /> Security</h2>
                  <p className="settings-card-subtitle">Manage your password and account security</p>
                </div>
                <div className="form-section">
                  <button className="action-btn secondary" style={{ width: 'fit-content' }}>
                    Change Password
                  </button>
                  <p className="settings-card-subtitle">Last changed: 2 months ago</p>
                </div>
              </div>

              <div className="settings-card danger-zone">
                <div className="settings-card-header" style={{ borderColor: '#fee2e2' }}>
                  <h2 className="settings-card-title" style={{ color: '#dc2626' }}>
                    <Trash2 size={20} /> Danger Zone
                  </h2>
                  <p className="settings-card-subtitle">Permanently delete your account and all data</p>
                </div>
                <div className="form-section">
                  <button className="delete-btn">
                    Delete My Account
                  </button>
                  <p className="settings-card-subtitle" style={{ color: '#ef4444', fontWeight: 500 }}>
                    This action is irreversible. All orders, customers, and data will be lost.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
