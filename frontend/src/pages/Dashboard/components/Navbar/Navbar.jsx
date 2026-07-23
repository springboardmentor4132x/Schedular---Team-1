/**
 * components/Navbar/Navbar.jsx
 *
 * Top navigation bar: hamburger · page title · search · notification bell · user menu.
 * Replaces AppHeader as the shared top bar for all role dashboards.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MdMenu, MdSearch, MdNotificationsNone, MdPerson, MdSettings, MdLogout,
} from 'react-icons/md';
import { useApp } from '../../../../context/AppContext';
import { resolveRole, ROLE_LABELS } from '../../shared/constants';
import { getSidebarItems } from '../../shared/sidebarConfig';
import Avatar from '../Avatar/Avatar';
import './Navbar.css';

function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}

function formatTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/** Derive a page title from the current pathname using sidebarConfig */
function usePageTitle(role) {
  const { pathname } = useLocation();
  const items = getSidebarItems(role);
  const match = items.find((item) => pathname.startsWith(item.to));
  return match?.label ?? 'Dashboard';
}

export default function Navbar({ notifications = [], onMarkRead, onMarkAllRead, onClearAll }) {
  const { toggleSidebar, user, logout } = useApp();
  const navigate = useNavigate();

  const role       = resolveRole(user?.role);
  const pageTitle  = usePageTitle(role);
  const firstName  = user?.fullName?.split(' ')[0] ?? '';
  const lastName   = user?.fullName?.split(' ').slice(1).join(' ') ?? '';

  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen,  setUserOpen]  = useState(false);
  const [searchVal, setSearchVal] = useState('');

  const notifRef = useRef(null);
  const userRef  = useRef(null);

  useClickOutside(notifRef, () => setNotifOpen(false));
  useClickOutside(userRef,  () => setUserOpen(false));

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <header className="sp-navbar">
      {/* Left: hamburger + page title */}
      <div className="sp-navbar__left">
        <button
          className="sp-navbar__hamburger"
          onClick={toggleSidebar}
          aria-label="Toggle navigation"
          id="sidebar-toggle-btn"
        >
          <MdMenu />
        </button>
        <span className="sp-navbar__page-title">{pageTitle}</span>
      </div>

      {/* Centre: search */}
      <div className="sp-navbar__search">
        <MdSearch className="sp-navbar__search-icon" />
        <input
          type="search"
          placeholder="Search…"
          className="sp-navbar__search-input"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
          aria-label="Search"
          id="navbar-search-input"
        />
      </div>

      {/* Right: notifications + avatar */}
      <div className="sp-navbar__right">
        {/* Notification bell */}
        <div className="sp-navbar__notif-wrap" ref={notifRef}>
          <button
            className="sp-navbar__icon-btn"
            id="navbar-notif-btn"
            onClick={() => { setNotifOpen((o) => !o); setUserOpen(false); }}
            aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
          >
            <MdNotificationsNone />
            {unreadCount > 0 && (
              <span className="sp-navbar__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {notifOpen && (
            <div className="sp-dropdown sp-dropdown--notif">
              <div className="sp-dropdown__header">
                <span className="sp-dropdown__title">Notifications</span>
                <div className="sp-dropdown__header-actions">
                  {unreadCount > 0 && (
                    <button className="sp-dropdown__action" onClick={onMarkAllRead}>
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      className="sp-dropdown__action sp-dropdown__action--danger"
                      onClick={() => { onClearAll?.(); setNotifOpen(false); }}
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>
              <div className="sp-dropdown__body">
                {notifications.length === 0 ? (
                  <p className="sp-dropdown__empty">No notifications.</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      className={`sp-notif-item${n.isRead ? '' : ' sp-notif-item--unread'}`}
                      onClick={() => onMarkRead?.(n.id)}
                    >
                      <div className="sp-notif-dot" data-type={n.type} />
                      <div className="sp-notif-content">
                        <p className="sp-notif-title">{n.title}</p>
                        <p className="sp-notif-msg">{n.message}</p>
                        <p className="sp-notif-time">{formatTime(n.createdAt)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar dropdown */}
        <div className="sp-navbar__user-wrap" ref={userRef}>
          <button
            className="sp-navbar__avatar-btn"
            id="navbar-user-menu-btn"
            onClick={() => { setUserOpen((o) => !o); setNotifOpen(false); }}
            aria-label="User menu"
          >
            <Avatar
              profileImage={user?.profileImage}
              firstName={firstName}
              lastName={lastName}
              size="sm"
            />
          </button>

          {userOpen && (
            <div className="sp-dropdown sp-dropdown--user">
              <div className="sp-dropdown__header sp-dropdown__header--user">
                <p className="sp-dropdown__user-name">{user?.fullName ?? 'User'}</p>
                <p className="sp-dropdown__user-email">{user?.email ?? ''}</p>
                <span className="sp-dropdown__user-role">{ROLE_LABELS[role] ?? role}</span>
              </div>
              <div className="sp-dropdown__body">
                <button
                  className="sp-user-menu-item"
                  onClick={() => { navigate('/profile'); setUserOpen(false); }}
                >
                  <MdPerson /> Profile
                </button>
                <button
                  className="sp-user-menu-item"
                  onClick={() => { navigate('/settings'); setUserOpen(false); }}
                >
                  <MdSettings /> Settings
                </button>
                <div className="sp-user-menu-divider" />
                <button className="sp-user-menu-item sp-user-menu-item--danger" onClick={handleLogout}>
                  <MdLogout /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
