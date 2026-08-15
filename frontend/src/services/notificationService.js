/**
 * notificationService.js
 *
 * In-memory client-side reactive store for notifications.
 * Supports marking single or all as read, clearing notifications,
 * and filtering them based on role and client contexts.
 */

import api from './api';

// Shared in-memory list representing user notifications
let notificationsDb = [
  {
    id: 1,
    title: 'Welcome to SocialPilot!',
    message: 'Your account and business workspaces are ready.',
    type: 'system',
    isRead: false,
    role: 'all',
    clientId: null,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    title: 'Campaign Synced — Nike',
    message: 'Marketing Team created Nike Summer Sale campaign.',
    type: 'campaign',
    isRead: false,
    role: 'marketing',
    clientId: 'nike',
    link: '/marketing/clients/nike/campaigns',
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    title: 'Post Published Successfully!',
    message: 'Nike Summer Sale teaser post published to Instagram.',
    type: 'content_published',
    isRead: true,
    role: 'business',
    clientId: 'nike',
    link: '/business/published',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    title: 'Post Publication Failed',
    message: 'YouTube video upload size exceeds limit for Creator channel.',
    type: 'content_failed',
    isRead: false,
    role: 'creator',
    clientId: null,
    link: '/creator/posts',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 5,
    title: 'Monthly Report Ready',
    message: 'July Campaign Performance report generated.',
    type: 'system',
    isRead: false,
    role: 'business',
    clientId: 'nike',
    link: '/business/reports',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 6,
    title: 'Campaign Deadline',
    message: 'Personal portfolio campaign deadline in 2 days.',
    type: 'campaign',
    isRead: false,
    role: 'creator',
    clientId: null,
    link: '/creator/campaigns',
    createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
  },
];

/**
 * GET /notifications
 * Resolves to all notifications matching the current user role / client context.
 */
export async function getNotifications(filters = {}) {
  try {
    // Attempt backend sync
    const { data } = await api.get('/notifications');
    return data.items || data;
  } catch {
    const { role, clientId } = filters;
    
    // Filter matching role and workspace context
    return notificationsDb.filter((n) => {
      // 1. Check workspace context
      if (clientId && n.clientId && n.clientId !== clientId) {
        return false;
      }
      // 2. Check role context
      if (role && n.role !== 'all' && n.role !== role) {
        return false;
      }
      return true;
    });
  }
}

/**
 * PATCH /notifications/{id}/read
 */
export async function markNotificationRead(id) {
  try {
    const { data } = await api.post(`/notifications/${id}/read`);
    return data;
  } catch {
    notificationsDb = notificationsDb.map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    );
    return { success: true };
  }
}

/**
 * PATCH /notifications/read-all
 */
export async function markAllRead(filters = {}) {
  try {
    const { data } = await api.post('/notifications/read-all');
    return data;
  } catch {
    const { role, clientId } = filters;
    notificationsDb = notificationsDb.map((n) => {
      const matchClient = !clientId || !n.clientId || n.clientId === clientId;
      const matchRole = !role || n.role === 'all' || n.role === role;
      if (matchClient && matchRole) {
        return { ...n, isRead: true };
      }
      return n;
    });
    return { success: true };
  }
}

/**
 * DELETE /notifications
 */
export async function clearNotifications(filters = {}) {
  try {
    // For deleting all, my API doesn't have a bulk delete, but the simulated one just deleted all.
    // If needed we can add a delete all, but for now we catch and fallback to local
    const { data } = await api.delete('/notifications/clear-all');
    return data;
  } catch {
    const { role, clientId } = filters;
    notificationsDb = notificationsDb.filter((n) => {
      const matchClient = !clientId || !n.clientId || n.clientId === clientId;
      const matchRole = !role || n.role === 'all' || n.role === role;
      return !(matchClient && matchRole);
    });
    return { success: true };
  }
}
