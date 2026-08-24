/**
 * AdminTeamsPage.jsx
 *
 * Team and Client Workspace Management for Administrators.
 * Features: View all teams, assign clients directly to teams, delete teams.
 */

import { useState, useEffect } from 'react';
import {
  MdPeople,
  MdBusiness,
  MdDelete,
  MdAddLink,
  MdCheckCircle,
  MdError,
  MdRefresh,
} from 'react-icons/md';
import PageContainer from '../../../components/PageContainer/PageContainer';
import SectionTitle from '../../../components/SectionTitle/SectionTitle';
import adminService from '../../../../../services/adminService';
import '../Admin.css';

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState([]);
  const [businessUsers, setBusinessUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Modals
  const [assignModalTeam, setAssignModalTeam] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [deleteModalTeam, setDeleteModalTeam] = useState(null);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [teamsData, usersData] = await Promise.all([
        adminService.getAdminTeams(),
        adminService.getAdminUsers({ role: 'Business User', limit: 100 }),
      ]);
      setTeams(teamsData || []);
      setBusinessUsers(usersData.items || []);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to load teams data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignClient = async (e) => {
    e.preventDefault();
    if (!assignModalTeam || !selectedClientId) return;
    try {
      await adminService.assignClientToTeam(assignModalTeam.id, parseInt(selectedClientId, 10));
      showToast('Client assigned to team successfully');
      setAssignModalTeam(null);
      setSelectedClientId('');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to assign client', 'error');
    }
  };

  const handleDeleteTeam = async () => {
    if (!deleteModalTeam) return;
    try {
      await adminService.deleteAdminTeam(deleteModalTeam.id);
      showToast(`Team ${deleteModalTeam.name} deleted`);
      setDeleteModalTeam(null);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete team', 'error');
    }
  };

  return (
    <PageContainer>
      <SectionTitle
        title="Teams & Client Oversight"
        description="Inspect all marketing workspaces, team memberships, and manage direct client assignments."
      />

      {notification && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            marginBottom: '1.5rem',
            borderRadius: '8px',
            background: notification.type === 'error' ? '#fee2e2' : '#dcfce7',
            color: notification.type === 'error' ? '#991b1b' : '#166534',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          {notification.type === 'error' ? <MdError size={20} /> : <MdCheckCircle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="admin-section">
        <div className="admin-section-header">
          <div>
            <h2 className="admin-section-title">All Team Workspaces ({teams.length})</h2>
            <p className="admin-section-subtitle">Active collaboration groups across the system</p>
          </div>
          <button className="admin-btn admin-btn-secondary" onClick={loadData}>
            <MdRefresh size={18} /> Refresh
          </button>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Team Name</th>
                <th>Owner / Lead</th>
                <th>Members</th>
                <th>Assigned Clients</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Loading teams...
                  </td>
                </tr>
              ) : teams.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No teams found on the platform.
                  </td>
                </tr>
              ) : (
                teams.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.name}</strong>
                    </td>
                    <td>
                      <div>
                        {t.owner?.name}
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{t.owner?.email}</div>
                      </div>
                    </td>
                    <td>
                      <span className="admin-role-badge admin-role-marketing">
                        <MdPeople style={{ marginRight: '4px' }} /> {t.memberCount} member(s)
                      </span>
                    </td>
                    <td>
                      {t.assignedClients?.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          {t.assignedClients.map((c) => (
                            <span
                              key={c.id}
                              className="admin-role-badge admin-role-business"
                              title={c.email}
                            >
                              <MdBusiness style={{ marginRight: '4px' }} />
                              {c.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>None assigned</span>
                      )}
                    </td>
                    <td>{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          className="admin-btn admin-btn-secondary"
                          style={{ padding: '0.35rem 0.65rem' }}
                          onClick={() => {
                            setAssignModalTeam(t);
                            setSelectedClientId(businessUsers[0]?.id ? String(businessUsers[0].id) : '');
                          }}
                          title="Assign Client directly"
                        >
                          <MdAddLink size={16} /> Assign Client
                        </button>
                        <button
                          className="admin-btn admin-btn-outline-danger"
                          style={{ padding: '0.35rem 0.65rem' }}
                          onClick={() => setDeleteModalTeam(t)}
                          title="Delete Team"
                        >
                          <MdDelete size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ASSIGN CLIENT MODAL --- */}
      {assignModalTeam && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Assign Client to {assignModalTeam.name}</h3>
              <button className="admin-modal-close" onClick={() => setAssignModalTeam(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleAssignClient}>
              <div className="admin-modal-body">
                <p style={{ margin: '0 0 1rem 0', color: '#475569', fontSize: '0.875rem' }}>
                  As an Administrator, you can directly connect a registered Business User to this
                  marketing workspace without requiring request or approval cycles.
                </p>
                <div className="admin-form-group">
                  <label className="admin-form-label">Select Business User (Client) *</label>
                  <select
                    className="admin-form-select"
                    required
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                  >
                    <option value="">-- Choose a Business User --</option>
                    {businessUsers.map((bu) => (
                      <option key={bu.id} value={bu.id}>
                        {bu.fullName} ({bu.email}) {bu.organization ? `— ${bu.organization}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setAssignModalTeam(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedClientId}
                  className="admin-btn admin-btn-primary"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE TEAM MODAL --- */}
      {deleteModalTeam && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Confirm Team Deletion</h3>
              <button className="admin-modal-close" onClick={() => setDeleteModalTeam(null)}>
                &times;
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ margin: '0 0 1rem 0', color: '#334155' }}>
                Are you sure you want to permanently delete workspace{' '}
                <strong>{deleteModalTeam.name}</strong>?
              </p>
              <div
                style={{
                  background: '#fee2e2',
                  color: '#991b1b',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                }}
              >
                ⚠️ All team memberships and client links associated with this team will be unlinked.
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setDeleteModalTeam(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={handleDeleteTeam}
              >
                Delete Team
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
