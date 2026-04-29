import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import {
  Bell, PackageOpen, AlertTriangle, Clock,
  CreditCard, Calendar, CheckCheck, Sparkles
} from 'lucide-react';
import './NotificationsPanel.css';

// ── Icon map per notification type ───────────────────────────────────────────
const ICON_MAP = {
  out_of_stock:     <PackageOpen size={16} />,
  low_stock:        <AlertTriangle size={16} />,
  overdue_delivery: <Clock size={16} />,
  upcoming_delivery:<Calendar size={16} />,
  overdue_debt:     <CreditCard size={16} />,
};

// "upcoming_delivery" uses a purple icon wrap
const ICON_CLASS_MAP = {
  out_of_stock:      'sev-critical',
  low_stock:         'sev-warning',
  overdue_delivery:  'sev-critical',
  upcoming_delivery: 'sev-delivery',
  overdue_debt:      'sev-info',
};

// Friendly relative time
function relTime(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 2)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsPanel({ notifications, onClose }) {
  const navigate = useNavigate();
  const markAllRead  = useMutation(api.notifications.markAllRead);
  const clearStale   = useMutation(api.notifications.clearStaleReads);

  const isLoading = notifications === undefined;
  const notifList = notifications || [];

  const unreadCount = notifList.filter(n => !n.read).length;
  const allKeys = notifList.map(n => n.key);

  // On mount: clean up stale read records (notifications that no longer exist)
  useEffect(() => {
    if (allKeys.length > 0) {
      clearStale({ activeKeys: allKeys }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkAllRead = async () => {
    const unreadKeys = notifList.filter(n => !n.read).map(n => n.key);
    if (unreadKeys.length > 0) {
      await markAllRead({ keys: unreadKeys });
    }
  };

  const handleItemClick = async (notif) => {
    // Mark this single notification as read
    if (!notif.read) {
      await markAllRead({ keys: [notif.key] });
    }
    onClose();
    navigate(notif.link);
  };

  return (
    <>
      {/* Click-outside backdrop */}
      <div className="notif-backdrop" onClick={onClose} />

      <div className="notif-panel" role="dialog" aria-label="Notifications">
        {/* Header */}
        <div className="notif-header">
          <div className="notif-header-left">
            <Bell size={16} color="var(--accent-primary)" />
            <span className="notif-title">Notifications</span>
            {!isLoading && unreadCount > 0 && (
              <span className="notif-count-badge">{unreadCount}</span>
            )}
          </div>
          <button
            className="notif-mark-read-btn"
            onClick={handleMarkAllRead}
            disabled={isLoading || unreadCount === 0}
          >
            <CheckCheck size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} />
            Mark all read
          </button>
        </div>

        {/* List */}
        <div className="notif-list">
          {isLoading ? (
            <div className="notif-empty" style={{ opacity: 0.7 }}>
              <div className="notif-empty-icon" style={{ background: 'transparent' }}>
                <Clock size={24} className="spinning" />
              </div>
              <p className="notif-empty-title">Loading alerts...</p>
            </div>
          ) : notifList.length === 0 ? (
            <div className="notif-empty">
              <div className="notif-empty-icon">
                <Sparkles size={24} />
              </div>
              <p className="notif-empty-title">You're all caught up!</p>
              <p className="notif-empty-sub">No alerts right now. We'll notify you when something needs attention.</p>
            </div>
          ) : (
            notifList.map((notif) => (
              <div
                key={notif.key}
                className={`notif-item ${notif.read ? '' : 'unread'} sev-${notif.severity}`}
                onClick={() => handleItemClick(notif)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleItemClick(notif)}
              >
                <div className={`notif-icon-wrap ${ICON_CLASS_MAP[notif.type] || 'sev-info'}`}>
                  {ICON_MAP[notif.type] || <Bell size={16} />}
                </div>
                <div className="notif-content">
                  <p className="notif-item-title">{notif.title}</p>
                  <p className="notif-item-msg">{notif.message}</p>
                  <p className="notif-item-time">{relTime(notif.timestamp)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
