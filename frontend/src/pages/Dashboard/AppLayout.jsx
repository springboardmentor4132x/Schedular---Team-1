/**
 * AppLayout.jsx
 *
 * Shared layout shell for all authenticated pages.
 * Renders: AppSidebar (fixed, slide-in) + AppHeader (sticky top) + <main> outlet.
 */

import { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import AppSidebar from './components/AppSidebar';
import AppHeader  from './components/AppHeader';
import { getNotifications, markNotificationRead, markAllRead, clearNotifications }
  from '../../services/notificationService';
import './AppLayout.css';

export default function AppLayout() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    getNotifications().then(setNotifications);
  }, []);

  const handleMarkRead = useCallback(async (id) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    await markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const handleClearAll = useCallback(async () => {
    await clearNotifications();
    setNotifications([]);
  }, []);

  return (
    <div className="sp-app-layout">
      <AppSidebar />
      <div className="sp-app-main">
        <AppHeader
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          onClearAll={handleClearAll}
        />
        <main className="sp-app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
