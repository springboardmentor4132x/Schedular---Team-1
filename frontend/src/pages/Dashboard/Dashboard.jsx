import React, { useEffect, useState } from 'react';
import axios from 'axios';
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
  const [stats, setStats] = useState({
  total: 0,
  drafts: 0,
  scheduled: 0,
  published: 0,
});

useEffect(() => {
  axios
    .get("http://127.0.0.1:8000/posts/stats")
    .then((res) => setStats(res.data))
    .catch((err) => console.error(err));
}, []);

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

        <div className="dashboard-stats">
  <div className="stat-card">
    <h3>Total Posts</h3>
    <p>{stats.total}</p>
  </div>

  <div className="stat-card">
    <h3>Drafts</h3>
    <p>{stats.drafts}</p>
  </div>

  <div className="stat-card">
    <h3>Scheduled</h3>
    <p>{stats.scheduled}</p>
  </div>

  <div className="stat-card">
    <h3>Published</h3>
    <p>{stats.published}</p>
  </div>
</div>

        {/* Logout */}
        <button className="dashboard-logout-btn" onClick={handleLogout}>
          Logout
        </button>

      </div>
    </div>
  );
};

export default Dashboard;
