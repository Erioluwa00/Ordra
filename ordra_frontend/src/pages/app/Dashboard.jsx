import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Plus, Users, Wallet, ShoppingBag,
  TrendingUp, TrendingDown, Clock, ArrowUpRight, Package, Flag, Trophy, CheckCheck, Zap, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import usePlan from '../../hooks/usePlan';
import NewOrderModal from '../../components/NewOrderModal';
import ActionCenter from '../../components/ActionCenter';
import UpgradeModal from '../../components/UpgradeModal';
import TrialWelcomeModal from '../../components/TrialWelcomeModal';
import './Dashboard.css';

const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.split(' ');
  return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
};

const formatCurrency = (amt) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0
  }).format(amt);
};

const isUpcoming = (isoDate, days = 2) => {
  if (!isoDate) return false;
  const diff = new Date(isoDate).getTime() - Date.now();
  return diff > 0 && diff < days * 24 * 3600000;
};

export default function Dashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState(null); // null | feature string
  const [bannerDismissed, setBannerDismissed] = useState(
    () => sessionStorage.getItem('ordra_banner_dismissed') === '1'
  );
  const [showTrialWelcome, setShowTrialWelcome] = useState(false);

  const plan = usePlan();

  // Show Trial Welcome if it's their first time seeing the trial
  useEffect(() => {
    console.log("DEBUG: Plan Status", { 
      isTrial: plan.isTrial, 
      planName: plan.plan,
      userId: user?._id,
      seenBefore: localStorage.getItem(`ordra_trial_welcome_${user?._id}`)
    });
    
    if (plan.isTrial && !localStorage.getItem(`ordra_trial_welcome_${user?._id}`)) {
      setShowTrialWelcome(true);
    }
  }, [plan.isTrial, user?._id]);

  const handleCloseWelcome = () => {
    localStorage.setItem(`ordra_trial_welcome_${user?._id}`, 'true');
    setShowTrialWelcome(false);
  };

  // Listen for the "Get Pro" flag from Landing Page or other sources
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const hasUpgradeParam = params.get('upgrade') === 'true';
    const hasPendingIntent = localStorage.getItem('ordra_pending_upgrade') === 'true';

    if (hasUpgradeParam || hasPendingIntent) {
      setUpgradeModal('orders');
      
      // Clear both so they don't pop up again
      localStorage.removeItem('ordra_pending_upgrade');
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }

    // Also listen for global upgrade events (e.g. from OrderDrawer)
    const handleUpgradeEvent = (e) => setUpgradeModal(e.detail?.feature || 'orders');
    window.addEventListener('ordra:upgrade', handleUpgradeEvent);
    return () => window.removeEventListener('ordra:upgrade', handleUpgradeEvent);
  }, [location.search]);

  const handleNewOrder = () => {
    if (plan.orderLimitReached) {
      setUpgradeModal('orders');
      return;
    }
    setIsOrderModalOpen(true);
  };

  const dismissBanner = () => {
    sessionStorage.setItem('ordra_banner_dismissed', '1');
    setBannerDismissed(true);
  };

  // Mutations
  const updatePayment = useMutation(api.orders.updateOrderPaymentStatus);

  // Live Queries
  const stats = useQuery(api.orders.getDashboardStats);
  const settings = useQuery(api.settings.getSettings);
  const recentOrders = useQuery(api.orders.getRecentOrders, { limit: 5 });
  const allOrders = useQuery(api.orders.getRecentOrders, { limit: 50 }); // For Action Center
  const allProducts = useQuery(api.products.getProducts);
  const performance = useQuery(api.products.getProductPerformance);

  const lowStockProducts = allProducts?.filter(p => p.inStock && p.quantity < 5) || [];
  const priorityCount = (allOrders || []).filter(
    o => (o.isUrgent || isUpcoming(o.deliveryDate)) && o.status !== 'Delivered' && o.status !== 'Cancelled'
  ).length;

  const topSellersCount = performance?.bestSellers ? performance.bestSellers.length : 0;

  const metrics = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      trend: '+0%',
      trendDir: 'up',
      trendText: 'Real-time',
      icon: <Wallet size={20} />,
      colorClass: 'purple'
    },
    {
      title: 'Money Pending',
      value: formatCurrency(stats?.pendingPayments || 0),
      trend: stats?.pendingPayments > 0 ? 'Action Needed' : 'All Clear',
      trendDir: stats?.pendingPayments > 0 ? 'down' : 'up',
      trendText: '',
      icon: <TrendingDown size={20} />,
      colorClass: 'blue'
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders?.toString() || '0',
      trend: 'Total',
      trendDir: 'up',
      trendText: 'Lifetime',
      icon: <ShoppingBag size={20} />,
      colorClass: 'green'
    },
    {
      title: 'Low Stock Items',
      value: lowStockProducts.length.toString(),
      trend: lowStockProducts.length > 0 ? 'Restock soon' : 'All good',
      trendDir: lowStockProducts.length > 0 ? 'down' : 'up',
      trendText: '',
      icon: <Package size={20} />,
      colorClass: 'orange',
      link: '/app/products'
    },
    {
      title: 'Top Sellers',
      value: topSellersCount.toString(),
      trend: topSellersCount > 0 ? `${topSellersCount} products` : 'No sales yet',
      trendDir: topSellersCount > 0 ? 'up' : 'down',
      trendText: '',
      icon: <Trophy size={20} />,
      colorClass: 'green',
      link: '/app/analytics',
      linkState: { scrollTo: 'performance' }
    },
    {
      title: 'Priority Orders',
      value: priorityCount.toString(),
      trend: priorityCount > 0 ? `${priorityCount} need attention` : 'All clear',
      trendDir: priorityCount > 0 ? 'down' : 'up',
      trendText: '',
      icon: <Flag size={20} />,
      colorClass: 'red',
      link: '/app/orders',
      linkState: { filterUrgent: true }
    }
  ];

  return (
    <div className="dashboard-container">
      
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Overview</h1>
          <p className="dashboard-subtitle">
            Welcome back, {settings?.businessName || user?.name?.split(' ')[0] || 'Vendor'}. 
            Here's what's happening today.
          </p>
        </div>
        
        <div className="quick-actions">
          <Link to="/app/customers" className="action-btn secondary" style={{ textDecoration: 'none' }}>
            <Users size={18} /> Customers
          </Link>
          <button className="action-btn primary" onClick={handleNewOrder}>
            <Plus size={18} /> New Order
          </button>
        </div>
      </div>

      {/* ── Plan Banner ───────────────────────────────────────────────────── */}
      {!bannerDismissed && (
        <>
          {/* Free plan banner */}
          {plan.isFree && !plan.isTrial && (
            <div className="plan-banner free">
              <Zap size={15} fill="currentColor" />
              <span>
                You're on the <strong>Free plan</strong> · {plan.monthlyOrderCount}/50 orders used this month
              </span>
              <button className="plan-banner-cta" onClick={() => setUpgradeModal('orders')}>
                Upgrade to Pro — ₦5,000/mo
              </button>
              <button className="plan-banner-dismiss" onClick={dismissBanner} aria-label="Dismiss"><X size={14} /></button>
            </div>
          )}

          {/* Trial countdown banner */}
          {plan.isTrial && plan.trialDaysLeft !== null && plan.trialDaysLeft <= 4 && (
            <div className="plan-banner trial">
              <Zap size={15} fill="currentColor" />
              <span>
                Your <strong>Pro Trial</strong> ends in <strong>{plan.trialDaysLeft} day{plan.trialDaysLeft !== 1 ? 's' : ''}</strong>. Upgrade to keep all Pro features.
              </span>
              <button className="plan-banner-cta" onClick={() => setUpgradeModal('orders')}>
                Upgrade — ₦5,000/mo
              </button>
              <button className="plan-banner-dismiss" onClick={dismissBanner} aria-label="Dismiss"><X size={14} /></button>
            </div>
          )}
        </>
      )}

      {/* Metrics */}
      <div className="metrics-grid">
        {metrics.map((metric, i) => (
          <Link 
            key={i} 
            to={metric.link || "/app/analytics"} 
            state={metric.linkState}
            className="metric-card" 
            style={{ textDecoration: 'none', cursor: 'pointer' }}
          >
            <div className="metric-header">
              <span className="metric-title">{metric.title}</span>
              <div className={`metric-icon-wrap ${metric.colorClass}`}>
                {metric.icon}
              </div>
            </div>
            <div className="metric-value">{metric.value}</div>
            <div className={`metric-trend ${metric.trendDir}`}>
              {metric.trendDir === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {metric.trend} <span className="trend-text">{metric.trendText}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Action Centre - Now uses real orders if available */}
      <ActionCenter orders={allOrders || []} products={allProducts || []} />

      {/* Recent Orders Table */}
      <div className="dashboard-panel">
        <div className="panel-header">
          <h2 className="panel-title">Recent Activity</h2>
          <Link to="/app/orders" className="view-all-btn">
            View All <ArrowUpRight size={16} style={{ display: 'inline', verticalAlign: 'text-bottom' }} />
          </Link>
        </div>
        
        <div className="table-responsive">
          <table className="ordra-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Item / Description</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!recentOrders ? (
                <tr><td colSpan="6" className="text-center">Loading orders...</td></tr>
              ) : recentOrders.length === 0 ? (
                <tr><td colSpan="6" className="text-center">No orders found. Add your first order!</td></tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <div className="order-customer">
                        <div className="c-avatar">{getInitials(order.customer)}</div>
                        <span className="c-name">{order.customer}</span>
                      </div>
                    </td>
                    <td><span className="item-desc">{order.item}</span></td>
                    <td><span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span></td>
                    <td>
                      <span className="order-price">{formatCurrency(order.total)}</span>
                      {order.paymentStatus !== "paid" && (
                        <div className="order-pending-text">
                          Pending: {formatCurrency(order.total - order.amountPaid)}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className={`status-badge ${order.status.toLowerCase()}`}>
                          {order.status === 'New' && <Clock size={12} style={{ marginRight: '4px' }} />}
                          {order.status}
                        </span>
                        <span className={`status-badge ${order.paymentStatus === 'paid' ? 'completed' : 'pending'}`}>
                          {order.paymentStatus.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex" style={{ gap: '8px' }}>
                        {order.paymentStatus !== "paid" && (
                          <button 
                            className="action-btn-sm" 
                            style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #10b981', padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => updatePayment({ orderId: order._id, paymentStatus: 'paid' })}
                          >
                            <CheckCheck size={12} /> Mark Paid
                          </button>
                        )}
                        <button 
                          className="action-btn-sm" 
                          style={{ background: 'var(--input-bg)', color: 'var(--text-primary)', border: '1px solid var(--border-main)', padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                          onClick={() => window.location.href = `/app/orders?id=${order._id}`}
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
      />

      {upgradeModal && (
        <UpgradeModal
          feature={upgradeModal}
          onClose={() => setUpgradeModal(null)}
        />
      )}

      {showTrialWelcome && (
        <TrialWelcomeModal
          days={14}
          onClose={handleCloseWelcome}
        />
      )}

    </div>
  );
}
