/**
 * components/Sidebar/Sidebar.jsx
 *
 * Role-aware sidebar. Receives `role` and renders the correct nav items
 * from sidebarConfig.js. No nav items hardcoded here.
 *
 * Behaviour: slide-in overlay on mobile, persistent on desktop (≥1024px).
 * Close on Escape / backdrop click.
 */

import { useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  MdDashboard, MdCampaign, MdSchedule, MdCheckCircle, MdInsights,
  MdBarChart, MdLink, MdPerson, MdSettings, MdPeople, MdEditCalendar,
  MdCalendarMonth, MdNotificationsNone, MdArticle, MdLogout,
} from 'react-icons/md';
import { useApp } from '../../../../context/AppContext';
import { getSidebarItems } from '../../shared/sidebarConfig';
import { resolveRole, ROLE_LABELS } from '../../shared/constants';
import Avatar from '../Avatar/Avatar';
import logo from '../../../../assets/logo.jpeg';
import './Sidebar.css';

// ── Icon registry ──────────────────────────────────────────────────────────
const ICONS = {
  MdDashboard:           <MdDashboard />,
  MdCampaign:            <MdCampaign />,
  MdSchedule:            <MdSchedule />,
  MdCheckCircle:         <MdCheckCircle />,
  MdInsights:            <MdInsights />,
  MdBarChart:            <MdBarChart />,
  MdLink:                <MdLink />,
  MdPerson:              <MdPerson />,
  MdSettings:            <MdSettings />,
  MdPeople:              <MdPeople />,
  MdEditCalendar:        <MdEditCalendar />,
  MdCalendarMonth:       <MdCalendarMonth />,
  MdNotificationsNone:   <MdNotificationsNone />,
  MdArticle:             <MdArticle />,
};

export default function Sidebar() {
  const { sidebarOpen, closeSidebar, user, logout } = useApp();
  const navigate  = useNavigate();
  const sidebarRef = useRef(null);

  const role  = resolveRole(user?.role);
  const items = getSidebarItems(role);

  const firstName = user?.fullName?.split(' ')[0] ?? '';
  const lastName  = user?.fullName?.split(' ').slice(1).join(' ') ?? '';

  // Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') closeSidebar(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [closeSidebar]);

  // Focus trap
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

      {/* Panel */}
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
          <Avatar
            profileImage={user?.profileImage}
            firstName={firstName}
            lastName={lastName}
            size="sm"
          />
          <div className="sp-sidebar__user-info">
            <p className="sp-sidebar__user-name">{user?.fullName ?? 'User'}</p>
            <p className="sp-sidebar__user-role">{ROLE_LABELS[role] ?? role}</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="sp-sidebar__nav">
          {items.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sp-sidebar__item${isActive ? ' sp-sidebar__item--active' : ''}`
              }
              onClick={closeSidebar}
            >
              <span className="sp-sidebar__item-icon">{ICONS[icon] ?? null}</span>
              <span className="sp-sidebar__item-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <button className="sp-sidebar__logout" onClick={handleLogout}>
          <MdLogout />
          Sign Out
        </button>
      </aside>
    </>
  );
}
