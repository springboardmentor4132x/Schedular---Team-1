/**
 * contentRepository.js
 *
 * Session cache/persistence repository for posts scheduling.
 * Provides APIs for filtering posts by status, client, platform, or campaign.
 */

import postService from '../../../../services/postService';

function _mapPost(post) {
  if (!post) return post;
  post.scheduledAt = post.scheduledFor || post.scheduled_for || null;
  const urls = post.mediaUrls || post.media_urls || [];
  post.media = urls.map((url, i) => {
    const name = url.split('/').pop();
    const isVid = name.endsWith('.mp4') || name.endsWith('.webm');
    return {
      id: `media-url-${i}`,
      type: isVid ? 'video' : 'image',
      name: name,
      previewUrl: url,
      size: 0
    };
  });
  return post;
}

export const contentRepository = {
  async getPosts(filters = {}) {
    const data = await postService.getPosts();
    const items = data.items || data || [];
    
    const mapped = items.map(_mapPost);
    
    // Apply client-side filters like mock repository did
    return mapped.filter((post) => {
      if (filters.clientId !== undefined && post.clientId !== filters.clientId && post.client_id !== filters.clientId) {
        return false;
      }
      if (filters.ownerId !== undefined && post.ownerId !== filters.ownerId && post.owner_id !== filters.ownerId) {
        return false;
      }
      if (filters.status !== undefined && post.status !== filters.status) {
        return false;
      }
      if (filters.campaignId !== undefined && post.campaignId !== filters.campaignId && post.campaign_id !== filters.campaignId) {
        return false;
      }
      if (filters.platform !== undefined) {
        const platformsList = post.platforms || [];
        if (!platformsList.includes(filters.platform)) {
          return false;
        }
      }
      return true;
    });
  },

  async getPostById(id) {
    const post = await postService.getPost(id);
    return _mapPost(post);
  },

  async createPost(postData) {
    // 1. Upload media files first (if any) and get their backend URLs
    const mediaUrls = [];
    if (postData.media && postData.media.length > 0) {
      for (const file of postData.media) {
        if (file.rawFile) {
          const uploaded = await postService.uploadMedia(file.rawFile);
          mediaUrls.push(uploaded.url);
        } else if (file.previewUrl && file.previewUrl.includes('/uploads/')) {
          const match = file.previewUrl.match(/\/uploads\/.+/);
          mediaUrls.push(match ? match[0] : file.previewUrl);
        }
      }
    }

    // Determine content type
    let contentType = 'text';
    if (mediaUrls.length === 1) {
      const firstFile = postData.media[0];
      contentType = firstFile.type === 'video' ? 'video' : 'image';
    } else if (mediaUrls.length > 1) {
      contentType = 'carousel';
    }

    // 2. Prepare backend payload in snake_case
    const backendPayload = {
      caption: postData.caption || '',
      content_type: contentType,
      media_urls: mediaUrls,
      platforms: postData.platforms || [],
      client_id: postData.clientId ? parseInt(postData.clientId, 10) : null,
      campaign_id: postData.campaignId ? parseInt(postData.campaignId, 10) : null,
      timezone: postData.timezone || 'UTC',
      recurrence_interval: postData.recurrenceInterval || null
    };

    // 3. Save post (FastAPI returns created draft post)
    let post = await postService.createPost(backendPayload);

    // 4. If status is scheduled, schedule it
    if (postData.status === 'scheduled' && postData.scheduledAt) {
      post = await postService.schedulePost(post.id, {
        scheduled_for: postData.scheduledAt,
        timezone: postData.timezone || 'UTC'
      });
    }

    return _mapPost(post);
  },

  async updatePost(id, updates) {
    // 1. Upload media files first (if any) and get their backend URLs
    const mediaUrls = [];
    if (updates.media && updates.media.length > 0) {
      for (const file of updates.media) {
        if (file.rawFile) {
          const uploaded = await postService.uploadMedia(file.rawFile);
          mediaUrls.push(uploaded.url);
        } else if (file.previewUrl && file.previewUrl.includes('/uploads/')) {
          const match = file.previewUrl.match(/\/uploads\/.+/);
          mediaUrls.push(match ? match[0] : file.previewUrl);
        }
      }
    }

    // Determine content type
    let contentType = 'text';
    if (mediaUrls.length === 1) {
      const firstFile = updates.media[0];
      contentType = firstFile.type === 'video' ? 'video' : 'image';
    } else if (mediaUrls.length > 1) {
      contentType = 'carousel';
    }

    const backendPayload = {
      caption: updates.caption || '',
      content_type: contentType,
      media_urls: mediaUrls,
      platforms: updates.platforms || [],
      client_id: updates.clientId ? parseInt(updates.clientId, 10) : null,
      campaign_id: updates.campaignId ? parseInt(updates.campaignId, 10) : null,
      timezone: updates.timezone || 'UTC',
      recurrence_interval: updates.recurrenceInterval || null
    };

    // Save updates
    let post = await postService.updatePost(id, backendPayload);

    // Handle scheduling status changes
    if (updates.status === 'scheduled' && updates.scheduledAt) {
      post = await postService.schedulePost(id, {
        scheduled_for: updates.scheduledAt,
        timezone: updates.timezone || 'UTC'
      });
    } else if (updates.status === 'draft') {
      try {
        post = await postService.cancelSchedule(id);
      } catch {
        // Post might already be draft or cancelled, safe to ignore
      }
    }

    return _mapPost(post);
  },

  async deletePost(id) {
    await postService.deletePost(id);
  },

  async assignCampaign(postId, campaignId) {
    const post = await postService.assignCampaign(postId, campaignId ? parseInt(campaignId, 10) : null);
    return _mapPost(post);
  },

  async removeCampaign(postId) {
    const post = await postService.removeCampaign(postId);
    return _mapPost(post);
  }
};

export default contentRepository;
