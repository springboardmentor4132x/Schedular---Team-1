import api from './api';

const postService = {
  getPosts: async (skip = 0, limit = 100) => {
    const { data } = await api.get(`/posts?skip=${skip}&limit=${limit}`);
    return Array.isArray(data) ? data : (data && data.items ? data.items : []);
  },
  createPost: async (postData) => {
    const { data } = await api.post('/posts', postData);
    return data;
  },
  getPost: async (postId) => {
    const { data } = await api.get(`/posts/${postId}`);
    return data;
  },
  updatePost: async (postId, postData) => {
    const { data } = await api.put(`/posts/${postId}`, postData);
    return data;
  },
  deletePost: async (postId) => {
    const { data } = await api.delete(`/posts/${postId}`);
    return data;
  },
  publishNow: async (postId) => {
    const { data } = await api.post(`/posts/${postId}/publish`);
    return data;
  },
  cancelSchedule: async (postId) => {
    const { data } = await api.post(`/posts/${postId}/cancel-schedule`);
    return data;
  },
  uploadMedia: async (fileObj) => {
    const formData = new FormData();
    formData.append('file', fileObj);
    const { data } = await api.post('/media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },
  assignCampaign: async (postId, campaignId) => {
    const { data } = await api.patch(`/posts/${postId}/campaign`, { campaign_id: campaignId });
    return data;
  },
  removeCampaign: async (postId) => {
    const { data } = await api.patch(`/posts/${postId}/campaign`, { campaign_id: null });
    return data;
  },
  schedulePost: async (postId, scheduleData) => {
    const { data } = await api.post(`/posts/${postId}/schedule`, scheduleData);
    return data;
  }
};

export default postService;
