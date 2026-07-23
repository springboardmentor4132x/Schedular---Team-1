/**
 * NotificationsPage.jsx
 *
 * Full Notification Center workspace.
 * Resolves user notifications, updates read/unread status,
 * and handles click navigation links.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdNotificationsNone, MdNotificationsActive, MdCheck, MdDeleteSweep,
  MdInfo, MdCampaign, MdCheckCircle, MdError
} from 'react-icons/md';
import PageContainer from '../../components/PageContainer/PageContainer';
import SectionTitle from '../../components/SectionTitle/SectionTitle';
import EmptyState from '../../components/EmptyState/EmptyState';
import { useApp } from '../../../../context/AppContext';
import { resolveRole } from '../../shared/constants';
import {
  getNotifications,
  markNotificationRead,
  markAllRead,
  clearNotifications
} from '../../../../services/notificationService';
import './NotificationsPage.css';

const NOTIF_ICONS = {
  system: <MdInfo style={{ color: '#0ea5e9' }} />,
  campaign: <MdCampaign style={{ color: '#4f46e5' }} />,
  content_published: <MdCheckCircle style={{ color: '#10b981' }} />,
  content_failed: <MdError style={{ color: '#ef4444' }} />,
};

function formatTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsPage() {
  const { user } = useApp();
  const role = user ? resolveRole(user.role) : null;
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Unread'

  const refreshList = useCallback(() => {
    getNotifications({ role })
      .then(setNotifications)
      .catch(() => setNotifications([]));
  }, [role]);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  const filteredNotifs = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === 'Unread' && n.isRead) return false;
      return true;
    });
  }, [notifications, activeTab]);

  const handleMarkRead = async (id, link) => {
    await markNotificationRead(id);
    refreshList();
    if (link) {
      navigate(link);
    }
  };

  const handleMarkAll = async () => {
    await markAllRead({ role });
    refreshList();
  };

  const handleClear = async () => {
    await clearNotifications({ role });
    refreshList();
  };

  return (
    <PageContainer
      title="Notification Center"
      description="Stay updated with content publication alerts and agency campaign operations."
      breadcrumb={['Dashboard', 'Notifications']}
    >
      {/* Header bar */}
      <div className="nt-toolbar">
        <div className="nt-toolbar__left">
          <SectionTitle
            title="My Alerts"
            description="Manage your notifications feed status."
          />
        </div>

        <div className="nt-toolbar__actions">
          {notifications.some((n) => !n.isRead) && (
            <button className="nt-btn nt-btn--read" onClick={handleMarkAll}>
              <MdCheck /> Mark all as read
            </button>
          )}
          {notifications.length > 0 && (
            <button className="nt-btn nt-btn--clear" onClick={handleClear}>
              <MdDeleteSweep /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="nt-tabs">
        <button
          onClick={() => setActiveTab('All')}
          className={`nt-tab-btn${activeTab === 'All' ? ' nt-tab-btn--active' : ''}`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setActiveTab('Unread')}
          className={`nt-tab-btn${activeTab === 'Unread' ? ' nt-tab-btn--active' : ''}`}
        >
          Unread ({notifications.filter((n) => !n.isRead).length})
        </button>
      </div>

      {/* List feed */}
      {filteredNotifs.length === 0 ? (
        <div className="nt-empty">
          <EmptyState
            illustration={<MdNotificationsNone />}
            title="Inbox Zero!"
            description={
              activeTab === 'Unread'
                ? "You've read all your notification updates."
                : 'No notification logs found for your active workspace.'
            }
          />
        </div>
      ) : (
        <div className="nt-feed">
          {filteredNotifs.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleMarkRead(notif.id, notif.link)}
              className={`nt-item${notif.isRead ? '' : ' nt-item--unread'}${notif.link ? ' nt-item--link' : ''}`}
            >
              <div className="nt-item__icon-wrap">
                {NOTIF_ICONS[notif.type] || <MdNotificationsActive style={{ color: '#64748b' }} />}
              </div>

              <div className="nt-item__body">
                <h4 className="nt-item__title">
                  {notif.title}
                  {!notif.isRead && <span className="nt-unread-dot" />}
                </h4>
                <p className="nt-item__message">{notif.message}</p>
                <span className="nt-item__time">{formatTime(notif.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
