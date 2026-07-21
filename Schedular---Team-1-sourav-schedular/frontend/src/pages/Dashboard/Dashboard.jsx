import React from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import './Dashboard.css';

const ROLE_LABELS = {
  content_creator: 'Content Creator',
  marketing_team: 'Marketing Team',
  business_user: 'Business User',
  administrator: 'Administrator',
};

const Dashboard = () => {
  const navigate = useNavigate();
  const user = authService.getSession();

  const handleLogout = () => {
    authService.clearSession();
    navigate('/login', { replace: true });
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-card">

        {/* Logo */}
        <div className="dashboard-logo">
          <img src="/logo.png" alt="SocialPilot" className="brand-logo" />
          <span className="dashboard-logo-text">SocialPilot</span>
        </div>

        {/* Heading */}
        <h1 className="dashboard-title">Dashboard</h1>
        <p className="dashboard-message">
          Welcome back, <strong>{user?.fullName || 'User'}</strong>!
        </p>

        {/* User info card */}
        <div className="dashboard-user-info">
          <div className="dashboard-info-row">
            <span className="dashboard-info-label">Email</span>
            <span className="dashboard-info-value">{user?.email}</span>
          </div>
          <div className="dashboard-info-row">
            <span className="dashboard-info-label">Role</span>
            <span className="dashboard-info-value">
              {ROLE_LABELS[user?.role] || user?.role}
            </span>
          </div>
          {user?.orgName && (
            <div className="dashboard-info-row">
              <span className="dashboard-info-label">Organisation</span>
              <span className="dashboard-info-value">{user.orgName}</span>
            </div>
          )}
        </div>

        {/* Placeholder notice */}
        <p className="dashboard-placeholder">
          This page is a temporary placeholder until the Dashboard module is implemented.
        </p>

        {/* Logout */}
        <button className="dashboard-logout-btn" onClick={handleLogout}>
          Logout
        </button>

      </div>
    </div>
  );
};

export default Dashboard;
