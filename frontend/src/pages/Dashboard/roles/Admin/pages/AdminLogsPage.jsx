/**
 * AdminLogsPage.jsx
 *
 * System Audit Trail & Publishing Diagnostics for Administrators.
 */

import { useState, useEffect } from 'react';
import {
  MdHistory,
  MdPublish,
  MdCheckCircle,
  MdError,
  MdRefresh,
  MdHealthAndSafety,
} from 'react-icons/md';
import PageContainer from '../../../components/PageContainer/PageContainer';
import SectionTitle from '../../../components/SectionTitle/SectionTitle';
import adminService from '../../../../../services/adminService';
import '../Admin.css';

export default function AdminLogsPage() {
  const [activities, setActivities] = useState([]);
  const [publishingEvents, setPublishingEvents] = useState([]);
  const [platformHealth, setPlatformHealth] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsData, healthData] = await Promise.all([
        adminService.getAdminLogs({ skip: 0, limit: 50 }),
        adminService.getPlatformHealth(),
      ]);
      setActivities(logsData.activities || []);
      setPublishingEvents(logsData.publishingEvents || []);
      setPlatformHealth(healthData || []);
    } catch (err) {
      console.error('Failed to load system logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <PageContainer>
      <SectionTitle
        title="System Audit & Health Logs"
        description="Comprehensive audit trail of platform events, publishing activity, and provider health status."
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="admin-btn admin-btn-secondary" onClick={loadData}>
          <MdRefresh size={18} /> Refresh Logs
        </button>
      </div>

      {/* Platform Health Overview */}
      <div className="admin-section">
        <div className="admin-section-header">
          <div>
            <h2 className="admin-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MdHealthAndSafety color="#4f46e5" size={22} /> Platform Connection Health
            </h2>
            <p className="admin-section-subtitle">Real-time status across connected social providers</p>
          </div>
        </div>

        <div className="admin-health-grid">
          {platformHealth.map((p) => (
            <div key={p.platform} className="admin-health-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <strong style={{ textTransform: 'capitalize' }}>{p.platform}</strong>
                <span
                  className={`admin-health-status ${
                    p.status === 'Operational' ? 'admin-health-operational' : 'admin-health-degraded'
                  }`}
                >
                  {p.status}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                <div>Active Accounts: <strong>{p.activeAccounts}</strong></div>
                <div>Failed Retries: <strong>{p.failedAttempts}</strong></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Activity Logs */}
      <div className="admin-section">
        <div className="admin-section-header">
          <div>
            <h2 className="admin-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MdHistory color="#0ea5e9" size={22} /> System Audit Trail ({activities.length})
            </h2>
            <p className="admin-section-subtitle">Actions performed across all roles</p>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Role</th>
                <th>Action / Activity</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Loading audit trail...
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No audit records found.
                  </td>
                </tr>
              ) : (
                activities.map((a) => (
                  <tr key={a.id}>
                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      {a.createdAt ? new Date(a.createdAt).toLocaleString() : '—'}
                    </td>
                    <td>
                      <strong>{a.userName}</strong>
                    </td>
                    <td>
                      <span className="admin-role-badge admin-role-admin" style={{ fontSize: '0.7rem' }}>
                        {a.userRole}
                      </span>
                    </td>
                    <td>{a.activity}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Publishing Logs */}
      <div className="admin-section">
        <div className="admin-section-header">
          <div>
            <h2 className="admin-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MdPublish color="#10b981" size={22} /> Publishing Attempts & Errors ({publishingEvents.length})
            </h2>
            <p className="admin-section-subtitle">Real-time delivery status of scheduled content</p>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Attempted At</th>
                <th>Platform</th>
                <th>Post Snippet</th>
                <th>Status</th>
                <th>Error Message</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Loading publishing logs...
                  </td>
                </tr>
              ) : publishingEvents.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No publishing events recorded.
                  </td>
                </tr>
              ) : (
                publishingEvents.map((pe) => (
                  <tr key={pe.id}>
                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      {pe.attemptedAt ? new Date(pe.attemptedAt).toLocaleString() : '—'}
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>
                      <strong>{pe.platform}</strong>
                    </td>
                    <td>{pe.caption || '—'}</td>
                    <td>
                      <span
                        className={`admin-role-badge ${
                          pe.status === 'published' ? 'admin-role-business' : 'admin-role-creator'
                        }`}
                      >
                        {pe.status}
                      </span>
                    </td>
                    <td style={{ color: pe.errorMessage ? '#ef4444' : '#64748b', fontSize: '0.8rem' }}>
                      {pe.errorMessage || 'None'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageContainer>
  );
}
