/**
 * BusinessDashboard.jsx
 *
 * Business User Dashboard — HOME page only (10 sections).
 * The Business User is a MONITOR: no editing, scheduling, or deleting.
 * All actions are: View, Open, Inspect.
 *
 * Sections:
 *  1. Welcome Banner
 *  2. KPI Overview Cards (StatsCard)
 *  3. Campaign Overview Table
 *  4. Connected Platforms
 *  5. Scheduled Posts Preview
 *  6. Published Posts Preview
 *  7. Analytics Overview (bar charts)
 *  8. Reports
 *  9. Recent Activity Timeline
 * 10. Quick Insights (AI-like recommendations)
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdCampaign, MdSchedule, MdCheckCircle, MdLink,
  MdDescription, MdOpenInNew, MdTrendingUp,
} from 'react-icons/md';
import { useApp } from '../../../../context/AppContext';
import { resolveRole, ROLE_LABELS } from '../../shared/constants';
import { getConnectedAccounts } from '../../../../services/socialService';
import campaignService from '../../../../services/campaignService';
import postService from '../../../../services/postService';
import { getDashboardSummary } from '../../../../services/dashboardService';
import { getTeams } from '../../../../services/teamService';
import PageContainer   from '../../components/PageContainer/PageContainer';
import StatsCard       from '../../components/StatsCard/StatsCard';
import Avatar          from '../../components/Avatar/Avatar';
import SectionTitle    from '../../components/SectionTitle/SectionTitle';
const FALLBACK_PLATFORMS = [];
import './BusinessDashboard.css';

// ── Icon registry for platform logos ─────────────────────────────────────────
const STAT_ICONS = {
  campaigns:  <MdCampaign />,
  scheduled:  <MdSchedule />,
  published:  <MdCheckCircle />,
  platforms:  <MdLink />,
  analytics:  <MdTrendingUp />,
  reports:    <MdDescription />,
};

const PLATFORM_EMOJI = {
  facebook:  'f',
  instagram: '📷',
  linkedin:  'in',
  youtube:   '▶',
  x:         '✕',
  pinterest: 'P',
};

const PLATFORM_COLORS = {
  facebook:  '#1877F2',
  instagram: '#E1306C',
  linkedin:  '#0A66C2',
  youtube:   '#FF0000',
  x:         '#000000',
  pinterest: '#E60023',
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function greetingByHour() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatRelativeTime(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  if (hrs < 48) return 'Yesterday';
  return formatDate(iso);
}

function formatScheduleTime(iso) {
  const d = new Date(iso);
  const diff = d.getTime() - Date.now();
  if (diff < 0) return 'overdue';
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return 'in <1h';
  if (hrs < 24) return `in ${hrs}h`;
  return `in ${Math.floor(hrs / 24)}d`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 1 — Welcome Banner
// ─────────────────────────────────────────────────────────────────────────────
function WelcomeBanner({ user, summary }) {
  const role      = resolveRole(user?.role);
  const firstName = user?.fullName?.split(' ')[0] ?? 'User';
  const lastName  = user?.fullName?.split(' ').slice(1).join(' ') ?? '';
  const company   = user?.orgName ?? 'Your Company';
  const today     = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const activeCampaigns = summary?.activeCampaigns ?? 0;

  return (
    <div className="bd-welcome">
      <div className="bd-welcome__left">
        <span className="bd-welcome__greeting">{greetingByHour()} ☀️</span>
        <h1 className="bd-welcome__name">Welcome back, {company} 👋</h1>
        <div className="bd-welcome__meta">
          <span className="bd-welcome__role-badge">{ROLE_LABELS[role]}</span>
          <span className="bd-welcome__date">{today}</span>
        </div>
        <p className="bd-welcome__summary">
          Hi <strong>{firstName}</strong> — you have{' '}
          <strong>{activeCampaigns} active campaigns</strong> running across your connected platforms.
          Your marketing team is on it. 🚀
        </p>
      </div>
      <div className="bd-welcome__right">
        <div className="bd-welcome__avatar-wrap">
          <Avatar
            profileImage={user?.profileImage}
            firstName={firstName}
            lastName={lastName}
            size="xl"
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 3 — Campaign Overview Table
// ─────────────────────────────────────────────────────────────────────────────
function CampaignTable() {
  const [campaigns, setCampaigns] = useState([]);
  useEffect(() => {
    campaignService.getCampaigns().then(data => {
      if (data) setCampaigns(data);
    });
  }, []);

  return (
    <div className="bd-section-card">
      <div className="bd-section-card__header">
        <div>
          <h2 className="bd-section-card__title">Campaign Overview</h2>
          <p className="bd-section-card__subtitle">{campaigns.length} campaigns total</p>
        </div>
        <button className="bd-section-card__action">View All →</button>
      </div>
      <div className="bd-table-wrap">
        <table className="bd-table">
          <thead>
            <tr>
              <th>Campaign Name</th>
              <th>Status</th>
              <th>Progress</th>
              <th>Marketing Team</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => {
              const progress = c.status === 'active' ? 50 : (c.status === 'completed' ? 100 : 0);
              return (
                <tr key={c.id}>
                  <td><span className="bd-campaign-name">{c.name}</span></td>
                  <td>
                    <span className={`bd-status bd-status--${c.status}`}>
                      <span className="bd-status-dot" />
                      {c.status}
                    </span>
                  </td>
                  <td>
                    <div className="bd-progress-wrap">
                      <div className="bd-progress-bar">
                        <div className="bd-progress-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="bd-progress-pct">{progress}%</span>
                    </div>
                  </td>
                  <td><span className="bd-team">Assigned</span></td>
                  <td><span className="bd-date">{c.start_date ? formatDate(c.start_date) : 'TBD'}</span></td>
                  <td><span className="bd-date">{c.end_date ? formatDate(c.end_date) : 'TBD'}</span></td>
                  <td>
                    <button className="bd-view-btn">
                      <MdOpenInNew size={14} /> View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 4 — Connected Platforms
// ─────────────────────────────────────────────────────────────────────────────
function ConnectedPlatforms({ liveAccounts }) {
  // Merge mock data with live data (real connection status from the backend)
  const merged = FALLBACK_PLATFORMS.map((mp) => {
    const live = liveAccounts.find((a) => a.platform === mp.id);
    if (live) {
      return {
        ...mp,
        status:   live.status === 'connected' ? 'connected' : mp.status,
        lastSync: live.lastSync ?? mp.lastSync,
      };
    }
    return mp;
  });

  return (
    <div className="bd-section-card">
      <div className="bd-section-card__header">
        <div>
          <h2 className="bd-section-card__title">Connected Platforms</h2>
          <p className="bd-section-card__subtitle">
            {merged.filter((p) => p.status === 'connected').length} of {merged.length} platforms connected
          </p>
        </div>
        <button className="bd-section-card__action"
          onClick={() => (window.location.href = '/connect-apps')}
        >
          Manage Connections →
        </button>
      </div>
      <div className="bd-platforms-grid">
        {merged.map((platform) => (
          <div
            key={platform.id}
            className={`bd-platform-card${platform.status === 'disconnected' ? ' bd-platform-card--disconnected' : ''}`}
          >
            <div className="bd-platform-card__top">
              <div
                className="bd-platform-logo"
                style={{ background: platform.status === 'connected' ? platform.color : '#d1d5db' }}
              >
                {PLATFORM_EMOJI[platform.id]}
              </div>
              <div className={`bd-platform-card__status bd-platform-card__status--${platform.status}`}>
                <span className="bd-platform-card__status-dot" />
                {platform.status}
              </div>
            </div>
            <p className="bd-platform-card__name">{platform.label}</p>
            {platform.status === 'connected' ? (
              <>
                <p className="bd-platform-card__meta">
                  Last sync: {formatRelativeTime(platform.lastSync)}
                </p>
                {platform.reach && (
                  <p className="bd-platform-card__reach">🎯 {platform.reach} reach</p>
                )}
              </>
            ) : (
              <p className="bd-platform-card__meta">Not connected</p>
            )}
            <button
              className="bd-platform-card__btn"
              onClick={() => (window.location.href = '/connect-apps')}
            >
              {platform.status === 'connected' ? '🔍 Inspect' : '➕ Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 5 — Scheduled Posts Preview
// ─────────────────────────────────────────────────────────────────────────────
function ScheduledPostsPreview() {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    postService.getPosts().then(data => {
      if (data) setPosts(data.filter(p => p.status === 'scheduled').slice(0, 5));
    });
  }, []);

  return (
    <div className="bd-section-card">
      <div className="bd-section-card__header">
        <div>
          <h2 className="bd-section-card__title">Scheduled Posts</h2>
          <p className="bd-section-card__subtitle">Upcoming posts from your marketing team</p>
        </div>
      </div>
      <div className="bd-posts-list">
        {posts.map((post) => {
          let plat = 'facebook';
          try { const arr = JSON.parse(post.platforms); if (arr.length) plat = arr[0]; } catch { plat = 'facebook'; }
          return (
          <div key={post.id} className="bd-post-row">
            <div
              className="bd-post-platform-icon"
              style={{ background: PLATFORM_COLORS[plat] ?? '#6b7280' }}
            >
              {PLATFORM_EMOJI[plat]}
            </div>
            <div className="bd-post-content">
              <p className="bd-post-text">{post.caption || '(No caption)'}</p>
              <p className="bd-post-campaign">Scheduled</p>
            </div>
            <span className="bd-post-time">{formatScheduleTime(post.scheduled_for || new Date().toISOString())}</span>
            <span className={`bd-post-status-tag bd-post-status-tag--${post.status}`}>{post.status}</span>
          </div>
        )})}
      </div>
      <div className="bd-view-all-footer">
        <button className="bd-view-all-btn">View All Scheduled Posts →</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 6 — Published Posts Preview
// ─────────────────────────────────────────────────────────────────────────────
function PublishedPostsPreview() {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    postService.getPosts().then(data => {
      if (data) setPosts(data.filter(p => p.status === 'published').slice(0, 5));
    });
  }, []);

  return (
    <div className="bd-section-card">
      <div className="bd-section-card__header">
        <div>
          <h2 className="bd-section-card__title">Published Posts</h2>
          <p className="bd-section-card__subtitle">Recent content live on your platforms</p>
        </div>
      </div>
      <div className="bd-published-list">
        {posts.map((post) => {
          let plat = 'facebook';
          try { const arr = JSON.parse(post.platforms); if (arr.length) plat = arr[0]; } catch { plat = 'facebook'; }
          return (
          <div key={post.id} className="bd-published-row">
            <div
              className="bd-post-platform-icon"
              style={{ background: PLATFORM_COLORS[plat] ?? '#6b7280' }}
            >
              {PLATFORM_EMOJI[plat]}
            </div>
            <div className="bd-post-content">
              <p className="bd-post-text">{post.caption || '(No caption)'}</p>
              <p className="bd-post-campaign">{formatRelativeTime(post.scheduled_for || new Date().toISOString())}</p>
            </div>
            <div className="bd-published-metrics">
              <div className="bd-metric">
                <span className="bd-metric__label">Reach</span>
                <span className="bd-metric__value">0</span>
              </div>
              <div className="bd-metric">
                <span className="bd-metric__label">Engagement</span>
                <span className="bd-metric__value">0%</span>
              </div>
            </div>
            <button className="bd-view-post-btn"><MdOpenInNew size={16} /></button>
          </div>
        )})}
      </div>
    </div>
  );
}



// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Section — Managed By Marketing Team
// ─────────────────────────────────────────────────────────────────────────────
function ManagedBy({ summary }) {
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeams()
      .then((data) => {
        if (data && data.length > 0) {
          setTeam(data[0]);
        } else {
          setTeam(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setTeam(null);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="bd-section-card bd-managed-by">Loading marketing team status...</div>;
  }

  if (!team) {
    return (
      <div className="bd-section-card bd-managed-by" style={{ textAlign: 'center', padding: '24px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '16px' }}>No Marketing Team Assigned</h4>
        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#94a3b8' }}>
          Connect with a professional marketing team to start planning and publishing your content.
        </p>
        <button
          className="bd-managed-by__btn"
          style={{ float: 'none', display: 'inline-block' }}
          onClick={() => navigate('/business/marketing-teams')}
        >
          Discover Teams
        </button>
      </div>
    );
  }

  return (
    <div className="bd-section-card bd-managed-by">
      <div className="bd-managed-by__header">
        <div className="bd-managed-by__meta">
          <Avatar
            profileImage={null}
            firstName={team.name}
            lastName=""
            size="md"
          />
          <div>
            <h4 className="bd-managed-by__name">{team.name}</h4>
            <span className="bd-managed-by__status-badge">Managed By</span>
          </div>
        </div>
        <button
          className="bd-managed-by__btn"
          onClick={() => navigate('/business/marketing-teams')}
        >
          View Team
        </button>
      </div>
      <div className="bd-managed-by__details">
        <div className="bd-managed-by__detail-item">
          <span className="bd-managed-by__val">{summary?.activeCampaigns ?? 0}</span>
          <span className="bd-managed-by__lbl">Active Campaigns</span>
        </div>
        <div className="bt-my-team-stat" style={{ borderRight: '1px solid #f3f4f6', paddingRight: '16px' }}>
          <span className="bd-managed-by__val">{summary?.scheduledPosts ?? 0}</span>
          <span className="bd-managed-by__lbl">Scheduled Posts</span>
        </div>
        <div className="bd-managed-by__detail-item" style={{ flex: 1, minWidth: '150px' }}>
          <span className="bd-managed-by__val text-truncate" title="Active Relationship" style={{ display: 'block', maxWidth: '280px' }}>
            Active Relationship
          </span>
          <span className="bd-managed-by__lbl">Status</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root: BusinessDashboard — composed from all sections
// ─────────────────────────────────────────────────────────────────────────────
export default function BusinessDashboard() {
  const { user } = useApp();
  const [liveAccounts, setLiveAccounts] = useState([]);
  const [stats, setStats] = useState([]);
  const [summary, setSummary] = useState(null);

  // Fetch real connected account status from backend
  useEffect(() => {
    getConnectedAccounts().then(setLiveAccounts).catch(() => setLiveAccounts([]));
    getDashboardSummary().then(data => {
      if (data) {
        setSummary(data);
        setStats([
          { id: 'campaigns', title: 'Active Campaigns', value: data.activeCampaigns, change: 'Total: ' + data.campaigns, trend: 'up' },
          { id: 'scheduled', title: 'Scheduled Posts', value: data.scheduledPosts, change: 'In Queue', trend: 'neutral' },
          { id: 'published', title: 'Published Posts', value: data.publishedPosts, change: 'Lifetime', trend: 'up' },
          { id: 'platforms', title: 'Connected Platforms', value: data.connectedPlatforms, change: 'Sync active', trend: 'neutral' },
          { id: 'analytics', title: 'Unread Notifications', value: data.unreadNotifications, change: 'Pending alerts', trend: 'up' },
          { id: 'reports', title: 'Generated Reports', value: '0', change: 'View Reports', trend: 'neutral' },
        ]);
      }
    });
  }, []);

  return (
    <PageContainer>
      {/* S1 · Welcome Banner */}
      <WelcomeBanner user={user} summary={summary} />

      {/* Collaborating Marketing Team */}
      <ManagedBy summary={summary} />

      {/* S2 · KPI Overview Cards */}
      <SectionTitle
        title="Performance Overview"
        description="Real-time metrics across all your campaigns and platforms."
      />
      <div className="bd-stats-grid">
        {stats.map((s) => (
          <StatsCard
            key={s.id}
            title={s.title}
            value={s.value}
            icon={STAT_ICONS[s.id]}
            change={s.change}
            trend={s.trend}
          />
        ))}
      </div>

      {/* S3 · Campaign Overview */}
      <CampaignTable />

      {/* S4 · Connected Platforms */}
      <ConnectedPlatforms liveAccounts={liveAccounts} />

      {/* S5 · Scheduled Posts */}
      <ScheduledPostsPreview />

      {/* S6 · Published Posts */}
      <PublishedPostsPreview />
    </PageContainer>
  );
}
