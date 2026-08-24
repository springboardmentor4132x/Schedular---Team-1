/**
 * AdminDashboard.jsx
 *
 * Full-featured Administrator Command Center.
 * Provides system-wide KPIs, user distribution, quick management shortcuts,
 * and real-time operational status.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdPeople,
  MdCampaign,
  MdSchedule,
  MdCheckCircle,
  MdLink,
  MdHealthAndSafety,
  MdPersonAdd,
  MdHistory,
  MdArrowForward,
} from 'react-icons/md';
import PageContainer from '../../components/PageContainer/PageContainer';
import SectionTitle from '../../components/SectionTitle/SectionTitle';
import StatsCard from '../../components/StatsCard/StatsCard';
import Avatar from '../../components/Avatar/Avatar';
import adminService from '../../../../services/adminService';
import { useApp } from '../../../../context/AppContext';
import './Admin.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useApp();
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [statsData, usersData, logsData] = await Promise.all([
          adminService.getAdminStats(),
          adminService.getAdminUsers({ limit: 5 }),
          adminService.getAdminLogs({ limit: 5 }),
        ]);
        setStats(statsData);
        setRecentUsers(usersData.items || []);
        setRecentActivities(logsData.activities || []);
      } catch (err) {
        console.error('Failed to load admin dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const firstName = user?.fullName?.split(' ')[0] ?? 'Admin';
  const lastName = user?.fullName?.split(' ').slice(1).join(' ') ?? '';

  const statCards = [
    {
      id: 'users',
      title: 'Total Users',
      value: stats?.totalUsers ?? '0',
      icon: <MdPeople />,
      change: `${stats?.usersByRole?.business ?? 0} Clients / ${stats?.usersByRole?.creator ?? 0} Creators`,
      trend: 'up',
    },
    {
      id: 'campaigns',
      title: 'Active Campaigns',
      value: stats?.campaigns?.active ?? '0',
      icon: <MdCampaign />,
      change: `Total: ${stats?.campaigns?.total ?? 0}`,
      trend: 'neutral',
    },
    {
      id: 'scheduled',
      title: 'Queued & Scheduled',
      value: (stats?.posts?.scheduled ?? 0) + (stats?.posts?.queued ?? 0),
      icon: <MdSchedule />,
      change: 'In Pipeline',
      trend: 'neutral',
    },
    {
      id: 'published',
      title: 'Published Posts',
      value: stats?.posts?.published ?? '0',
      icon: <MdCheckCircle />,
      change: `Failed: ${stats?.posts?.failed ?? 0}`,
      trend: stats?.posts?.failed > 0 ? 'down' : 'up',
    },
    {
      id: 'connections',
      title: 'Connected Accounts',
      value: stats?.connectedAccounts ?? '0',
      icon: <MdLink />,
      change: `${stats?.totalTeams ?? 0} Workspaces`,
      trend: 'neutral',
    },
    {
      id: 'health',
      title: 'System Health',
      value: stats?.systemHealth ?? 'Operational',
      icon: <MdHealthAndSafety />,
      change: 'All Services Up',
      trend: 'up',
    },
  ];

  return (
    <PageContainer>
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '2rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.25)',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                padding: '0.2rem 0.65rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Superuser Authority
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: '0 0 0.5rem 0' }}>
            Welcome back, {firstName} 👋
          </h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem', maxWidth: '600px' }}>
            You have full oversight over all platform users, workspaces, publishing pipelines, and
            system security policies.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className="admin-btn admin-btn-primary"
            style={{ background: '#ffffff', color: '#1e1b4b' }}
            onClick={() => navigate('/admin/users')}
          >
            <MdPersonAdd size={18} /> Manage Users
          </button>
          <button
            className="admin-btn admin-btn-secondary"
            style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)' }}
            onClick={() => navigate('/admin/teams')}
          >
            <MdPeople size={18} /> Team Workspaces
          </button>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <SectionTitle
        title="Platform Metrics"
        description="Live aggregate metrics across all users, content, and connected networks."
      />
      <div className="admin-grid-kpis">
        {statCards.map((s) => (
          <StatsCard
            key={s.id}
            title={s.title}
            value={s.value}
            icon={s.icon}
            change={s.change}
            trend={s.trend}
          />
        ))}
      </div>

      {/* User Distribution & Quick Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {/* Role Breakdown Card */}
        <div className="admin-section" style={{ margin: 0 }}>
          <h2 className="admin-section-title" style={{ marginBottom: '1rem' }}>
            User Role Distribution
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span>Business Users (Clients)</span>
                <strong>{stats?.usersByRole?.business ?? 0}</strong>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${stats?.totalUsers ? ((stats.usersByRole.business / stats.totalUsers) * 100) : 0}%`,
                    background: '#10b981',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span>Marketing Teams</span>
                <strong>{stats?.usersByRole?.marketing ?? 0}</strong>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${stats?.totalUsers ? ((stats.usersByRole.marketing / stats.totalUsers) * 100) : 0}%`,
                    background: '#0ea5e9',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span>Content Creators</span>
                <strong>{stats?.usersByRole?.creator ?? 0}</strong>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${stats?.totalUsers ? ((stats.usersByRole.creator / stats.totalUsers) * 100) : 0}%`,
                    background: '#f59e0b',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span>Administrators</span>
                <strong>{stats?.usersByRole?.admin ?? 0}</strong>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${stats?.totalUsers ? ((stats.usersByRole.admin / stats.totalUsers) * 100) : 0}%`,
                    background: '#8b5cf6',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Audit Activities */}
        <div className="admin-section" style={{ margin: 0 }}>
          <div className="admin-section-header">
            <h2 className="admin-section-title">Recent System Activities</h2>
            <button
              className="admin-btn admin-btn-secondary"
              style={{ padding: '0.35rem 0.65rem' }}
              onClick={() => navigate('/admin/logs')}
            >
              View All <MdArrowForward size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentActivities.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No recent activities logged.</p>
            ) : (
              recentActivities.map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid #f1f5f9',
                    fontSize: '0.85rem',
                  }}
                >
                  <div>
                    <strong>{a.userName}</strong>: {a.activity}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {a.createdAt ? new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Users Table */}
      <div className="admin-section">
        <div className="admin-section-header">
          <div>
            <h2 className="admin-section-title">Recently Registered Users</h2>
            <p className="admin-section-subtitle">Quick overview of accounts on SocialPilot</p>
          </div>
          <button className="admin-btn admin-btn-primary" onClick={() => navigate('/admin/users')}>
            Manage All Users <MdArrowForward size={16} />
          </button>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Organization</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.fullName}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.email}</div>
                  </td>
                  <td>
                    <span
                      className={`admin-role-badge ${
                        u.role === 'Administrator'
                          ? 'admin-role-admin'
                          : u.role === 'Marketing Team'
                          ? 'admin-role-marketing'
                          : u.role === 'Content Creator'
                          ? 'admin-role-creator'
                          : 'admin-role-business'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td>{u.organization || '—'}</td>
                  <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}
