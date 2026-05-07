import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Menu, Search, Bell, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import NotificationsPanel from '../components/NotificationsPanel';
import UpgradeModal from '../components/UpgradeModal';
import { useAuth } from '../context/AuthContext';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useLocation } from 'react-router-dom';
import './AppLayout.css';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState(null);
  
  const { user } = useAuth();
  const location = useLocation();
  const settings = useQuery(api.settings.getSettings);
  const notifications = useQuery(api.notifications.getNotifications);
  const unreadCount = notifications ? notifications.filter(n => !n.read).length : 0;

  // Listen for global upgrade events
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hasUpgradeParam = params.get('upgrade') === 'true';
    const hasPendingIntent = localStorage.getItem('ordra_pending_upgrade') === 'true';

    if (hasUpgradeParam || hasPendingIntent) {
      setUpgradeModal('orders');
      localStorage.removeItem('ordra_pending_upgrade');
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }

    const handleUpgradeEvent = (e) => setUpgradeModal(e.detail?.feature || 'orders');
    window.addEventListener('ordra:upgrade', handleUpgradeEvent);
    return () => window.removeEventListener('ordra:upgrade', handleUpgradeEvent);
  }, [location.search]);
  
  // Create initials for avatar (e.g., "John Doe" -> "JD", or email format)
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="app-layout">
      {/* Sidebar handles both desktop and mobile views */}
      <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />

      <main className="app-main">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button 
              className="menu-toggle" 
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
            
            <button 
              className="search-toggle-mobile" 
              onClick={() => setShowMobileSearch(true)}
              aria-label="Search"
            >
              <Search size={22} />
            </button>
            
            <div className={`search-bar-wrapper ${showMobileSearch ? 'mobile-active' : ''}`}>
              <Search className="search-icon" size={18} />
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search orders, customers..." 
              />
              <button 
                className="mobile-search-close" 
                onClick={() => setShowMobileSearch(false)}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="topbar-right">
            {/* ── Notifications Bell ── */}
            <div className="notif-wrapper">
              <button
                className="notification-btn"
                aria-label="Notifications"
                onClick={() => setNotifOpen(o => !o)}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="notif-badge">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <NotificationsPanel 
                  notifications={notifications} 
                  onClose={() => setNotifOpen(false)} 
                />
              )}
            </div>
            
            <Link to="/app/settings" className="user-profile" style={{ textDecoration: 'none' }}>
              <div className="user-info">
                <span className="user-name">{settings?.businessName || user?.name || 'Vendor'}</span>
              </div>
              <div className="user-avatar">
                {getInitials(user?.name)}
              </div>
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <div className="app-content">
          <Outlet />
        </div>

        {upgradeModal && (
          <UpgradeModal
            feature={upgradeModal}
            onClose={() => setUpgradeModal(null)}
          />
        )}
      </main>
    </div>
  );
}
