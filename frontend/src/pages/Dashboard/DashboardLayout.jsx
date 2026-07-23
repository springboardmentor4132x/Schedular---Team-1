/**
 * DashboardLayout.jsx
 *
 * New role-aware shared layout shell.
 * Renders: Sidebar (role-driven) + Navbar (top) + <main> outlet.
 *
 * This replaces AppLayout.jsx for all dashboard routes.
 * AppLayout.jsx is preserved untouched for backward compatibility until migrated.
 */

import { useState, useCallback, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import Navbar  from './components/Navbar/Navbar';
import { useApp } from '../../context/AppContext';
import { resolveRole } from './shared/constants';
import {
  getNotifications,
  markNotificationRead,
  markAllRead,
  clearNotifications,
} from '../../services/notificationService';
import './DashboardLayout.css';

export default function DashboardLayout() {
  const { user } = useApp();
  const role = user ? resolveRole(user.role) : null;
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    getNotifications({ role }).then(setNotifications).catch(() => setNotifications([]));
  }, [role]);

  const handleMarkRead = useCallback(async (id) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    await markAllRead({ role });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, [role]);

  const handleClearAll = useCallback(async () => {
    await clearNotifications({ role });
    setNotifications([]);
  }, [role]);

  return (
    <div className="sp-dash-layout">
      <Sidebar />
      <div className="sp-dash-main">
        <Navbar
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          onClearAll={handleClearAll}
        />
        <main className="sp-dash-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
