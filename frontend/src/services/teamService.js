import api from './api';

export async function getTeams() {
  const { data } = await api.get('/teams');
  return data;
}

export async function createTeam(teamData) {
  const { data } = await api.post('/teams', teamData);
  return data;
}

export async function getClients() {
  const { data } = await api.get('/clients');
  return data;
}

export async function discoverMarketingTeams() {
  const { data } = await api.get('/marketing-teams/discover');
  return data;
}

export async function getCollaborationRequests() {
  const { data } = await api.get('/collaboration-requests');
  return data;
}

export async function sendCollaborationRequest(requestData) {
  const { data } = await api.post('/collaboration-requests', requestData);
  return data;
}

export async function updateCollaborationRequest(requestId, statusUpdate) {
  const { data } = await api.patch(`/collaboration-requests/${requestId}`, statusUpdate);
  return data;
}

export async function revokeCollaborationRequest(requestId) {
  const { data } = await api.post(`/collaboration-requests/${requestId}/revoke`);
  return data;
}

export async function discoverBusinesses() {
  const { data } = await api.get('/clients/discover');
  return data;
}
