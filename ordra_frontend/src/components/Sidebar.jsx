import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LayoutDashboard, Users, ShoppingBag, LogOut, X, Settings, PackageOpen, BarChart3, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import logo from '../assets/logo.png';
import './Sidebar.css';

export default function Sidebar({ isOpen, closeSidebar }) {
  const { logout } = useAuth();
  const settings = useQuery(api.settings.getSettings);

  const navLinks = [
    { to: '/app', label: 'Dashboard', icon: <LayoutDashboard size={20} />, exact: true },
    { to: '/app/customers', label: 'Customers', icon: <Users size={20} /> },
    { to: '/app/orders', label: 'Orders', icon: <ShoppingBag size={20} /> },
    { to: '/app/products', label: 'Products', icon: <PackageOpen size={20} /> },
    { to: '/app/debts', label: 'Debt Manager', icon: <CreditCard size={20} /> },
    { to: '/app/analytics', label: 'Analytics', icon: <BarChart3 size={20} /> },
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
          {navLinks.map(({ to, label, icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <span className="sidebar-link-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button onClick={logout} className="logout-btn">
            <LogOut size={20} />
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}
