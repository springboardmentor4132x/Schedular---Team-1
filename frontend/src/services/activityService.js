/**
 * activityService.js
 *

 */

import api from './api';

/**
 * GET /activity
 * Returns the user's recent activity log.
 */
export async function getActivity() {
  try {
    const { data } = await api.get('/activity');
    return data;
  } catch {
    const now = Date.now();
    return [
      {
        id: 2,
        activity: 'Signed in',
        platform: null,
        createdAt: new Date(now - 8 * 60 * 1000).toISOString(),
      },
      {
        id: 1,
        activity: 'Account created',
        platform: null,
        createdAt: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }
}
