import React, { useState, useMemo } from 'react';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { TrendingUp, TrendingDown, ShoppingBag, CreditCard, AlertCircle } from 'lucide-react';
import './RevenueChart.css';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const fmt = (n) => '₦' + Math.round(n).toLocaleString('en-NG');
const fmtShort = (n) => {
  if (n >= 1_000_000) return '₦' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return '₦' + (n / 1_000).toFixed(0) + 'k';
  return '₦' + n;
};

const PERIODS = [
  { key: '7d',  label: '7D',  days: 7   },
  { key: '30d', label: '30D', days: 30  },
  { key: '90d', label: '3M',  days: 90  },
];

// ─────────────────────────────────────────────
// SVG Bar Chart
// ─────────────────────────────────────────────
function BarChart({ data = [], height = 280 }) {
  const [tooltip, setTooltip] = useState(null);
  const [width, setWidth] = useState(700);
  const wrapperRef = React.useRef(null);

  React.useEffect(() => {
    if (!wrapperRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]?.contentRect.width > 0) {
        setWidth(entries[0].contentRect.width);
      }
    });
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  if (!data || data.length === 0) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>No data for this period</div>;

  const maxRev  = Math.max(...data.map(d => d.revenue), 1000);
  const isMobile = width < 500;
  const padL    = isMobile ? 38 : 52;
  const padR    = isMobile ? 10 : 16;
  const padT    = 12;
  const padB    = 36;
  const chartW  = width  - padL - padR;
  const chartH  = height - padT - padB;

  const gridCount = 4;
  const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => {
    const val = (maxRev / gridCount) * (gridCount - i);
    const y   = padT + (i / gridCount) * chartH;
    return { val, y };
  });

  const gap       = data.length > 20 ? 1 : data.length > 10 ? 3 : (isMobile ? 4 : 8);
  const barW      = Math.max(2, (chartW / data.length) - gap);
  const barRadius = Math.min(barW / 2, 5);

  const barX = (i) => padL + i * (chartW / data.length) + gap / 2;
  const barY = (rev) => padT + chartH - (rev / maxRev) * chartH;
  const barH = (rev) => (rev / maxRev) * chartH;

  return (
    <div className="rc-chart-wrap" ref={wrapperRef}>
      <svg viewBox={`0 0 ${width} ${height}`} className="rc-svg" onMouseLeave={() => setTooltip(null)}>
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9333ea" stopOpacity="1" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.85" />
          </linearGradient>
        </defs>

        {gridLines.map(({ val, y }, i) => (
          <g key={i}>
            <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#f3f4f6" strokeWidth={1} strokeOpacity={0.1} />
            <text x={padL - 6} y={y + 4} textAnchor="end" fontSize={9} fill="#9ca3af">{fmtShort(val)}</text>
          </g>
        ))}

        {data.map((d, i) => {
          const x = barX(i);
          const bH = barH(d.revenue);
          const bY = barY(d.revenue);
          return (
            <rect
              key={i}
              x={x} y={bY} width={barW} height={Math.max(bH, 2)}
              rx={barRadius} ry={barRadius}
              fill="url(#barGrad)"
              onMouseMove={(e) => setTooltip({ d, x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, i })}
            />
          );
        })}

        {data.map((d, i) => {
          const skip = data.length > 20 ? (isMobile ? 7 : 4) : data.length > 10 ? (isMobile ? 3 : 2) : (isMobile ? 2 : 1);
          if (i % skip !== 0) return null;
          return (
            <text key={i} x={barX(i) + barW / 2} y={height - padB + 18} textAnchor="middle" fontSize={9} fill="#9ca3af">
              {d.label}
            </text>
          );
        })}
      </svg>

      {tooltip && (
        <div className="rc-tooltip" style={{ left: Math.min(tooltip.x + 12, width - 150), top: Math.max(tooltip.y - 80, 0) }}>
          <p className="rc-tt-date">{new Date(tooltip.d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
          <p className="rc-tt-rev">{fmt(tooltip.d.revenue)}</p>
          <p className="rc-tt-orders">{tooltip.d.orders} orders</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Donut chart — payment breakdown
// ─────────────────────────────────────────────
function DonutChart({ paid, unpaid }) {
  const total = (paid + unpaid) || 1;
  const r = 44, cx = 56, cy = 56, stroke = 14;
  const circ = 2 * Math.PI * r;

  const slices = [
    { val: paid, color: '#16a34a', label: 'Collected' },
    { val: unpaid, color: '#d97706', label: 'Outstanding' },
  ];

  let offset = 0;
  return (
    <div className="rc-donut-wrap">
      <svg viewBox="0 0 112 112" className="rc-donut-svg">
        {slices.map((s, i) => {
          const dash = (s.val / total) * circ;
          const arc = (
            <circle
              key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={s.color} strokeWidth={stroke}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={-offset} strokeLinecap="round"
              style={{ transformOrigin: '56px 56px', transform: 'rotate(-90deg)', transition: 'all 0.6s' }}
            />
          );
          offset += dash;
          return dash > 0 ? arc : null;
        })}
        <text x={cx} y={cy + 5} textAnchor="middle" fontSize={14} fontWeight="700" fill="#111827">
          {Math.round((paid / total) * 100)}%
        </text>
      </svg>
      <div className="rc-donut-legend">
        {slices.map(s => (
          <div key={s.label} className="rc-legend-row">
            <span className="rc-legend-dot" style={{ background: s.color }} />
            <span className="rc-legend-label">{s.label}</span>
            <span className="rc-legend-pct">{Math.round((s.val / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main RevenueChart component
// ─────────────────────────────────────────────
export default function RevenueChart() {
  const [period, setPeriod] = useState('7d');
  const { days } = PERIODS.find(p => p.key === period);

  // Live Query
  const data = useQuery(api.orders.getAnalytics, { days });

  // Period totals
  const total = useMemo(() => data?.reduce((s, d) => s + d.revenue, 0) || 0, [data]);
  const orders = useMemo(() => data?.reduce((s, d) => s + d.orders, 0) || 0, [data]);
  const paid = useMemo(() => data?.reduce((s, d) => s + d.paid, 0) || 0, [data]);
  const unpaid = useMemo(() => data?.reduce((s, d) => s + d.unpaid, 0) || 0, [data]);
  const avgDay = total / days;
  const bestDay = useMemo(() => data?.reduce((best, d) => d.revenue > best.revenue ? d : best, data[0]), [data]);

  return (
    <div className="rc-card">
      <div className="rc-header">
        <div>
          <h2 className="rc-title">Revenue Overview</h2>
          <p className="rc-subtitle">Business performance for the last {days} days</p>
        </div>
        <div className="rc-period-tabs">
          {PERIODS.map(p => (
            <button key={p.key} className={`rc-period-tab${period === p.key ? ' active' : ''}`} onClick={() => setPeriod(p.key)}>{p.label}</button>
          ))}
        </div>
      </div>

      <div className="rc-hero">
        <div>
          <div className="rc-big-rev">{fmt(total)}</div>
          <div className="rc-trend up">
            <TrendingUp size={14} />
            <span>Live from database</span>
          </div>
        </div>
        <div className="rc-hero-pills">
          <div className="rc-hero-pill"><ShoppingBag size={13} /><span>{orders} orders</span></div>
          <div className="rc-hero-pill"><span>Avg {fmtShort(avgDay)}/day</span></div>
          {bestDay && bestDay.revenue > 0 && (
            <div className="rc-hero-pill best"><span>Best: {bestDay.label} · {fmtShort(bestDay.revenue)}</span></div>
          )}
        </div>
      </div>

      <BarChart data={data} width={900} height={320} />

      <div className="rc-bottom">
        <div className="rc-stat-grid">
          <div className="rc-stat"><span className="rc-stat-label">Total Revenue</span><span className="rc-stat-val">{fmt(total)}</span></div>
          <div className="rc-stat"><span className="rc-stat-label">Collected</span><span className="rc-stat-val" style={{ color: '#16a34a' }}>{fmt(paid)}</span></div>
          <div className="rc-stat"><span className="rc-stat-label">Outstanding</span><span className="rc-stat-val" style={{ color: '#d97706' }}>{fmt(unpaid)}</span></div>
          <div className="rc-stat"><span className="rc-stat-label">Orders</span><span className="rc-stat-val">{orders}</span></div>
        </div>

        <div className="rc-payment-section">
          <p className="rc-payment-title"><CreditCard size={13} /> Payment Breakdown</p>
          <DonutChart paid={paid} unpaid={unpaid} />
          {unpaid > 0 && (
            <div className="rc-outstanding-alert">
              <AlertCircle size={13} />
              <span>{fmt(unpaid)} still outstanding</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
