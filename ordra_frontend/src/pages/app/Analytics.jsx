import React, { useState } from 'react';
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import RevenueChart from '../../components/RevenueChart';
import usePlan from '../../hooks/usePlan';
import UpgradeModal from '../../components/UpgradeModal';
import { 
  BarChart3, TrendingUp, Wallet, ShoppingBag, Users,
  Trophy, AlertTriangle, TrendingDown, Package, ArrowUpRight, Zap 
} from 'lucide-react';
import './Analytics.css';
import './ProductPerformance.css';

const formatCurrency = (amt) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0
  }).format(amt || 0);
};

export default function Analytics() {
  const plan = usePlan();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const stats = useQuery(api.orders.getDashboardStats);
  const customers = useQuery(api.orders.getCustomers);
  const performance = useQuery(api.products.getProductPerformance);

  const isLoadingStats = stats === undefined;
  const isLoadingCust  = customers === undefined;
  const isLoadingPerf  = performance === undefined;

  const isLocked = plan.isFree && !plan.isTrial;

  const analyticsMetrics = [
    {
      title: 'Total Revenue',
      value: isLoadingStats ? <span className="skeleton" style={{ width: '120px', height: '28px' }} /> : formatCurrency(stats?.totalRevenue),
      trend: isLoadingStats ? '...' : 'Live',
      trendDir: 'up',
      icon: <Wallet size={20} />,
      colorClass: 'purple'
    },
    {
      title: 'Total Orders',
      value: isLoadingStats ? <span className="skeleton" style={{ width: '60px', height: '28px' }} /> : stats?.totalOrders || '0',
      trend: isLoadingStats ? '...' : stats?.activeOrders + ' active',
      trendDir: 'up',
      icon: <ShoppingBag size={20} />,
      colorClass: 'blue'
    },
    {
      title: 'Active Customers',
      value: isLoadingCust ? <span className="skeleton" style={{ width: '60px', height: '28px' }} /> : customers?.length || '0',
      trend: isLoadingCust ? '...' : 'Registered',
      trendDir: 'green',
      icon: <Users size={20} />,
      colorClass: 'green'
    }
  ];

  return (
    <div className={`analytics-container ${isLocked ? 'is-locked' : ''}`}>
      {isLocked && (
        <div className="pro-overlay">
          <div className="pro-overlay-content">
            <div className="pro-zap-badge">
              <Zap size={14} fill="currentColor" /> Pro Feature
            </div>
            <h2>Unlock Business Insights</h2>
            <p>See your revenue trends, best selling products, and detailed performance analytics.</p>
            <button className="pro-upgrade-btn" onClick={() => setIsUpgradeModalOpen(true)}>
              Upgrade to Pro — ₦5,000/mo
            </button>
          </div>
        </div>
      )}

      {isUpgradeModalOpen && (
        <UpgradeModal 
          feature="analytics" 
          onClose={() => setIsUpgradeModalOpen(false)} 
        />
      )}

      <div className="analytics-header">
        <div>
          <h1 className="analytics-title">Analytics</h1>
          <p className="analytics-subtitle">Deep dive into your business performance and revenue</p>
        </div>
      </div>

      <div className="analytics-metrics-row">
        {analyticsMetrics.map((metric, i) => (
          <div key={i} className="a-metric-card">
            <div className="a-metric-header">
              <span className="a-metric-title">{metric.title}</span>
              <div className={`a-metric-icon-wrap ${metric.colorClass}`}>
                {metric.icon}
              </div>
            </div>
            <div className="a-metric-value">{metric.value}</div>
            <div className={`a-metric-trend ${metric.trendDir}`}>
              <TrendingUp size={14} />
              {metric.trend} <span className="a-trend-text">from database</span>
            </div>
          </div>
        ))}
      </div>

      <div className="analytics-chart-section">
        <RevenueChart />
      </div>

      <div className="analytics-grid">
         <div className="performance-grid">
            {/* Best Sellers */}
            <div className="performance-card">
              <div className="perf-header">
                <h3 className="perf-title"><Trophy size={18} color="#d97706" /> Best Selling Products</h3>
                <span className="a-trend-text">By quantity sold</span>
              </div>
              {isLoadingPerf ? (
                <div className="perf-empty">Loading performance data...</div>
              ) : performance?.bestSellers.length === 0 ? (
                <div className="perf-empty">No sales data yet. Start selling to see insights!</div>
              ) : (
                <div className="best-seller-list">
                  {performance.bestSellers.map((product) => (
                    <div key={product._id} className="best-seller-item">
                      <div className="bs-info">
                        <span className="bs-name">{product.name}</span>
                        <span className="bs-category">{product.category || 'General'}</span>
                      </div>
                      <div className="bs-stats">
                        <span className="bs-qty">{product.qtySold} sold</span>
                        <div className="bs-revenue">{formatCurrency(product.revenue)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Slow Movers / Stock Issues */}
            <div className="performance-card">
              <div className="perf-header">
                <h3 className="perf-title"><AlertTriangle size={18} color="#ef4444" /> Slow Moving Stock</h3>
                <span className="a-trend-text">Least sold / High stock</span>
              </div>
              {isLoadingPerf ? (
                <div className="perf-empty">Analyzing stock levels...</div>
              ) : performance?.slowMovers.length === 0 ? (
                <div className="perf-empty">All your stock is moving well!</div>
              ) : (
                <div className="slow-movers-list">
                  {performance.slowMovers.map((product) => (
                    <div key={product._id} className="slow-mover-item">
                      <span className="sm-name">{product.name}</span>
                      <div style={{ textAlign: 'right' }}>
                        <div className="sm-stock">{product.quantity || 0} in stock</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {product.qtySold} sold recently
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
         </div>
      </div>
    </div>
  );
}
