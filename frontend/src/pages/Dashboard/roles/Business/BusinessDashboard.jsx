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
import PageContainer   from '../../components/PageContainer/PageContainer';
import StatsCard       from '../../components/StatsCard/StatsCard';
import Avatar          from '../../components/Avatar/Avatar';
import SectionTitle    from '../../components/SectionTitle/SectionTitle';
import {
  MOCK_STATS, MOCK_CAMPAIGNS, MOCK_PLATFORMS,
  MOCK_SCHEDULED, MOCK_PUBLISHED,
  MOCK_CAMPAIGN_PERF, MOCK_PLATFORM_DIST, MOCK_WEEKLY_ENG, MOCK_FOLLOWERS,
  MOCK_REPORTS, MOCK_ACTIVITY, MOCK_INSIGHTS,
} from './BusinessDashboardMockData';
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
function WelcomeBanner({ user }) {
  const role      = resolveRole(user?.role);
  const firstName = user?.fullName?.split(' ')[0] ?? 'User';
  const lastName  = user?.fullName?.split(' ').slice(1).join(' ') ?? '';
  const company   = user?.orgName ?? 'Your Company';
  const today     = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const activeCampaigns = MOCK_STATS.find((s) => s.id === 'campaigns')?.value ?? '0';

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
  return (
    <div className="bd-section-card">
      <div className="bd-section-card__header">
        <div>
          <h2 className="bd-section-card__title">Campaign Overview</h2>
          <p className="bd-section-card__subtitle">{MOCK_CAMPAIGNS.length} campaigns total</p>
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
            {MOCK_CAMPAIGNS.map((c) => (
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
                      <div className="bd-progress-fill" style={{ width: `${c.progress}%` }} />
                    </div>
                    <span className="bd-progress-pct">{c.progress}%</span>
                  </div>
                </td>
                <td><span className="bd-team">{c.team}</span></td>
                <td><span className="bd-date">{formatDate(c.startDate)}</span></td>
                <td><span className="bd-date">{formatDate(c.endDate)}</span></td>
                <td>
                  <button className="bd-view-btn">
                    <MdOpenInNew size={14} /> View
                  </button>
                </td>
              </tr>
            ))}
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
  const merged = MOCK_PLATFORMS.map((mp) => {
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
  return (
    <div className="bd-section-card">
      <div className="bd-section-card__header">
        <div>
          <h2 className="bd-section-card__title">Scheduled Posts</h2>
          <p className="bd-section-card__subtitle">Upcoming posts from your marketing team</p>
        </div>
      </div>
      <div className="bd-posts-list">
        {MOCK_SCHEDULED.map((post) => (
          <div key={post.id} className="bd-post-row">
            <div
              className="bd-post-platform-icon"
              style={{ background: PLATFORM_COLORS[post.platform] ?? '#6b7280' }}
            >
              {PLATFORM_EMOJI[post.platform]}
            </div>
            <div className="bd-post-content">
              <p className="bd-post-text">{post.content}</p>
              <p className="bd-post-campaign">{post.campaign}</p>
            </div>
            <span className="bd-post-time">{formatScheduleTime(post.scheduledAt)}</span>
            <span className={`bd-post-status-tag bd-post-status-tag--${post.status}`}>{post.status}</span>
          </div>
        ))}
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
  return (
    <div className="bd-section-card">
      <div className="bd-section-card__header">
        <div>
          <h2 className="bd-section-card__title">Published Posts</h2>
          <p className="bd-section-card__subtitle">Recent content live on your platforms</p>
        </div>
      </div>
      <div className="bd-published-list">
        {MOCK_PUBLISHED.map((post) => (
          <div key={post.id} className="bd-published-row">
            <div
              className="bd-post-platform-icon"
              style={{ background: PLATFORM_COLORS[post.platform] ?? '#6b7280' }}
            >
              {PLATFORM_EMOJI[post.platform]}
            </div>
            <div className="bd-post-content">
              <p className="bd-post-text">{post.content}</p>
              <p className="bd-post-campaign">{formatRelativeTime(post.publishedAt)}</p>
            </div>
            <div className="bd-published-metrics">
              <div className="bd-metric">
                <span className="bd-metric__label">Reach</span>
                <span className="bd-metric__value">{post.reach}</span>
              </div>
              <div className="bd-metric">
                <span className="bd-metric__label">Likes</span>
                <span className="bd-metric__value">{post.likes}</span>
              </div>
              <div className="bd-metric">
                <span className="bd-metric__label">Comments</span>
                <span className="bd-metric__value">{post.comments}</span>
              </div>
            </div>
            <button className="bd-view-btn">
              <MdOpenInNew size={14} /> View
            </button>
          </div>
        ))}
      </div>
      <div className="bd-view-all-footer">
        <button className="bd-view-all-btn">View All Published Posts →</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 7 — Analytics Overview
// ─────────────────────────────────────────────────────────────────────────────
function BarChart({ data, maxValue }) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="bd-bar-chart">
      {data.map((item) => (
        <div key={item.label} className="bd-bar-item">
          <div className="bd-bar-label-row">
            <span className="bd-bar-label">{item.label}</span>
            <span className="bd-bar-value">{item.value}{maxValue === 100 ? '%' : ''}</span>
          </div>
          <div className="bd-bar-track">
            <div
              className="bd-bar-fill"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function PlatformDistribution() {
  const total = MOCK_PLATFORM_DIST.reduce((s, d) => s + d.value, 0);
  return (
    <div className="bd-donut-list">
      {MOCK_PLATFORM_DIST.map((item) => (
        <div key={item.label} className="bd-donut-item">
          <div className="bd-donut-dot" style={{ background: item.color }} />
          <span className="bd-donut-label">{item.label}</span>
          <div className="bd-donut-track">
            <div
              className="bd-donut-fill"
              style={{ width: `${(item.value / total) * 100}%`, background: item.color }}
            />
          </div>
          <span className="bd-donut-pct">{item.value}%</span>
        </div>
      ))}
    </div>
  );
}

function WeeklyEngagement() {
  const max = Math.max(...MOCK_WEEKLY_ENG.map((d) => d.value), 1);
  return (
    <div className="bd-line-chart">
      {MOCK_WEEKLY_ENG.map((d) => (
        <div key={d.label} className="bd-line-col">
          <div
            className="bd-line-bar"
            style={{ height: `${(d.value / max) * 72}px` }}
          />
          <span className="bd-line-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function FollowersGrowth() {
  const max = Math.max(...MOCK_FOLLOWERS.map((d) => d.value), 1);
  return (
    <div className="bd-line-chart">
      {MOCK_FOLLOWERS.map((d) => (
        <div key={d.label} className="bd-line-col">
          <div
            className="bd-line-bar"
            style={{
              height: `${(d.value / max) * 72}px`,
              background: 'linear-gradient(180deg, #10b981, #6ee7b7)',
            }}
          />
          <span className="bd-line-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function AnalyticsOverview() {
  return (
    <div className="bd-analytics-grid">
      <div className="bd-chart-card">
        <h3 className="bd-chart-card__title">📊 Campaign Performance</h3>
        <BarChart data={MOCK_CAMPAIGN_PERF} maxValue={100} />
      </div>
      <div className="bd-chart-card">
        <h3 className="bd-chart-card__title">🌐 Platform Distribution</h3>
        <PlatformDistribution />
      </div>
      <div className="bd-chart-card">
        <h3 className="bd-chart-card__title">📈 Weekly Engagement</h3>
        <WeeklyEngagement />
      </div>
      <div className="bd-chart-card">
        <h3 className="bd-chart-card__title">👥 Followers Growth</h3>
        <FollowersGrowth />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 8 — Reports
// ─────────────────────────────────────────────────────────────────────────────
function ReportsSection() {
  return (
    <div className="bd-section-card">
      <div className="bd-section-card__header">
        <div>
          <h2 className="bd-section-card__title">Reports</h2>
          <p className="bd-section-card__subtitle">
            {MOCK_REPORTS.filter((r) => r.type === 'campaign' || r.type === 'monthly').length} reports available
          </p>
        </div>
        <button className="bd-section-card__action">View All Reports →</button>
      </div>
      <div className="bd-reports-list">
        {MOCK_REPORTS.map((report) => (
          <div key={report.id} className="bd-report-row">
            <div className="bd-report-icon">{report.icon}</div>
            <div className="bd-report-info">
              <p className="bd-report-name">{report.name}</p>
              <p className="bd-report-meta">{formatDate(report.date)} · {report.size}</p>
            </div>
            <span className={`bd-report-type-tag bd-report-type-tag--${report.type}`}>
              {report.type}
            </span>
            <button className="bd-report-download-btn">📥 View Report</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 9 — Recent Activity Timeline
// ─────────────────────────────────────────────────────────────────────────────
function ActivityTimeline() {
  return (
    <div className="bd-section-card">
      <div className="bd-section-card__header">
        <div>
          <h2 className="bd-section-card__title">Recent Activity</h2>
          <p className="bd-section-card__subtitle">Your team's latest actions</p>
        </div>
      </div>
      <div className="bd-timeline">
        {MOCK_ACTIVITY.map((item) => (
          <div key={item.id} className="bd-timeline-item">
            <div className="bd-timeline-icon">{item.icon}</div>
            <div className="bd-timeline-content">
              <p className="bd-timeline-text">{item.text}</p>
              <p className="bd-timeline-time">{formatRelativeTime(item.time)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 10 — Quick Insights
// ─────────────────────────────────────────────────────────────────────────────
function QuickInsights() {
  return (
    <div className="bd-section-card">
      <div className="bd-section-card__header">
        <div>
          <h2 className="bd-section-card__title">Quick Insights</h2>
          <p className="bd-section-card__subtitle">AI-powered recommendations from your data</p>
        </div>
      </div>
      <div className="bd-insights-grid">
        {MOCK_INSIGHTS.map((insight) => (
          <div key={insight.id} className={`bd-insight-card bd-insight-card--${insight.type}`}>
            <span className="bd-insight-icon">{insight.icon}</span>
            <div className="bd-insight-body">
              <p className="bd-insight-title">{insight.title}</p>
              <p className="bd-insight-text">{insight.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// Section — Managed By Marketing Team
// ─────────────────────────────────────────────────────────────────────────────
function ManagedBy() {
  const navigate = useNavigate();
  const myTeam = {
    name: 'Growth Labs Media',
    profileImage: null,
    status: 'Approved',
    activeCampaigns: 3,
    scheduledPosts: 12,
    lastActivity: 'Scheduled Instagram Reel today at 6:00 PM',
  };

  return (
    <div className="bd-section-card bd-managed-by">
      <div className="bd-managed-by__header">
        <div className="bd-managed-by__meta">
          <Avatar
            profileImage={myTeam.profileImage}
            firstName={myTeam.name}
            lastName=""
            size="md"
          />
          <div>
            <h4 className="bd-managed-by__name">{myTeam.name}</h4>
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
          <span className="bd-managed-by__val">{myTeam.activeCampaigns}</span>
          <span className="bd-managed-by__lbl">Active Campaigns</span>
        </div>
        <div className="bt-my-team-stat" style={{ borderRight: '1px solid #f3f4f6', paddingRight: '16px' }}>
          <span className="bd-managed-by__val">{myTeam.scheduledPosts}</span>
          <span className="bd-managed-by__lbl">Scheduled Posts</span>
        </div>
        <div className="bd-managed-by__detail-item" style={{ flex: 1, minWidth: '150px' }}>
          <span className="bd-managed-by__val text-truncate" title={myTeam.lastActivity} style={{ display: 'block', maxWidth: '280px' }}>
            {myTeam.lastActivity}
          </span>
          <span className="bd-managed-by__lbl">Last Activity</span>
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

  // Fetch real connected account status from backend
  useEffect(() => {
    getConnectedAccounts().then(setLiveAccounts).catch(() => setLiveAccounts([]));
  }, []);

  return (
    <PageContainer>
      {/* S1 · Welcome Banner */}
      <WelcomeBanner user={user} />

      {/* Collaborating Marketing Team */}
      <ManagedBy />

      {/* S2 · KPI Overview Cards */}
      <SectionTitle
        title="Performance Overview"
        description="Real-time metrics across all your campaigns and platforms."
      />
      <div className="bd-stats-grid">
        {MOCK_STATS.map((s) => (
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

      {/* S7 · Analytics */}
      <SectionTitle
        title="Analytics Overview"
        description="Aggregated performance data across all connected platforms."
      />
      <AnalyticsOverview />

      {/* S8 · Reports */}
      <ReportsSection />

      {/* S9 · Activity */}
      <ActivityTimeline />

      {/* S10 · Insights */}
      <QuickInsights />
    </PageContainer>
  );
}
