/**
 * AppSidebar.jsx
 *
 * Slide-in sidebar — initially closed, toggled by the hamburger in AppHeader.
 * Behaviour mirrors Notion / Linear / Vercel: no persistent open state,
 * clicking outside or pressing Escape closes it.
 */

import { useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  MdDashboard, MdPerson, MdLink, MdSettings,
} from 'react-icons/md';
import { useApp } from '../../../context/AppContext';
import logo from '../../../assets/logo.jpeg';
import './AppSidebar.css';

const NAV = [
  { to: '/dashboard',    icon: <MdDashboard />,  label: 'Dashboard'        },
  { to: '/profile',      icon: <MdPerson />,      label: 'Manage Profile'   },
  { to: '/connect-apps', icon: <MdLink />,        label: 'Connect Apps'     },
  { to: '/settings',     icon: <MdSettings />,    label: 'Account Settings' },
];

export default function AppSidebar() {
  const { sidebarOpen, closeSidebar, user, logout } = useApp();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') closeSidebar(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [closeSidebar]);

  // Trap focus inside sidebar when open
  useEffect(() => {
    if (sidebarOpen) sidebarRef.current?.focus();
  }, [sidebarOpen]);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`sp-sidebar-backdrop${sidebarOpen ? ' sp-sidebar-backdrop--visible' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        ref={sidebarRef}
        className={`sp-sidebar${sidebarOpen ? ' sp-sidebar--open' : ''}`}
        tabIndex={-1}
        aria-label="Navigation sidebar"
      >
        {/* Brand */}
        <div className="sp-sidebar__brand">
          <NavLink to="/" className="sp-sidebar__logo-link" onClick={closeSidebar}>
            <img src={logo} alt="SocialPilot" className="sp-sidebar__logo-img" />
            <span className="sp-sidebar__logo-text">SocialPilot</span>
          </NavLink>
        </div>

        {/* User pill */}
        <div className="sp-sidebar__user">
          <div className="sp-sidebar__avatar">
            {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="sp-sidebar__user-info">
            <p className="sp-sidebar__user-name">{user?.fullName ?? 'User'}</p>
            <p className="sp-sidebar__user-email">{user?.email ?? ''}</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="sp-sidebar__nav">
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sp-sidebar__item${isActive ? ' sp-sidebar__item--active' : ''}`
              }
              onClick={closeSidebar}
            >
              <span className="sp-sidebar__item-icon">{icon}</span>
              <span className="sp-sidebar__item-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <button className="sp-sidebar__logout" onClick={handleLogout}>
          Sign Out
        </button>
      </aside>
    </>
  );
}
