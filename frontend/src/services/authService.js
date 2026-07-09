// ─── LocalStorage keys ────────────────────────────────────────────────────────
const USERS_KEY = 'socialpilot_users';
const SESSION_KEY = 'socialpilot_current_user';

// ─── SHA-256 password hashing via Web Crypto API ─────────────────────────────
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

// ─── Unique ID generator ──────────────────────────────────────────────────────
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// ─── User storage helpers ─────────────────────────────────────────────────────
function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// ─── Duplicate lookup ─────────────────────────────────────────────────────────
function findUserByEmail(email) {
  const normalized = email.trim().toLowerCase();
  return getUsers().find((u) => u.email === normalized) || null;
}

function findUserByPhone(phone) {
  return getUsers().find((u) => u.phone === phone) || null;
}

// ─── Register ─────────────────────────────────────────────────────────────────
async function registerUser({ fullName, email, phone, country, orgName, role, password }) {
  const normEmail = email.trim().toLowerCase();

  if (findUserByEmail(normEmail)) {
    throw new Error('EMAIL_EXISTS');
  }

  if (findUserByPhone(phone)) {
    throw new Error('PHONE_EXISTS');
  }

  const passwordHash = await hashPassword(password);

  const newUser = {
    id: generateId(),
    fullName: fullName.trim(),
    email: normEmail,
    phone,
    country,
    orgName: orgName ? orgName.trim() : '',
    role,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  const users = getUsers();
  users.push(newUser);
  saveUsers(users);

  return newUser;
}

// ─── Login ────────────────────────────────────────────────────────────────────
async function loginUser(email, password) {
  const normEmail = email.trim().toLowerCase();
  const users = getUsers();
  const user = users.find((u) => u.email === normEmail);

  if (!user) return null;

  const passwordHash = await hashPassword(password);
  if (user.passwordHash !== passwordHash) return null;

  return user;
}

// ─── Session management ───────────────────────────────────────────────────────
function saveSession(user, rememberMe = false) {
  // Store only safe, non-sensitive fields
  const sessionData = JSON.stringify({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    country: user.country,
    orgName: user.orgName,
  });

  if (rememberMe) {
    // Persists across browser restarts
    localStorage.setItem(SESSION_KEY, sessionData);
    sessionStorage.removeItem(SESSION_KEY);
  } else {
    // Cleared when tab/browser closes
    sessionStorage.setItem(SESSION_KEY, sessionData);
    localStorage.removeItem(SESSION_KEY);
  }
}

function getSession() {
  try {
    const raw =
      localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
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
  findUserByEmail,
  findUserByPhone,
  saveSession,
  getSession,
  clearSession,
};

export default authService;
