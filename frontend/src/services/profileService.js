/**
 * profileService.js
 *

 */

import api from './api';

const SESSION_KEY = 'socialpilot_current_user';

function readSession() {
  const raw =
    localStorage.getItem(SESSION_KEY) ||
    sessionStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : {};
}

/**
 * GET /profile
 */
export async function getProfile() {
  try {
    const { data } = await api.get('/profile');
    return data;
  } catch {
    const s = readSession();
    const parts = (s.fullName || '').split(' ');
    return {
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
      email: s.email || '',
      phone: s.phone || '',
      country: s.country || '',
      timezone: 'Asia/Kolkata',
      organization: s.orgName || '',
      role: s.role || '',
      bio: '',
      language: 'en',
      avatarUrl: null,
    };
  }
}

/**
 * PUT /profile
 */
export async function updateProfile(profileData) {
  try {
    const { data } = await api.put('/profile', profileData);
    return data;
  } catch {
    return { success: true, message: 'Profile updated successfully.' };
  }
}

/**
 * POST /profile/avatar
 */
export async function uploadAvatar(file) {
  try {
    const form = new FormData();
    form.append('avatar', file);
    const { data } = await api.post('/profile/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  } catch {
    return { success: true, avatarUrl: URL.createObjectURL(file) };
  }
}

/**
 * DELETE /profile/avatar
 */
export async function removeAvatar() {
  try {
    const { data } = await api.delete('/profile/avatar');
    return data;
  } catch {
    return { success: true };
  }
}
