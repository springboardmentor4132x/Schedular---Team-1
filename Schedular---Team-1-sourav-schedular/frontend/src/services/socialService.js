/**
 * socialService.js
 *
 * TODO: Connect to FastAPI endpoints when backend is ready.
 * OAuth flows (connect) will open a popup or redirect — URLs are backend-provided.
 */

import api from './api';

export const PLATFORMS = ['facebook', 'instagram', 'linkedin', 'pinterest', 'youtube', 'x'];

/**
 * GET /social/accounts
 * Returns array of connected social account objects.
 */
export async function getConnectedAccounts() {
  try {
    const { data } = await api.get('/social/accounts');
    return data;
  } catch {
    return PLATFORMS.map((platform) => ({
      platform,
      status: 'disconnected',   // 'connected' | 'disconnected' | 'syncing' | 'error'
      accountName: null,
      accountEmail: null,
      lastSync: null,
      permissions: [],
    }));
  }
}

/**
 * POST /social/connect/{platform}
 * Initiates OAuth connection for the given platform.
 */
export async function connectPlatform(platform) {
  try {
    const { data } = await api.post(`/social/connect/${platform}`);
    return data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.detail ?? `Could not start ${platform} OAuth.`,
    };
  }
}

/**
 * POST /social/disconnect/{platform}
 */
export async function disconnectPlatform(platform) {
  try {
    const { data } = await api.post(`/social/disconnect/${platform}`);
    return data;
  } catch (error) {
    return { success: false, message: error.response?.data?.detail ?? `Could not disconnect ${platform}.` };
  }
}

/**
 * POST /social/refresh/{platform}
 * Refreshes the access token for the given platform.
 */
export async function refreshPlatform(platform) {
  try {
    const { data } = await api.post(`/social/refresh/${platform}`);
    return data;
  } catch (error) {
    return { success: false, message: error.response?.data?.detail ?? `Could not refresh ${platform} token.` };
  }
}

/**
 * GET /social/accounts/{platform}
 * Returns detailed info for a single connected platform.
 */
export async function getPlatformDetails(platform) {
  try {
    const { data } = await api.get(`/social/accounts/${platform}`);
    return data;
  } catch {
    return { platform, status: 'disconnected', permissions: [], history: [] };
  }
}
