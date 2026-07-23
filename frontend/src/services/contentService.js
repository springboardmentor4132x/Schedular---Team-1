import api from './api';

export const listPosts = (params = {}) => api.get('/posts', { params }).then((r) => r.data);
export const createPost = (payload) => api.post('/posts', payload).then((r) => r.data);
export const updatePost = (id, payload) => api.put(`/posts/${id}`, payload).then((r) => r.data);
export const removePost = (id) => api.delete(`/posts/${id}`);
export const schedulePost = (id, payload) => api.post(`/posts/${id}/schedule`, payload).then((r) => r.data);
export const cancelPost = (id) => api.post(`/posts/${id}/cancel`).then((r) => r.data);
export const getQueue = () => api.get('/queue').then((r) => r.data);
export const uploadMedia = (file) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/media', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
};
export const listCampaigns = () => api.get('/campaigns').then((r) => r.data);
export const createCampaign = (payload) => api.post('/campaigns', payload).then((r) => r.data);
export const getCampaign = (id) => api.get(`/campaigns/${id}`).then((r) => r.data);
export const updateCampaign = (id, payload) => api.put(`/campaigns/${id}`, payload).then((r) => r.data);
export const removeCampaign = (id) => api.delete(`/campaigns/${id}`);
export const assignPosts = (id, post_ids) => api.post(`/campaigns/${id}/posts`, { post_ids }).then((r) => r.data);
export const removeCampaignPost = (campaignId, postId) => api.delete(`/campaigns/${campaignId}/posts/${postId}`);
