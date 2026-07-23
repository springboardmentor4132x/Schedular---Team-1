import api from './api';

/**
 * GET /settings
 */
export async function getSettings() {
  const { data } = await api.get('/settings');
  return data;
}

/**
 * PUT /settings
 * @param {string} section  - 'general' | 'notifications' | 'appearance'
 * @param {object} values   - section-specific key/value pairs
 */
export async function updateSettings(section, values) {
  try {
    const { data } = await api.put('/settings', { section, ...values });
    return { success: true, message: 'Settings saved.', data };
  } catch (err) {
    return { success: false, message: err.response?.data?.detail || 'Failed to save settings.' };
  }
}

/**
 * POST /auth/change-password
 */
export async function changePassword(currentPassword, newPassword) {
  try {
    const { data } = await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return { success: true, message: data.message || 'Password changed successfully.' };
  } catch (err) {
    return { success: false, message: err.response?.data?.detail || 'Failed to change password.' };
  }
}

/**
 * POST /auth/logout-all
 * Revokes all sessions except the current one.
 */
export async function logoutOtherDevices() {
  try {
    const { data } = await api.post('/auth/logout-all');
    return { success: true, message: data.message || 'All other sessions have been terminated.' };
  } catch (err) {
    return { success: false, message: err.response?.data?.detail || 'Failed to logout other devices.' };
  }
}

/**
 * POST /account/export
 */
export async function exportData() {
  try {
    const { data } = await api.post('/account/export');
    return { success: true, message: data.message || 'Export request submitted. You will receive an email shortly.' };
  } catch (err) {
    return { success: false, message: err.response?.data?.detail || 'Failed to initiate export.' };
  }
}

/**
 * DELETE /account
 */
export async function deleteAccount() {
  try {
    const { data } = await api.delete('/account');
    return { success: true, message: data.message || 'Account successfully deleted.' };
  } catch (err) {
    return { success: false, message: err.response?.data?.detail || 'Failed to delete account.' };
  }
}
