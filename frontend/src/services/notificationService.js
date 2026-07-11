/**
 * notificationService.js
 *
 * TODO: Connect to FastAPI endpoints when backend is ready.
 */

import api from './api';

/**
 * GET /notifications
 */
export async function getNotifications() {
  try {
    const { data } = await api.get('/notifications');
    return data;
  } catch {
    const now = Date.now();
    return [
      {
        id: 1,
        title: 'Welcome to SocialPilot!',
        message: 'Your account has been created successfully.',
        type: 'info',
        isRead: false,
        createdAt: new Date(now - 5 * 60 * 1000).toISOString(),
      },
      {
        id: 2,
        title: 'Complete Your Profile',
        message: 'Add a bio and profile photo to personalise your account.',
        type: 'warning',
        isRead: false,
        createdAt: new Date(now - 30 * 60 * 1000).toISOString(),
      },
      {
        id: 3,
        title: 'Connect Your Platforms',
        message: 'Link your social accounts to start scheduling content.',
        type: 'info',
        isRead: true,
        createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }
}

/**
 * PATCH /notifications/{id}/read
 */
export async function markNotificationRead(id) {
  try {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return data;
  } catch {
    return { success: true };
  }
}

/**
 * PATCH /notifications/read-all
 */
export async function markAllRead() {
  try {
    const { data } = await api.patch('/notifications/read-all');
    return data;
  } catch {
    return { success: true };
  }
}

/**
 * DELETE /notifications
 */
export async function clearNotifications() {
  try {
    const { data } = await api.delete('/notifications');
    return data;
  } catch {
    return { success: true };
  }
}
