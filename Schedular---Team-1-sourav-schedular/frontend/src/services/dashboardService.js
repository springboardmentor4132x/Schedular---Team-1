/**
 * dashboardService.js
 *
 * TODO: Connect to FastAPI endpoints when backend is ready.
 * Falls back to realistic mock data so the UI remains fully functional.
 */

import api from './api';

/**
 * GET /dashboard
 * Returns aggregated dashboard data: sync status, scheduled posts.
 */
export async function getDashboard() {
  try {
    const { data } = await api.get('/dashboard');
    return data;
  } catch {
    // Mock — backend not yet implemented
    const now = Date.now();
    return {
      syncStatus: {
        lastSync: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
        nextSync: new Date(now + 10 * 60 * 60 * 1000).toISOString(),
        totalConnected: 2,
        apiHealth: 'healthy',
      },
      scheduledPosts: [],
    };
  }
}
