/**
 * contentRepository.js
 *
 * Session cache/persistence repository for posts scheduling.
 * Provides APIs for filtering posts by status, client, platform, or campaign.
 */

import { INITIAL_MOCK_POSTS } from './contentMockData';

let posts = [...INITIAL_MOCK_POSTS];

export const contentRepository = {
  getPosts(filters = {}) {
    return posts.filter((post) => {
      if (filters.clientId !== undefined && post.clientId !== filters.clientId) {
        return false;
      }
      if (filters.ownerType !== undefined && post.ownerType !== filters.ownerType) {
        return false;
      }
      if (filters.ownerId !== undefined && post.ownerId !== filters.ownerId) {
        return false;
      }
      if (filters.status !== undefined && post.status !== filters.status) {
        return false;
      }
      if (filters.campaignId !== undefined && post.campaignId !== filters.campaignId) {
        return false;
      }
      if (filters.platform !== undefined && !post.platforms.includes(filters.platform)) {
        return false;
      }
      return true;
    });
  },

  getPostById(id) {
    return posts.find((p) => p.id === id);
  },

  createPost(postData) {
    const newPost = {
      ...postData,
      id: `post-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    posts = [newPost, ...posts];
    return newPost;
  },

  updatePost(id, updates) {
    posts = posts.map((p) =>
      p.id === id
        ? { ...p, ...updates, updatedAt: new Date().toISOString() }
        : p
    );
    return posts.find((p) => p.id === id);
  },

  deletePost(id) {
    posts = posts.filter((p) => p.id !== id);
  },

  assignCampaign(postId, campaignId) {
    return this.updatePost(postId, { campaignId });
  },

  removeCampaign(postId) {
    return this.updatePost(postId, { campaignId: null });
  }
};

export default contentRepository;
