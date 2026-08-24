/**
 * AdminUsersPage.jsx
 *
 * Full User Management Console for Administrators.
 * Features: Search, Role filtering, Create user, Edit Role/Details, Delete User.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  MdSearch,
  MdPersonAdd,
  MdEdit,
  MdDelete,
  MdRefresh,
  MdCheckCircle,
  MdError,
} from 'react-icons/md';
import PageContainer from '../../../components/PageContainer/PageContainer';
import SectionTitle from '../../../components/SectionTitle/SectionTitle';
import adminService from '../../../../../services/adminService';
import { useApp } from '../../../../../context/AppContext';
import '../Admin.css';

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'Administrator', label: 'Administrator' },
  { value: 'Marketing Team', label: 'Marketing Team' },
  { value: 'Content Creator', label: 'Content Creator' },
  { value: 'Business User', label: 'Business User' },
];

export default function AdminUsersPage() {
  const { user: currentUser } = useApp();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [notification, setNotification] = useState(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteTargetUser, setDeleteTargetUser] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'Content Creator',
    organization: '',
  });

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getAdminUsers({
        search,
        role: selectedRole,
        skip: 0,
        limit: 100,
      });
      setUsers(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, selectedRole]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await adminService.createAdminUser(formData);
      showToast('User created successfully');
      setShowAddModal(false);
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        role: 'Content Creator',
        organization: '',
      });
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to create user', 'error');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    try {
      await adminService.updateAdminUser(editUser.id, {
        full_name: editUser.fullName,
        email: editUser.email,
        phone: editUser.phone,
        role: editUser.role,
        organization: editUser.organization,
        password: editUser.newPassword || undefined,
      });
      showToast('User updated successfully');
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update user', 'error');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTargetUser) return;
    try {
      await adminService.deleteAdminUser(deleteTargetUser.id);
      showToast(`User ${deleteTargetUser.fullName} deleted`);
      setDeleteTargetUser(null);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete user', 'error');
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'Administrator':
        return 'admin-role-admin';
      case 'Marketing Team':
        return 'admin-role-marketing';
      case 'Content Creator':
        return 'admin-role-creator';
      case 'Business User':
        return 'admin-role-business';
      default:
        return 'admin-role-admin';
    }
  };

  return (
    <PageContainer>
      <SectionTitle
        title="User Management"
        description="Oversee and manage all user accounts, assign roles, and administer permissions."
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
            <h2 className="admin-section-title">All Users ({total})</h2>
            <p className="admin-section-subtitle">Real-time user accounts across the platform</p>
          </div>
          <div className="admin-table-controls">
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search name, email, org..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '2rem' }}
              />
              <MdSearch
                style={{
                  position: 'absolute',
                  left: '0.65rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                }}
              />
            </div>

            <select
              className="admin-select"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button className="admin-btn admin-btn-secondary" onClick={fetchUsers} title="Refresh">
              <MdRefresh size={18} />
            </button>

            <button
              className="admin-btn admin-btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <MdPersonAdd size={18} /> Add User
            </button>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Role</th>
                <th>Organization</th>
                <th>Phone</th>
                <th>Registered</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No users found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div>
                        <strong>{u.fullName}</strong>
                        {currentUser?.id === u.id && (
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#4f46e5' }}>
                            (You)
                          </span>
                        )}
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.email}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`admin-role-badge ${getRoleBadgeClass(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{u.organization || '—'}</td>
                    <td>{u.phone || '—'}</td>
                    <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          className="admin-btn admin-btn-secondary"
                          style={{ padding: '0.35rem 0.65rem' }}
                          onClick={() => setEditUser({ ...u, newPassword: '' })}
                          title="Edit Role / User"
                        >
                          <MdEdit size={16} /> Edit
                        </button>
                        {currentUser?.id !== u.id && (
                          <button
                            className="admin-btn admin-btn-outline-danger"
                            style={{ padding: '0.35rem 0.65rem' }}
                            onClick={() => setDeleteTargetUser(u)}
                            title="Delete User"
                          >
                            <MdDelete size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD USER MODAL --- */}
      {showAddModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Create New User</h3>
              <button className="admin-modal-close" onClick={() => setShowAddModal(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="admin-form-input"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="e.g. Jane Doe"
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    className="admin-form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane@example.com"
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Role *</label>
                  <select
                    className="admin-form-select"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="Marketing Team">Marketing Team</option>
                    <option value="Content Creator">Content Creator</option>
                    <option value="Business User">Business User</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Password * (min. 8 characters)</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    className="admin-form-input"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Temporary or initial password"
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Organization (Optional)</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="Company or Brand Name"
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Phone Number (Optional)</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1234567890"
                  />
                </div>
              </div>
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT USER MODAL --- */}
      {editUser && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Edit User ({editUser.fullName})</h3>
              <button className="admin-modal-close" onClick={() => setEditUser(null)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdateUser}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    className="admin-form-input"
                    value={editUser.fullName}
                    onChange={(e) => setEditUser({ ...editUser, fullName: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Email Address</label>
                  <input
                    type="email"
                    required
                    className="admin-form-input"
                    value={editUser.email}
                    onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Role</label>
                  <select
                    className="admin-form-select"
                    value={editUser.role}
                    onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="Marketing Team">Marketing Team</option>
                    <option value="Content Creator">Content Creator</option>
                    <option value="Business User">Business User</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Organization</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    value={editUser.organization || ''}
                    onChange={(e) => setEditUser({ ...editUser, organization: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Reset Password (Leave blank to keep current)</label>
                  <input
                    type="password"
                    minLength={8}
                    className="admin-form-input"
                    placeholder="New password"
                    value={editUser.newPassword}
                    onChange={(e) => setEditUser({ ...editUser, newPassword: e.target.value })}
                  />
                </div>
              </div>
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setEditUser(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE USER CONFIRM MODAL --- */}
      {deleteTargetUser && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Confirm User Deletion</h3>
              <button className="admin-modal-close" onClick={() => setDeleteTargetUser(null)}>
                &times;
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ margin: '0 0 1rem 0', color: '#334155' }}>
                Are you sure you want to permanently delete the account for{' '}
                <strong>{deleteTargetUser.fullName}</strong> ({deleteTargetUser.email})?
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
                ⚠️ This action cannot be undone. All associated posts, schedules, and memberships will
                be removed.
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setDeleteTargetUser(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                onClick={handleDeleteUser}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
