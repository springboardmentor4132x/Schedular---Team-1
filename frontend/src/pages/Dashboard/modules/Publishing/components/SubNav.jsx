/**
 * SubNav.jsx
 *
 * Shared sub-navigation tab bar for Module 5 (Publishing) pages.
 * Displays tabs based on the user's role.
 */

import { NavLink } from 'react-router-dom';
import './SubNav.css';

export default function SubNav({ role = 'marketing' }) {
  const tabs = [
    { label: 'Dashboard', to: `/${role}/publishing`, end: true },
    ...(role !== 'business' ? [{ label: 'Queue', to: `/${role}/publishing/queue` }] : []),
    { label: 'Logs', to: `/${role}/publishing/logs` },
    ...(role !== 'business' ? [{ label: 'Failed Posts', to: `/${role}/publishing/failed` }] : []),
    { label: 'Platform Status', to: `/${role}/publishing/platforms` },
  ];

  return (
    <div className="sp-subnav">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `sp-subnav__tab${isActive ? ' sp-subnav__tab--active' : ''}`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
