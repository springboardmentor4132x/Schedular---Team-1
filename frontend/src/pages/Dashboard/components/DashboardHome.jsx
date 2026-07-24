/**
 * DashboardHome.jsx
 *
 * The main /dashboard view. Sections:
 *   - Welcome card
 *   - Connected Platforms (full-width)
 *   - Sync Status | Recent Activity  (two-column)
 *   - Upcoming Posts (full-width, empty state)
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MdRefresh, MdCalendarToday } from 'react-icons/md';
import {
  FaInstagram, FaFacebookF, FaLinkedinIn,
  FaPinterestP, FaYoutube,
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { useApp } from '../../../context/AppContext';
import { getDashboard }        from '../../../services/dashboardService';
import { getConnectedAccounts } from '../../../services/socialService';
import { getActivity }          from '../../../services/activityService';
import './DashboardHome.css';

const PLATFORM_META = {
  instagram: { icon: <FaInstagram />, color: '#e1306c', label: 'Instagram' },
  facebook:  { icon: <FaFacebookF />, color: '#1877f2', label: 'Facebook'  },
  linkedin:  { icon: <FaLinkedinIn />,color: '#0a66c2', label: 'LinkedIn'  },
  pinterest: { icon: <FaPinterestP />,color: '#e60023', label: 'Pinterest' },
  youtube:   { icon: <FaYoutube />,   color: '#ff0000', label: 'YouTube'   },
  x:         { icon: <FaXTwitter />,  color: '#14171a', label: 'X'         },
};

const ROLE_LABELS = {
  content_creator: 'Content Creator',
  marketing_team:  'Marketing Team',
  business_user:   'Business User',
  administrator:   'Administrator',
};

function StatusBadge({ status }) {
  const labels = {
    connected:    'Connected',
    disconnected: 'Disconnected',
    syncing:      'Syncing',
    error:        'Error',
  };
  return (
    <span className={`sp-platform-badge sp-platform-badge--${status}`}>
      {labels[status] ?? status}
    </span>
  );
}

function formatRelative(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString();
}

function formatAbsolute(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function DashboardHome() {
  const { user } = useApp();
  const navigate = useNavigate();

  const [syncData,   setSyncData]   = useState(null);
  const [platforms,  setPlatforms]  = useState([]);
  const [activity,   setActivity]   = useState([]);
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [stats, setStats] = useState({
  total: 0,
  drafts: 0,
  scheduled: 0,
  published: 0,
});
const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const [dash, accts, acts, statsRes] = await Promise.all([
        getDashboard(),
        getConnectedAccounts(),
        getActivity(),
        axios.get("http://127.0.0.1:8000/posts/stats"),
      ]);
      const postsResponse = await fetch(
      "http://127.0.0.1:8000/posts?status=scheduled"
      );
      const posts = await postsResponse.json();

      setSyncData(dash.syncStatus);
      setPlatforms(accts);
      setActivity(acts);
      setStats(statsRes.data);
      setScheduledPosts(posts);
      setLoading(false);
    }
    load();
  }, []);

  const firstName      = user?.fullName?.split(' ')[0] ?? 'there';
  const connectedCount = platforms.filter((p) => p.status === 'connected').length;
  const filteredPosts = scheduledPosts.filter((post) =>
  post.title.toLowerCase().includes(search.toLowerCase())
);
  const handleDelete = async (id) => {
  try {
    await axios.delete(`http://127.0.0.1:8000/posts/${id}`);

    setScheduledPosts((prev) =>
      prev.filter((post) => post.id !== id)
    );

    setStats((prev) => ({
      ...prev,
      total: prev.total - 1,
      scheduled: prev.scheduled - 1,
    }));
  } catch (err) {
    console.error(err);
    alert("Failed to delete post");
  }
};
const handleEdit = (post) => {
  navigate("/create-post", {
    state: { post },
  });
};
const handlePublish = async (id) => {
  try {
    await axios.put(`http://127.0.0.1:8000/posts/${id}/publish`);

    alert("Post Published Successfully");

    setScheduledPosts((prev) =>
      prev.filter((post) => post.id !== id)
    );

    setStats((prev) => ({
      ...prev,
      scheduled: prev.scheduled - 1,
      published: prev.published + 1,
    }));
  } catch (error) {
    console.error(error);
    alert("Failed to publish post");
  }
};

  return (
    <div className="sp-dash">

      {/* ── Welcome ─────────────────────────────────────────────── */}
      <div className="sp-dash-welcome">
        <div className="sp-dash-welcome__avatar">
          {user?.fullName?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <div className="sp-dash-welcome__info">
          <h1 className="sp-dash-welcome__title">Hello, {firstName} 👋</h1>
          <p className="sp-dash-welcome__meta">
            {ROLE_LABELS[user?.role] ?? user?.role}
            {user?.orgName ? ` · ${user.orgName}` : ''}
          </p>
          <p className="sp-dash-welcome__last-login">
            Last login: {new Date().toLocaleString(undefined, {
              weekday: 'short', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    <div className="dashboard-stats">

  <div className="stat-card">
    <h3>Total Posts</h3>
    <p>{stats.total}</p>
  </div>

  <div className="stat-card">
    <h3>Drafts</h3>
    <p>{stats.drafts}</p>
  </div>

  <div className="stat-card">
    <h3>Scheduled</h3>
    <p>{stats.scheduled}</p>
  </div>

  <div className="stat-card">
    <h3>Published</h3>
    <p>{stats.published}</p>
  </div>

</div>  
      <div className="sp-dash-grid">

        {/* ── Connected Platforms (full-width) ───────────────────── */}
        <section className="sp-dash-card sp-dash-card--wide">
          <header className="sp-dash-card__header">
            <h2 className="sp-dash-card__title">Connected Platforms</h2>
            <button className="sp-dash-card__action" onClick={() => navigate('/connect-apps')}>
              Manage →
            </button>
          </header>

          {loading ? (
            <div className="sp-dash-skeleton-row">
              {[1, 2, 3].map((i) => <div key={i} className="sp-dash-skeleton" />)}
            </div>
          ) : (
            <div className="sp-platforms-list">
              {platforms.map((p) => {
                const meta = PLATFORM_META[p.platform] ?? {};
                return (
                  <div key={p.platform} className="sp-platform-row">
                    <span className="sp-platform-row__icon" style={{ color: meta.color }}>
                      {meta.icon}
                    </span>
                    <span className="sp-platform-row__name">{meta.label}</span>
                    <span className="sp-platform-row__account">{p.accountName ?? '—'}</span>
                    <span className="sp-platform-row__sync">
                      {p.lastSync ? `Synced ${formatRelative(p.lastSync)}` : 'Not synced'}
                    </span>
                    <StatusBadge status={p.status} />
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Sync Status ────────────────────────────────────────── */}
        <section className="sp-dash-card">
          <header className="sp-dash-card__header">
            <h2 className="sp-dash-card__title">Sync Status</h2>
            <MdRefresh className="sp-dash-card__icon" />
          </header>

          {loading ? (
            <div className="sp-dash-skeleton-col">
              {[1, 2, 3, 4].map((i) => <div key={i} className="sp-dash-skeleton" />)}
            </div>
          ) : (
            <ul className="sp-sync-list">
              <li className="sp-sync-item">
                <span>Last sync</span>
                <strong>{formatRelative(syncData?.lastSync)}</strong>
              </li>
              <li className="sp-sync-item">
                <span>Next sync</span>
                <strong>{formatAbsolute(syncData?.nextSync)}</strong>
              </li>
              <li className="sp-sync-item">
                <span>Connected accounts</span>
                <strong>{connectedCount} / {platforms.length}</strong>
              </li>
              <li className="sp-sync-item">
                <span>API health</span>
                <strong className={`sp-health sp-health--${syncData?.apiHealth ?? 'unknown'}`}>
                  {syncData?.apiHealth ?? 'Unknown'}
                </strong>
              </li>
            </ul>
          )}
        </section>

        {/* ── Recent Activity (right column, where Quick Actions was) */}
        <section className="sp-dash-card">
          <header className="sp-dash-card__header">
            <h2 className="sp-dash-card__title">Recent Activity</h2>
          </header>

          {loading ? (
            <div className="sp-dash-skeleton-col">
              {[1, 2, 3].map((i) => <div key={i} className="sp-dash-skeleton" />)}
            </div>
          ) : (
            <ul className="sp-activity-list">
              {activity.length === 0 ? (
                <li className="sp-activity-empty">No activity yet.</li>
              ) : (
                activity.map((a) => (
                  <li key={a.id} className="sp-activity-item">
                    <div className="sp-activity-dot" />
                    <div className="sp-activity-body">
                      <p className="sp-activity-text">
                        {a.activity}
                        {a.platform ? ` · ${a.platform}` : ''}
                      </p>
                      <p className="sp-activity-time">{formatRelative(a.createdAt)}</p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          )}
        </section>

        {/* ── Upcoming Scheduled Posts (full-width) ──────────────── */}
        <section className="sp-dash-card sp-dash-card--wide">
          <header className="sp-dash-card__header">
            <h2 className="sp-dash-card__title">Upcoming Scheduled Posts</h2>
          </header>
          <input
  type="text"
  placeholder="🔍 Search by title..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="search-box"
/>
          {scheduledPosts.length === 0 ? (
  <div className="sp-empty-state">
    <MdCalendarToday className="sp-empty-state__icon" />
    <p className="sp-empty-state__text">No scheduled posts yet.</p>
  </div>
) : (
  <table className="scheduled-table">
    <thead>
      <tr>
        <th>Title</th>
        <th>Platform</th>
        <th>Schedule Time</th>
        <th>Actions</th>
      </tr>
    </thead>

    <tbody>
      {scheduledPosts.map((post) => (
        <tr key={post.id}>
          <td>{post.title}</td>
          <td>{post.platform}</td>
          <td>{new Date(post.scheduled_time).toLocaleString()}</td>

          <td>
  <button
    className="edit-btn"
    onClick={() => handleEdit(post)}
  >
    Edit
  </button>

  <button
    className="publish-btn"
    onClick={() => handlePublish(post.id)}
  >
    Publish
  </button>

  <button
    className="delete-btn"
    onClick={() => handleDelete(post.id)}
  >
    Delete
  </button>
</td>
        </tr>
      ))}
    </tbody>
  </table>
)}
        </section>

      </div>
    </div>
  );
}
