/**
 * SettingsPage.jsx  — /settings
 *
 * Tabs: General · Security · Notifications · Appearance · Privacy
 */

import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  getSettings, updateSettings,
  changePassword, logoutOtherDevices,
  exportData, deleteAccount,
} from '../../services/settingsService';
import './SettingsPage.css';

const TABS = ['General', 'Security', 'Notifications', 'Appearance', 'Privacy'];

const TIMEZONES = [
  'Asia/Kolkata', 'America/New_York', 'America/Chicago',
  'America/Los_Angeles', 'Europe/London', 'Europe/Paris',
  'Asia/Tokyo', 'Australia/Sydney', 'UTC',
];

function Toast({ message }) {
  if (!message) return null;
  return <div className="sp-st-toast">{message}</div>;
}

export default function SettingsPage() {
  const { theme, setTheme } = useApp();
  const [activeTab, setActiveTab] = useState('General');
  const [settings, setSettings]   = useState(null);
  const [toast, setToast]         = useState('');
  const [loading, setLoading]     = useState(true);

  // Change password local state
  const [pwForm, setPwForm]   = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwBusy, setPwBusy]   = useState(false);

  useEffect(() => {
    getSettings().then((data) => { setSettings(data); setLoading(false); });
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const save = async (section, values) => {
    const result = await updateSettings(section, values);
    if (result?.success !== false) showToast(result?.message ?? 'Saved.');
  };

  const handleGeneralChange = async (field, value) => {
    const updated = { ...settings.general, [field]: value };
    setSettings((s) => ({ ...s, general: updated }));
    await save('general', updated);
  };

  const handleNotifToggle = async (field) => {
    const updated = { ...settings.notifications, [field]: !settings.notifications[field] };
    setSettings((s) => ({ ...s, notifications: updated }));
    await save('notifications', updated);
  };

  const handleThemeChange = async (t) => {
    setTheme(t);
    const updated = { theme: t };
    setSettings((s) => ({ ...s, appearance: updated }));
    await save('appearance', updated);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pwForm.next !== pwForm.confirm) {
      setPwError('New passwords do not match.');
      return;
    }
    if (pwForm.next.length < 8) {
      setPwError('Password must be at least 8 characters.');
      return;
    }
    setPwBusy(true);
    const result = await changePassword(pwForm.current, pwForm.next);
    setPwBusy(false);
    if (result?.success !== false) {
      showToast(result?.message ?? 'Password changed.');
      setPwForm({ current: '', next: '', confirm: '' });
    } else {
      setPwError(result?.message ?? 'Failed to change password.');
    }
  };

  const handleLogoutOthers = async () => {
    const result = await logoutOtherDevices();
    showToast(result?.message ?? 'Done.');
  };

  const handleExport = async () => {
    const result = await exportData();
    showToast(result?.message ?? 'Export initiated.');
  };

  const handleDelete = async () => {
    if (!window.confirm(
      'This will permanently delete your account and all data. Are you absolutely sure?'
    )) return;
    const result = await deleteAccount();
    showToast(result?.message ?? 'Request received.');
  };

  if (loading) {
    return (
      <div className="sp-st-page">
        <div className="sp-st-skeleton" style={{ height: 200, borderRadius: 14 }} />
      </div>
    );
  }

  return (
    <div className="sp-st-page">
      <header className="sp-st-head">
        <h1 className="sp-st-heading">Account Settings</h1>
        <p className="sp-st-sub">Manage your preferences, security, and account details.</p>
      </header>

      <Toast message={toast} />

      {/* Tabs */}
      <div className="sp-st-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`sp-st-tab${activeTab === tab ? ' sp-st-tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── General ──────────────────────────────────────────── */}
      {activeTab === 'General' && (
        <section className="sp-st-section">
          <h2 className="sp-st-section-title">General</h2>
          <div className="sp-st-field-row">
            <label className="sp-st-label">Language</label>
            <select className="sp-st-select"
              value={settings.general.language}
              onChange={(e) => handleGeneralChange('language', e.target.value)}>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </div>
          <div className="sp-st-field-row">
            <label className="sp-st-label">Timezone</label>
            <select className="sp-st-select"
              value={settings.general.timezone}
              onChange={(e) => handleGeneralChange('timezone', e.target.value)}>
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
          <div className="sp-st-field-row">
            <label className="sp-st-label">Country</label>
            <select className="sp-st-select"
              value={settings.general.country}
              onChange={(e) => handleGeneralChange('country', e.target.value)}>
              <option value="IN">India</option>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="CA">Canada</option>
              <option value="AU">Australia</option>
            </select>
          </div>
        </section>
      )}

      {/* ── Security ─────────────────────────────────────────── */}
      {activeTab === 'Security' && (
        <section className="sp-st-section">
          <h2 className="sp-st-section-title">Change Password</h2>
          <form className="sp-st-pw-form" onSubmit={handleChangePassword} noValidate>
            <div className="sp-st-field">
              <label className="sp-st-label">Current Password</label>
              <input type="password" className="sp-st-input"
                value={pwForm.current}
                onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                autoComplete="current-password" />
            </div>
            <div className="sp-st-field">
              <label className="sp-st-label">New Password</label>
              <input type="password" className="sp-st-input"
                value={pwForm.next}
                onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
                autoComplete="new-password" />
            </div>
            <div className="sp-st-field">
              <label className="sp-st-label">Confirm New Password</label>
              <input type="password" className="sp-st-input"
                value={pwForm.confirm}
                onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                autoComplete="new-password" />
            </div>
            {pwError && <p className="sp-st-error">{pwError}</p>}
            <button type="submit" className="sp-st-btn sp-st-btn--primary" disabled={pwBusy}>
              {pwBusy ? 'Saving…' : 'Change Password'}
            </button>
          </form>

          <div className="sp-st-divider" />

          <h2 className="sp-st-section-title">Sessions</h2>
          <div className="sp-st-sessions">
            {settings.sessions?.map((s) => (
              <div key={s.id} className="sp-st-session-row">
                <div className="sp-st-session-info">
                  <p className="sp-st-session-device">{s.device} · {s.browser}</p>
                  <p className="sp-st-session-meta">{s.ipAddress} · Last active {new Date(s.lastActive).toLocaleDateString()}</p>
                </div>
                {s.isCurrent
                  ? <span className="sp-st-current-badge">Current</span>
                  : null}
              </div>
            ))}
          </div>
          <button className="sp-st-btn sp-st-btn--outline sp-st-mt" onClick={handleLogoutOthers}>
            Logout Other Devices
          </button>

          <div className="sp-st-divider" />
          <h2 className="sp-st-section-title">Two-Factor Authentication</h2>
          <p className="sp-st-hint">2FA setup requires backend implementation.</p>
          <button className="sp-st-btn sp-st-btn--outline" disabled>Enable 2FA</button>
        </section>
      )}

      {/* ── Notifications ────────────────────────────────────── */}
      {activeTab === 'Notifications' && (
        <section className="sp-st-section">
          <h2 className="sp-st-section-title">Notifications</h2>
          {[
            ['emailNotifications',  'Email Notifications', 'Receive updates and alerts via email'],
            ['pushNotifications',   'Push Notifications',  'Browser push notifications'],
            ['publishingAlerts',    'Publishing Alerts',   'Alerts when posts are published or fail'],
            ['campaignAlerts',      'Campaign Alerts',     'Updates on scheduled campaigns'],
            ['securityAlerts',      'Security Alerts',     'Sign-in attempts and account changes'],
          ].map(([key, label, desc]) => (
            <div key={key} className="sp-st-toggle-row">
              <div>
                <p className="sp-st-toggle-label">{label}</p>
                <p className="sp-st-toggle-desc">{desc}</p>
              </div>
              <button
                role="switch"
                aria-checked={settings.notifications[key]}
                className={`sp-st-toggle${settings.notifications[key] ? ' sp-st-toggle--on' : ''}`}
                onClick={() => handleNotifToggle(key)}
              >
                <span className="sp-st-toggle__thumb" />
              </button>
            </div>
          ))}
        </section>
      )}

      {/* ── Appearance ───────────────────────────────────────── */}
      {activeTab === 'Appearance' && (
        <section className="sp-st-section">
          <h2 className="sp-st-section-title">Theme</h2>
          <div className="sp-st-theme-grid">
            {['light', 'dark', 'system'].map((t) => (
              <button
                key={t}
                className={`sp-st-theme-btn${theme === t ? ' sp-st-theme-btn--active' : ''}`}
                onClick={() => handleThemeChange(t)}
              >
                <span className="sp-st-theme-icon">
                  {t === 'light' ? '☀️' : t === 'dark' ? '🌙' : '💻'}
                </span>
                <span className="sp-st-theme-label" style={{ textTransform: 'capitalize' }}>{t}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Privacy ──────────────────────────────────────────── */}
      {activeTab === 'Privacy' && (
        <section className="sp-st-section">
          <h2 className="sp-st-section-title">Data &amp; Privacy</h2>
          <div className="sp-st-privacy-actions">
            <div className="sp-st-privacy-row">
              <div>
                <p className="sp-st-toggle-label">Export My Data</p>
                <p className="sp-st-toggle-desc">Download a copy of all your account data.</p>
              </div>
              <button className="sp-st-btn sp-st-btn--outline" onClick={handleExport}>
                Export Data
              </button>
            </div>
            <div className="sp-st-privacy-row">
              <div>
                <p className="sp-st-toggle-label">Deactivate Account</p>
                <p className="sp-st-toggle-desc">Temporarily disable your account.</p>
              </div>
              <button className="sp-st-btn sp-st-btn--outline sp-st-btn--danger" disabled>
                Deactivate
              </button>
            </div>
            <div className="sp-st-privacy-row">
              <div>
                <p className="sp-st-toggle-label">Delete Account</p>
                <p className="sp-st-toggle-desc">Permanently delete your account and all data. This cannot be undone.</p>
              </div>
              <button className="sp-st-btn sp-st-btn--danger" onClick={handleDelete}>
                Delete Account
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
