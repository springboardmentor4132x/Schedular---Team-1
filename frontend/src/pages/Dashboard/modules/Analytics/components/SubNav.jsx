/**
 * SubNav.jsx
 *
 * Shared sub-navigation tab bar for Module 6 (Analytics) pages.
 * Displays tabs based on the user's role.
 */

import { NavLink } from 'react-router-dom';
import './SubNav.css';

export default function SubNav({ role = 'marketing' }) {
  const tabs = [
    { label: 'Overview', to: `/${role}/analytics/overview` },
    { label: 'Content', to: `/${role}/analytics/content` },
    { label: 'Audience', to: `/${role}/analytics/audience` },
    { label: 'Campaigns', to: `/${role}/analytics/campaigns` },
    { label: 'Platforms', to: `/${role}/analytics/platforms` },
    { label: 'Trends', to: `/${role}/analytics/trends` },
  ];

  return (
    <div className="sp-subnav">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
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
