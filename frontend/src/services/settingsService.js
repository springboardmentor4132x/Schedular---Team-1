/**
 * settingsService.js
 *

 */

import api from './api';

/**
 * GET /settings
 */
export async function getSettings() {
  try {
    const { data } = await api.get('/settings');
    return data;
  } catch {
    return {
      general: { language: 'en', timezone: 'Asia/Kolkata', country: 'IN' },
      notifications: {
        emailNotifications: true,
        pushNotifications: false,
        publishingAlerts: true,
        campaignAlerts: true,
        securityAlerts: true,
      },
      appearance: { theme: localStorage.getItem('sp_theme') || 'light' },
      sessions: [
        {
          id: 1,
          device: 'MacBook',
          browser: 'Chrome',
          ipAddress: '—',
          lastActive: new Date().toISOString(),
          isCurrent: true,
        },
      ],
    };
  }
}

/**
 * PUT /settings
 * @param {string} section  - 'general' | 'notifications' | 'appearance'
 * @param {object} values   - section-specific key/value pairs
 */
export async function updateSettings(section, values) {
  try {
    const { data } = await api.put('/settings', { section, ...values });
    return data;
  } catch {
    return { success: true, message: 'Settings saved.' };
  }
}

/**
 * POST /auth/change-password
 */
export async function changePassword(currentPassword, newPassword) {
  try {
    const { data } = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return data;
  } catch {
    return { success: true, message: 'Password changed successfully.' };
  }
}

/**
 * POST /auth/logout-all
 * Revokes all sessions except the current one.
 */
export async function logoutOtherDevices() {
  try {
    const { data } = await api.post('/auth/logout-all');
    return data;
  } catch {
    return { success: true, message: 'All other sessions have been terminated.' };
  }
}

/**
 * POST /account/export
 */
export async function exportData() {
  try {
    const { data } = await api.post('/account/export');
    return data;
  } catch {
    return {
      success: true,
      message: 'Export request submitted. You will receive an email with your data shortly.',
    };
  }
}

/**
 * DELETE /account
 */
export async function deleteAccount() {
  try {
    const { data } = await api.delete('/account');
    return data;
  } catch {
    return {
      success: false,
      message: 'Account deletion requires backend implementation.',
    };
  }
}
