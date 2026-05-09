import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Users, ShoppingBag, LogOut, X, Settings, PackageOpen, BarChart3, CreditCard, Lock, Zap, Wifi, WifiOff, CloudSync } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useOffline } from '../context/OfflineContext';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import usePlan from '../hooks/usePlan';
import logo from '../assets/logo.png';
import './Sidebar.css';

export default function Sidebar({ isOpen, closeSidebar }) {
  const { logout } = useAuth();
  const { isOnline, pendingCount, syncing } = useOffline();
  const settings = useQuery(api.settings.getSettings);
  const plan = usePlan();

  const navLinks = [
    { to: '/app', label: 'Dashboard', icon: <LayoutDashboard size={20} />, exact: true },
    { to: '/app/customers', label: 'Customers', icon: <Users size={20} /> },
    { to: '/app/orders', label: 'Orders', icon: <ShoppingBag size={20} /> },
    { to: '/app/products', label: 'Products', icon: <PackageOpen size={20} /> },
    { to: '/app/debts', label: 'Debt Manager', icon: <CreditCard size={20} />, isPro: true },
    { to: '/app/analytics', label: 'Analytics', icon: <BarChart3 size={20} />, isPro: true },
    { to: '/app/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/20 z-40"
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 40 }}
          onClick={closeSidebar}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" className="sidebar-brand">
            <img src={logo} alt="Ordra Logo" className="sidebar-logo-img" />
            <span>Ordra</span>
          </Link>
          {/* Close button for mobile */}
          <button className="sidebar-close-btn" onClick={closeSidebar} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navLinks.map(({ to, label, icon, exact, isPro }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={(e) => {
                if (isPro && plan.isFree && !plan.isTrial) {
                  e.preventDefault();
                  const featureName = to.includes('debts') ? 'debts' : 'analytics';
                  window.dispatchEvent(new CustomEvent('ordra:upgrade', { detail: { feature: featureName } }));
                }
                closeSidebar();
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                <span className="sidebar-link-icon">{icon}</span>
                <span style={{ flex: 1 }}>{label}</span>
                {isPro && plan.isFree && !plan.isTrial && (
                  <Lock size={12} className="sidebar-lock-icon" />
                )}
              </div>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {plan.isTrial ? (
            <div className="sidebar-trial-card">
              <div className="trial-card-header">
                <Zap size={14} fill="currentColor" />
                <span>Pro Trial</span>
              </div>
              <div className="trial-card-content">
                <strong>{plan.trialDaysLeft} days left</strong>
              </div>
              <button 
                className="trial-card-btn" 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('ordra:upgrade', { detail: { feature: 'orders' } }));
                  closeSidebar();
                }}
              >
                Upgrade Now
              </button>
            </div>
          ) : plan.isFree ? (
            <div className="sidebar-trial-card upgrade">
              <div className="trial-card-header">
                <Zap size={14} fill="currentColor" />
                <span>Go Pro</span>
              </div>
              <div className="trial-card-content">
                <strong>Unlock all features</strong>
              </div>
              <button 
                className="trial-card-btn" 
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('ordra:upgrade', { detail: { feature: 'orders' } }));
                  closeSidebar();
                }}
              >
                Upgrade Now
              </button>
            </div>
          ) : null}
          <div className="sidebar-sync-status">
            {syncing ? (
              <div className="sync-item syncing">
                <CloudSync size={14} className="spin-slow" />
                <span>Syncing {pendingCount}...</span>
              </div>
            ) : pendingCount > 0 ? (
              <div className="sync-item pending">
                <CloudSync size={14} />
                <span>{pendingCount} waiting to sync</span>
              </div>
            ) : isOnline ? (
              <div className="sync-item online">
                <Wifi size={14} />
                <span>Online & Synced</span>
              </div>
            ) : (
              <div className="sync-item offline">
                <WifiOff size={14} />
                <span>Offline Mode</span>
              </div>
            )}
          </div>
          <button onClick={logout} className="logout-btn">
            <LogOut size={20} />
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}
