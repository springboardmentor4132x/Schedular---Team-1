/**
 * adminService.js
 *
 * Full API client for administrator endpoints.
 */

import api from './api';

export const getAdminStats = async () => {
  const res = await api.get('/admin/stats');
  return res.data?.data || null;
};

export const getAdminUsers = async ({ search = '', role = '', skip = 0, limit = 50 } = {}) => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (role) params.append('role', role);
  params.append('skip', skip);
  params.append('limit', limit);
  const res = await api.get(`/admin/users?${params.toString()}`);
  return res.data || { items: [], total: 0 };
};

export const createAdminUser = async (userData) => {
  const res = await api.post('/admin/users', userData);
  return res.data;
};

export const getAdminUserDetails = async (userId) => {
  const res = await api.get(`/admin/users/${userId}`);
  return res.data?.data || null;
};

export const updateAdminUser = async (userId, userData) => {
  const res = await api.put(`/admin/users/${userId}`, userData);
  return res.data;
};

export const deleteAdminUser = async (userId) => {
  const res = await api.delete(`/admin/users/${userId}`);
  return res.data;
};

export const getAdminTeams = async () => {
  const res = await api.get('/admin/teams');
  return res.data?.items || [];
};

export const deleteAdminTeam = async (teamId) => {
  const res = await api.delete(`/admin/teams/${teamId}`);
  return res.data;
};

export const assignClientToTeam = async (teamId, businessUserId) => {
  const res = await api.post(`/admin/teams/${teamId}/assign-client`, {
    business_user_id: businessUserId,
  });
  return res.data;
};

export const getAdminLogs = async ({ skip = 0, limit = 50 } = {}) => {
  const res = await api.get(`/admin/logs?skip=${skip}&limit=${limit}`);
  return res.data || { activities: [], publishingEvents: [] };
};

export const getPlatformHealth = async () => {
  const res = await api.get('/admin/platform-health');
  return res.data?.platforms || [];
};

export default {
  getAdminStats,
  getAdminUsers,
  createAdminUser,
  getAdminUserDetails,
  updateAdminUser,
  deleteAdminUser,
  getAdminTeams,
  deleteAdminTeam,
  assignClientToTeam,
  getAdminLogs,
  getPlatformHealth,
};
