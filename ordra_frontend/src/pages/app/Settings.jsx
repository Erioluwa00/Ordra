import React, { useState, useEffect } from 'react';
import { 
  User, Palette, CreditCard, Bell, MessageSquare, 
  Shield, Save, Trash2, Check, Globe, Zap, Clock
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
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
                <div className="form-row">
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
                    <label className="form-label">Currency</label>
                    <div className="settings-select-wrap">
                      <select 
                        className="settings-input" 
                        name="currency"
                        value={settings.currency}
                        onChange={handleChange}
                      >
                        <option value="NGN">Nigerian Naira (₦)</option>
                        <option value="USD">US Dollar ($)</option>
                        <option value="GBP">British Pound (£)</option>
                      </select>
                    </div>
                  </div>
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
                <div className="form-group">
                  <label className="form-label">Order Confirmation</label>
                  <textarea 
                    className="settings-input settings-textarea" 
                    name="templateConfirmation"
                    value={settings.templateConfirmation}
                    onChange={handleChange}
                  />
                  <div className="template-tags">
                    <span className="tag-badge">{"{{name}}"}</span>
                    <span className="tag-badge">{"{{id}}"}</span>
                    <span className="tag-badge">{"{{total}}"}</span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Reminder</label>
                  <textarea 
                    className="settings-input settings-textarea" 
                    name="templateReminder"
                    value={settings.templateReminder}
                    onChange={handleChange}
                  />
                  <div className="template-tags">
                    <span className="tag-badge">{"{{name}}"}</span>
                    <span className="tag-badge">{"{{id}}"}</span>
                    <span className="tag-badge">{"{{balance}}"}</span>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fef3c7', borderRadius: '12px', border: '1px solid #fde68a' }}>
                 <p style={{fontSize: '0.8125rem', color: '#92400e', display: 'flex', gap: '0.5rem'}}>
                    <Clock size={16} /> 
                    <span>Templates are automatically populated when you click 'Send Update' in the order drawer.</span>
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
