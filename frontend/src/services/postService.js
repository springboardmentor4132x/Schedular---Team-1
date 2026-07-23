import api from './api';

const postService = {
  getPosts: async (skip = 0, limit = 100) => {
    const { data } = await api.get(`/api/v1/posts/?skip=${skip}&limit=${limit}`);
    return data;
  },
  createPost: async (postData) => {
    const { data } = await api.post('/api/v1/posts/', postData);
    return data;
  },
  getPost: async (postId) => {
    const { data } = await api.get(`/api/v1/posts/${postId}`);
    return data;
  },
  updatePost: async (postId, postData) => {
    const { data } = await api.put(`/api/v1/posts/${postId}`, postData);
    return data;
  },
  deletePost: async (postId) => {
    const { data } = await api.delete(`/api/v1/posts/${postId}`);
    return data;
  },
  publishNow: async (postId) => {
    const { data } = await api.post(`/api/v1/posts/${postId}/publish-now`);
    return data;
  },
  cancelSchedule: async (postId) => {
    const { data } = await api.post(`/api/v1/posts/${postId}/cancel-schedule`);
    return data;
  }
};

export default postService;
