/**
 * ClientWorkspaceNav.jsx
 *
 * Secondary navigation bar inside the Client Workspace.
 * Links to workspace-specific sub-routes: Dashboard, Campaigns, Content Scheduling,
 * Publishing Calendar, Analytics, and Reports.
 */

import { NavLink } from 'react-router-dom';
import './ClientWorkspaceNav.css';

export default function ClientWorkspaceNav({ clientId }) {
  const tabs = [
    { label: 'Overview', to: `/marketing/clients/${clientId}`, end: true },
    { label: 'Campaigns', to: `/marketing/clients/${clientId}/campaigns` },
    { label: 'Content Scheduling', to: `/marketing/clients/${clientId}/scheduling` },
    { label: 'Publishing Calendar', to: `/marketing/clients/${clientId}/calendar` },
    { label: 'Analytics', to: `/marketing/clients/${clientId}/analytics` },
    { label: 'Reports', to: `/marketing/clients/${clientId}/reports` },
  ];

  return (
    <nav className="cw-nav" aria-label="Client Workspace navigation">
      <div className="cw-nav__container">
        {tabs.map((tab) => (
          <NavLink
            key={tab.label}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `cw-nav__link${isActive ? ' cw-nav__link--active' : ''}`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
