/**
 * publishingService.js
 *
 * Backend API service for Module 5 — Publishing.
 * All methods call the real FastAPI backend.
 * Mock data fallback is handled in publishingMockData.js — NOT here.
 */

import api from './api';

const publishingService = {
  /** Trigger the publishing worker to process all due posts immediately. */
  runDue: async () => {
    const { data } = await api.post('/publishing/run-due');
    return data;
  },

  /** Get publishing logs (derived from posts with their statuses). */
  getPublishingLogs: async (skip = 0, limit = 100) => {
    const { data } = await api.get(`/posts?skip=${skip}&limit=${limit}`);
    return Array.isArray(data) ? data : (data?.items ?? []);
  },

  /** Get all posts in the publishing queue (status = scheduled or queued). */
  getQueue: async () => {
    const { data } = await api.get('/queue');
    return Array.isArray(data) ? data : (data?.items ?? []);
  },

  /** Get failed posts (status = failed). */
  getFailedPosts: async () => {
    const { data } = await api.get('/posts?skip=0&limit=200');
    const items = Array.isArray(data) ? data : (data?.items ?? []);
    return items.filter((p) => p.status === 'failed');
  },

  /** Retry a failed post (re-schedule it). */
  retryPost: async (postId) => {
    const { data } = await api.post(`/posts/${postId}/schedule`, {
      scheduled_for: new Date().toISOString(),
      timezone: 'UTC',
    });
    return data;
  },

  /** Delete a post. */
  deletePost: async (postId) => {
    const { data } = await api.delete(`/posts/${postId}`);
    return data;
  },

  /** Get social accounts connected to the current user. */
  getSocialAccounts: async () => {
    const { data } = await api.get('/social/accounts');
    return Array.isArray(data) ? data : [];
  },
};

export default publishingService;
