/**
 * AppHeader.jsx
 *
 * Top header bar: hamburger ☰ · search · notification bell · user avatar.
 * Notification and user dropdowns are self-contained here.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdSearch, MdNotificationsNone, MdPerson, MdSettings, MdLogout } from 'react-icons/md';
import { useApp } from '../../../context/AppContext';
import './AppHeader.css';

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

export default function AppHeader({ notifications, onMarkRead, onMarkAllRead, onClearAll }) {
  const { toggleSidebar, user, logout } = useApp();
  const navigate = useNavigate();

  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen]   = useState(false);
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
    <header className="sp-header">
      {/* Hamburger */}
      <button
        className="sp-header__hamburger"
        onClick={toggleSidebar}
        aria-label="Toggle navigation"
      >
        <span />
        <span />
        <span />
      </button>

      {/* Search */}
      <div className="sp-header__search">
        <MdSearch className="sp-header__search-icon" />
        <input
          type="search"
          placeholder="Search…"
          className="sp-header__search-input"
          value={searchVal}
          onChange={(e) => setSearchVal(e.target.value)}
        />
      </div>

      <div className="sp-header__right">
        {/* Notification bell */}
        <div className="sp-header__notif-wrap" ref={notifRef}>
          <button
            className="sp-header__icon-btn"
            onClick={() => { setNotifOpen((o) => !o); setUserOpen(false); }}
            aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
          >
            <MdNotificationsNone />
            {unreadCount > 0 && (
              <span className="sp-header__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {notifOpen && (
            <div className="sp-header__dropdown sp-header__dropdown--notif">
              <div className="sp-dropdown-header">
                <span className="sp-dropdown-title">Notifications</span>
                <div className="sp-dropdown-actions">
                  {unreadCount > 0 && (
                    <button className="sp-dropdown-action" onClick={() => { onMarkAllRead(); }}>
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button className="sp-dropdown-action sp-dropdown-action--danger" onClick={() => { onClearAll(); setNotifOpen(false); }}>
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              <div className="sp-dropdown-body">
                {notifications.length === 0 ? (
                  <p className="sp-dropdown-empty">No notifications.</p>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      className={`sp-notif-item${n.isRead ? '' : ' sp-notif-item--unread'}`}
                      onClick={() => onMarkRead(n.id)}
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
        <div className="sp-header__user-wrap" ref={userRef}>
          <button
            className="sp-header__avatar-btn"
            onClick={() => { setUserOpen((o) => !o); setNotifOpen(false); }}
            aria-label="User menu"
          >
            <span className="sp-header__avatar-initial">
              {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
            </span>
          </button>

          {userOpen && (
            <div className="sp-header__dropdown sp-header__dropdown--user">
              <div className="sp-dropdown-header sp-dropdown-header--user">
                <p className="sp-dropdown-user-name">{user?.fullName ?? 'User'}</p>
                <p className="sp-dropdown-user-email">{user?.email ?? ''}</p>
              </div>
              <div className="sp-dropdown-body">
                <button className="sp-user-menu-item" onClick={() => { navigate('/profile'); setUserOpen(false); }}>
                  <MdPerson /> Profile
                </button>
                <button className="sp-user-menu-item" onClick={() => { navigate('/settings'); setUserOpen(false); }}>
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
