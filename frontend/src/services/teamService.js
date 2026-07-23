import api from './api';

export const listTeams = () => api.get('/teams').then((response) => response.data);
export const createTeam = (name) => api.post('/teams', { name }).then((response) => response.data);
export const inviteMember = (teamId, payload) => api.post(`/teams/${teamId}/members`, payload).then((response) => response.data);
export const removeMember = (teamId, memberId) => api.delete(`/teams/${teamId}/members/${memberId}`);
export const listClientWorkspaces = () => api.get('/clients').then((response) => response.data);
