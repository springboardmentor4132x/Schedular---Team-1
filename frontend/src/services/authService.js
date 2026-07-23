import axios from 'axios';

// ─── API Base URL ───────────────────────────────────────────────────────────
const API_URL = 'http://localhost:8000';

// ─── LocalStorage keys ────────────────────────────────────────────────────────
const SESSION_KEY = 'socialpilot_current_user';

// ─── Register ─────────────────────────────────────────────────────────────────
async function registerUser({ fullName, email, phone, country, orgName, role, password }) {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, {
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone,
      country,
      organization: orgName ? orgName.trim() : null,
      role,
      password,
    });

    const data = response.data;
    return {
      token: data.access_token,
      id: data.user.id,
      fullName: data.user.full_name,
      email: data.user.email,
      phone: data.user.phone,
      country: data.user.country,
      orgName: data.user.organization,
      role: data.user.role,
      profileImage: data.user.avatarUrl ?? null,
    };
  } catch (error) {
    if (error.response && error.response.status === 400) {
      const detail = error.response.data.detail;
      if (detail && detail.includes('Email')) {
        throw new Error('EMAIL_EXISTS', { cause: error });
      } else if (detail && detail.includes('Phone')) {
        throw new Error('PHONE_EXISTS', { cause: error });
      }
    }
    throw new Error('REGISTRATION_FAILED', { cause: error });
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────
async function loginUser(email, password) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: email.trim().toLowerCase(),
      password,
    });

    const data = response.data;
    // Map backend user response properties to the structure expected by the frontend
    return {
      token: data.access_token,
      id: data.user.id,
      fullName: data.user.full_name,
      email: data.user.email,
      phone: data.user.phone,
      country: data.user.country,
      orgName: data.user.organization,
      role: data.user.role,
      profileImage: data.user.avatarUrl ?? null,
    };
  } catch {
    // If invalid credentials or bad request, return null to match original loginUser behavior
    return null;
  }
}

// ─── Session management ───────────────────────────────────────────────────────
function saveSession(user, rememberMe = false) {
  const sessionData = JSON.stringify(user);

  if (rememberMe) {
    localStorage.setItem(SESSION_KEY, sessionData);
    sessionStorage.removeItem(SESSION_KEY);
  } else {
    sessionStorage.setItem(SESSION_KEY, sessionData);
    localStorage.removeItem(SESSION_KEY);
  }
}

function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

// ─── Export ───────────────────────────────────────────────────────────────────
const authService = {
  registerUser,
  loginUser,
  saveSession,
  getSession,
  clearSession,
};

export default authService;
