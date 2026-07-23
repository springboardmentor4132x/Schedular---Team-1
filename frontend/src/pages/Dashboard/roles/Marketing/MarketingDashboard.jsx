/**
 * MarketingDashboard.jsx
 *
 * Marketing Team Dashboard — HOME page only (10 sections).
 * Marketing Team CAN perform actions: Create, Manage, Continue, Schedule.
 *
 * Sections:
 *  1. Welcome Banner (purple gradient — active workspace feel)
 *  2. KPI Overview Cards (StatsCard)
 *  3. My Clients (interactive client cards)
 *  4. Today's Schedule (timeline)
 *  5. Running Campaigns (table with Manage actions)
 *  6. Draft Content (edit-ready cards)
 *  7. Publishing Queue (upcoming posts)
 *  8. Team Notifications (approval, alerts, messages)
 *  9. Performance Snapshot (mini charts)
 * 10. Quick Actions (large shortcut cards)
 */

import { useState, useCallback } from 'react';
import {
  MdPeople, MdCampaign, MdDrafts, MdSchedule, MdQueue, MdRateReview,
  MdAdd, MdCalendarMonth, MdManageAccounts, MdTune,
  MdEditNote, MdFolderOpen,
} from 'react-icons/md';
import { useApp }           from '../../../../context/AppContext';
import { resolveRole, ROLE_LABELS } from '../../shared/constants';
import PageContainer        from '../../components/PageContainer/PageContainer';
import StatsCard            from '../../components/StatsCard/StatsCard';
import Avatar               from '../../components/Avatar/Avatar';
import SectionTitle         from '../../components/SectionTitle/SectionTitle';
import {
  MOCK_MKT_STATS, MOCK_CLIENTS, MOCK_TODAY_SCHEDULE,
  MOCK_MKT_CAMPAIGNS, MOCK_DRAFTS, MOCK_QUEUE,
  MOCK_MKT_NOTIFICATIONS,
  MOCK_WEEKLY_POSTS, MOCK_MKT_PLATFORM_DIST,
  MOCK_CAMPAIGN_SUCCESS, MOCK_MKT_ENGAGEMENT,
} from './MarketingDashboardMockData';
import './MarketingDashboard.css';

// ── Constants ────────────────────────────────────────────────────────────────
const STAT_ICONS = {
  clients:   <MdPeople />,
  campaigns: <MdCampaign />,
  drafts:    <MdDrafts />,
  scheduled: <MdSchedule />,
  queue:     <MdQueue />,
  reviews:   <MdRateReview />,
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
  x:         '#111827',
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
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function formatRelative(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatAhead(iso) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'Now';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `in ${hrs}h`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 1 — Welcome Banner
// ─────────────────────────────────────────────────────────────────────────────
function WelcomeBanner({ user }) {
  const role      = resolveRole(user?.role);
  const firstName = user?.fullName?.split(' ')[0] ?? 'there';
  const lastName  = user?.fullName?.split(' ').slice(1).join(' ') ?? '';
  const today     = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const totalClients  = MOCK_MKT_STATS.find((s) => s.id === 'clients')?.value ?? '0';
  const todayQueue    = MOCK_MKT_STATS.find((s) => s.id === 'queue')?.value ?? '0';
  const runCampaigns  = MOCK_MKT_STATS.find((s) => s.id === 'campaigns')?.value ?? '0';

  return (
    <div className="md-welcome">
      <div className="md-welcome__left">
        <div className="md-welcome__eyebrow">
          <span className="md-welcome__greeting">{greetingByHour()} ⚡</span>
          <span className="md-welcome__role-badge">{ROLE_LABELS[role]}</span>
        </div>
        <h1 className="md-welcome__name">{firstName} 👋</h1>
        <p className="md-welcome__date">{today}</p>
        <p className="md-welcome__summary">
          You're managing <strong>{totalClients} clients</strong> with{' '}
          <strong>{runCampaigns} active campaigns</strong>.{' '}
          <strong>{todayQueue} posts</strong> are queued for today.
        </p>
        <div className="md-welcome__stats">
          <div className="md-welcome__stat">
            <span className="md-welcome__stat-value">{runCampaigns}</span>
            <span className="md-welcome__stat-label">Live Campaigns</span>
          </div>
          <div className="md-welcome__stat">
            <span className="md-welcome__stat-value">{todayQueue}</span>
            <span className="md-welcome__stat-label">Today's Queue</span>
          </div>
          <div className="md-welcome__stat">
            <span className="md-welcome__stat-value">
              {MOCK_MKT_NOTIFICATIONS.filter((n) => !n.isRead).length}
            </span>
            <span className="md-welcome__stat-label">Unread Alerts</span>
          </div>
        </div>
      </div>
      <div className="md-welcome__right">
        <div className="md-welcome__avatar-ring">
          <Avatar
            profileImage={user?.profileImage}
            firstName={firstName}
            lastName={lastName}
            size="lg"
          />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 3 — My Clients
// ─────────────────────────────────────────────────────────────────────────────
function MyClients() {
  const healthClass = (health) => {
    if (health >= 85) return '';
    if (health >= 70) return 'md-client-health-fill--warn';
    return 'md-client-health-fill--low';
  };

  return (
    <div className="md-card">
      <div className="md-card__header">
        <div className="md-card__title-group">
          <h2 className="md-card__title">My Clients</h2>
          <p className="md-card__subtitle">{MOCK_CLIENTS.length} active accounts</p>
        </div>
        <button className="md-card__action md-card__action--primary">
          <MdAdd size={15} /> Add Client
        </button>
      </div>
      <div className="md-clients-grid">
        {MOCK_CLIENTS.map((client) => (
          <div
            key={client.id}
            className="md-client-card"
            style={{ '--client-color': client.logoColor }}
          >
            {/* Top row: logo + status */}
            <div className="md-client-card__top">
              <Avatar
                profileImage={client.profileImage}
                firstName={client.name}
                lastName=""
                size="md"
              />
              <div className={`md-client-status md-client-status--${client.status}`}>
                <span className="md-client-status-dot" />
                {client.status}
              </div>
            </div>

            {/* Name + tagline */}
            <div>
              <p className="md-client-card__name">{client.name}</p>
              <p className="md-client-card__tagline">"{client.tagline}"</p>
            </div>

            {/* Meta: campaigns + platforms */}
            <div className="md-client-card__meta">
              <div className="md-client-meta-item">
                <span className="md-client-meta-item__label">Campaigns</span>
                <span className="md-client-meta-item__value">{client.campaigns}</span>
              </div>
              <div className="md-client-meta-item">
                <span className="md-client-meta-item__label">Platforms</span>
                <span className="md-client-meta-item__value">{client.platforms.length}</span>
              </div>
            </div>

            {/* Platform dots */}
            <div className="md-client-platforms">
              {client.platforms.map((p) => (
                <div
                  key={p}
                  className="md-client-platform-dot"
                  style={{ background: PLATFORM_COLORS[p] ?? '#6b7280' }}
                  title={p}
                >
                  {PLATFORM_EMOJI[p]}
                </div>
              ))}
            </div>

            {/* Health bar */}
            <div className="md-client-health-bar">
              <div className="md-client-health-track">
                <div
                  className={`md-client-health-fill ${healthClass(client.health)}`}
                  style={{ width: `${client.health}%` }}
                />
              </div>
              <span className="md-client-health-pct">{client.health}%</span>
            </div>

            <button className="md-client-card__btn">
              Open Workspace →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 4 — Today's Schedule Timeline
// ─────────────────────────────────────────────────────────────────────────────
function TodaySchedule() {
  return (
    <div className="md-card">
      <div className="md-card__header">
        <div className="md-card__title-group">
          <h2 className="md-card__title">Today's Schedule</h2>
          <p className="md-card__subtitle">
            {MOCK_TODAY_SCHEDULE.length} posts across all clients
          </p>
        </div>
        <button className="md-card__action md-card__action--ghost">
          Open Calendar →
        </button>
      </div>

      <div className="md-timeline-wrap">
        {MOCK_TODAY_SCHEDULE.map((item) => {
          const [hh, mm] = item.time.split(':');
          const h = parseInt(hh, 10);
          const suffix = h >= 12 ? 'PM' : 'AM';
          const display = `${h > 12 ? h - 12 : h === 0 ? 12 : h}:${mm}`;

          return (
            <div key={item.id} className="md-schedule-item">
              <div className="md-schedule-time-col">
                <span className="md-schedule-time">{display}</span>
                <span className="md-schedule-ampm">{suffix}</span>
              </div>

              <div
                className="md-schedule-icon"
                style={{ background: PLATFORM_COLORS[item.platform] ?? '#6b7280' }}
              >
                {PLATFORM_EMOJI[item.platform]}
              </div>

              <div className="md-schedule-content">
                <div className="md-schedule-row1">
                  <span className="md-schedule-type">
                    {item.platform.charAt(0).toUpperCase() + item.platform.slice(1)} {item.type}
                  </span>
                  <span className="md-schedule-client-tag">{item.client}</span>
                </div>
                <p className="md-schedule-caption">{item.caption}</p>
              </div>

              <span className={`md-schedule-status-tag md-schedule-status-tag--${item.status}`}>
                {item.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 5 — Running Campaigns Table
// ─────────────────────────────────────────────────────────────────────────────
function RunningCampaigns() {
  return (
    <div className="md-card">
      <div className="md-card__header">
        <div className="md-card__title-group">
          <h2 className="md-card__title">Running Campaigns</h2>
          <p className="md-card__subtitle">{MOCK_MKT_CAMPAIGNS.length} campaigns assigned to you</p>
        </div>
        <button className="md-card__action md-card__action--primary">
          <MdAdd size={15} /> Create Campaign
        </button>
      </div>
      <div className="md-table-wrap">
        <table className="md-table">
          <thead>
            <tr>
              <th>Campaign</th>
              <th>Client</th>
              <th>Progress</th>
              <th>Platforms</th>
              <th>Deadline</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {MOCK_MKT_CAMPAIGNS.map((c) => (
              <tr key={c.id}>
                <td>
                  <div>
                    <span className="md-campaign-name">{c.name}</span>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                      {c.postsLeft} posts remaining
                    </div>
                  </div>
                </td>
                <td>
                  <span
                    className="md-campaign-client-tag"
                    style={{ background: c.clientColor }}
                  >
                    {c.client}
                  </span>
                </td>
                <td>
                  <div className="md-progress-wrap">
                    <div className="md-progress-bar">
                      <div className="md-progress-fill" style={{ width: `${c.progress}%` }} />
                    </div>
                    <span className="md-progress-pct">{c.progress}%</span>
                  </div>
                </td>
                <td>
                  <div className="md-platforms-chips">
                    {c.platforms.map((p) => (
                      <div
                        key={p}
                        className="md-platform-chip"
                        style={{ background: PLATFORM_COLORS[p] ?? '#6b7280' }}
                        title={p}
                      >
                        {PLATFORM_EMOJI[p]}
                      </div>
                    ))}
                  </div>
                </td>
                <td>
                  <span className="md-date-cell">{formatDate(c.deadline)}</span>
                </td>
                <td>
                  <span className={`md-status-badge md-status-badge--${c.status}`}>
                    <span className="md-status-dot" />
                    {c.status}
                  </span>
                </td>
                <td>
                  <button className="md-manage-btn">
                    <MdTune size={14} /> Manage
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
// Section 6 — Draft Content Cards
// ─────────────────────────────────────────────────────────────────────────────
function DraftContent() {
  const draftEmoji = { instagram: '📸', facebook: '📘', linkedin: '💼', youtube: '🎬', x: '🐦' };

  return (
    <div className="md-card">
      <div className="md-card__header">
        <div className="md-card__title-group">
          <h2 className="md-card__title">Draft Content</h2>
          <p className="md-card__subtitle">{MOCK_DRAFTS.length} drafts awaiting completion</p>
        </div>
        <button className="md-card__action md-card__action--primary">
          <MdEditNote size={16} /> New Post
        </button>
      </div>
      <div className="md-drafts-grid">
        {MOCK_DRAFTS.map((draft) => (
          <div key={draft.id} className="md-draft-card">
            {/* Thumbnail area */}
            <div className="md-draft-thumbnail">
              <div
                className="md-draft-thumbnail-platform"
                style={{ background: PLATFORM_COLORS[draft.platform] ?? '#6b7280' }}
              >
                {PLATFORM_EMOJI[draft.platform]}
              </div>
              <span style={{ fontSize: 32 }}>
                {draftEmoji[draft.platform] ?? '✏️'}
              </span>
            </div>

            {/* Body */}
            <div className="md-draft-body">
              <div className="md-draft-header">
                <span
                  className="md-draft-client-tag"
                  style={{ background: draft.clientColor }}
                >
                  {draft.client}
                </span>
                <span className="md-draft-edited">
                  Edited {formatRelative(draft.lastEdited)}
                </span>
              </div>

              <p className="md-draft-caption">{draft.caption}</p>

              <div className="md-draft-platforms">
                {draft.platforms.map((p) => (
                  <div
                    key={p}
                    className="md-draft-platform-icon"
                    style={{ background: PLATFORM_COLORS[p] ?? '#6b7280' }}
                    title={p}
                  >
                    {PLATFORM_EMOJI[p]}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer CTA */}
            <div className="md-draft-footer">
              <button className="md-continue-btn">✏️ Continue Editing</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 7 — Publishing Queue
// ─────────────────────────────────────────────────────────────────────────────
function PublishingQueue() {
  return (
    <div className="md-card">
      <div className="md-card__header">
        <div className="md-card__title-group">
          <h2 className="md-card__title">Publishing Queue</h2>
          <p className="md-card__subtitle">{MOCK_QUEUE.length} posts queued for today</p>
        </div>
        <button className="md-card__action md-card__action--ghost">Manage Queue →</button>
      </div>
      <div className="md-queue-list">
        {MOCK_QUEUE.map((item) => (
          <div key={item.id} className="md-queue-row">
            <div
              className="md-queue-platform-icon"
              style={{ background: PLATFORM_COLORS[item.platform] ?? '#6b7280' }}
            >
              {PLATFORM_EMOJI[item.platform]}
            </div>
            <div className="md-queue-info">
              <p className="md-queue-caption">{item.caption}</p>
              <p className="md-queue-client">{item.client}</p>
            </div>
            <span className="md-queue-time">{formatAhead(item.scheduledAt)}</span>
            <span className={`md-priority-tag md-priority-tag--${item.priority}`}>
              {item.priority}
            </span>
          </div>
        ))}
      </div>
      <div className="md-view-all-footer">
        <button className="md-view-all-btn">View Full Queue →</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 8 — Team Notifications
// ─────────────────────────────────────────────────────────────────────────────
function TeamNotifications() {
  const [notifs, setNotifs] = useState(MOCK_MKT_NOTIFICATIONS);
  const unread = notifs.filter((n) => !n.isRead).length;

  const markRead = useCallback((id) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  }, []);

  return (
    <div className="md-card">
      <div className="md-card__header">
        <div className="md-card__title-group">
          <h2 className="md-card__title">Team Notifications</h2>
          <p className="md-card__subtitle">
            {unread > 0 ? `${unread} unread` : 'All caught up'}
          </p>
        </div>
        {unread > 0 && (
          <button
            className="md-card__action md-card__action--ghost"
            onClick={() => setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })))}
          >
            Mark all read
          </button>
        )}
      </div>
      <div className="md-notif-list">
        {notifs.map((n) => (
          <div
            key={n.id}
            className={`md-notif-row${!n.isRead ? ' md-notif-row--unread' : ''}`}
            onClick={() => markRead(n.id)}
          >
            <div className="md-notif-icon-wrap">{n.icon}</div>
            <div className="md-notif-content">
              <p className="md-notif-title">{n.title}</p>
              <p className="md-notif-body">{n.body}</p>
              <p className="md-notif-time">{formatRelative(n.time)}</p>
            </div>
            <div className={`md-notif-unread-dot${n.isRead ? ' md-notif-unread-dot--hidden' : ''}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 9 — Performance Snapshot
// ─────────────────────────────────────────────────────────────────────────────
function PerformanceSnapshot() {
  const maxWeeklyPosts = Math.max(...MOCK_WEEKLY_POSTS.map((d) => d.value), 1);
  const maxEngagement  = Math.max(...MOCK_MKT_ENGAGEMENT.map((d) => d.value), 1);
  const totalDist      = MOCK_MKT_PLATFORM_DIST.reduce((s, d) => s + d.value, 0);

  return (
    <div className="md-perf-grid">
      {/* Posts published this week */}
      <div className="md-chart-card">
        <h3 className="md-chart-card__title">📅 Posts Published This Week</h3>
        <div className="md-line-chart">
          {MOCK_WEEKLY_POSTS.map((d) => (
            <div key={d.label} className="md-line-col">
              <div
                className="md-line-bar"
                style={{ height: `${(d.value / maxWeeklyPosts) * 68}px` }}
              />
              <span className="md-line-label">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Campaign success rate */}
      <div className="md-chart-card">
        <h3 className="md-chart-card__title">🎯 Campaign Success Rate</h3>
        <div className="md-bar-chart">
          {MOCK_CAMPAIGN_SUCCESS.map((item) => (
            <div key={item.label} className="md-bar-item">
              <div className="md-bar-label-row">
                <span className="md-bar-label">{item.label}</span>
                <span className="md-bar-value">{item.value}%</span>
              </div>
              <div className="md-bar-track">
                <div className="md-bar-fill" style={{ width: `${item.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform distribution */}
      <div className="md-chart-card">
        <h3 className="md-chart-card__title">🌐 Platform Distribution</h3>
        <div className="md-donut-list">
          {MOCK_MKT_PLATFORM_DIST.map((item) => (
            <div key={item.label} className="md-donut-item">
              <div className="md-donut-dot" style={{ background: item.color }} />
              <span className="md-donut-label">{item.label}</span>
              <div className="md-donut-track">
                <div
                  className="md-donut-fill"
                  style={{
                    width: `${(item.value / totalDist) * 100}%`,
                    background: item.color,
                  }}
                />
              </div>
              <span className="md-donut-pct">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly engagement */}
      <div className="md-chart-card">
        <h3 className="md-chart-card__title">📈 Weekly Engagement</h3>
        <div className="md-line-chart">
          {MOCK_MKT_ENGAGEMENT.map((d) => (
            <div key={d.label} className="md-line-col">
              <div
                className="md-line-bar"
                style={{
                  height: `${(d.value / maxEngagement) * 68}px`,
                  background: 'linear-gradient(180deg, #10b981, #6ee7b7)',
                }}
              />
              <span className="md-line-label">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section 10 — Quick Actions
// ─────────────────────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    id: 'campaign',
    icon: <MdCampaign />,
    label: 'Create Campaign',
    desc: 'Start a new campaign for a client',
    href: '/marketing/campaigns',
  },
  {
    id: 'post',
    icon: <MdEditNote />,
    label: 'Create Post',
    desc: 'Write and schedule a new post',
    href: '/marketing/scheduling',
  },
  {
    id: 'calendar',
    icon: <MdCalendarMonth />,
    label: 'Open Calendar',
    desc: 'View the full publishing calendar',
    href: '/marketing/calendar',
  },
  {
    id: 'client',
    icon: <MdFolderOpen />,
    label: 'Open Client',
    desc: 'Jump into a client workspace',
    href: '/marketing/clients',
  },
  {
    id: 'queue',
    icon: <MdManageAccounts />,
    label: 'Manage Queue',
    desc: 'Review and reorder scheduled posts',
    href: '/marketing/scheduling',
  },
];

function QuickActions() {
  return (
    <div className="md-card">
      <div className="md-card__header">
        <div className="md-card__title-group">
          <h2 className="md-card__title">Quick Actions</h2>
          <p className="md-card__subtitle">Common tasks at your fingertips</p>
        </div>
      </div>
      <div className="md-quick-actions-grid">
        {QUICK_ACTIONS.map((action) => (
          <div
            key={action.id}
            className="md-quick-action-card"
            onClick={() => (window.location.href = action.href)}
          >
            <div className="md-quick-action-icon">{action.icon}</div>
            <span className="md-quick-action-label">{action.label}</span>
            <p className="md-quick-action-desc">{action.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root: MarketingDashboard — all 10 sections
// ─────────────────────────────────────────────────────────────────────────────
export default function MarketingDashboard() {
  const { user } = useApp();

  return (
    <PageContainer>
      {/* S1 · Welcome Banner */}
      <WelcomeBanner user={user} />

      {/* S2 · KPI Stats */}
      <SectionTitle
        title="Today's Overview"
        description="Your real-time workload and campaign health across all clients."
      />
      <div className="md-stats-grid">
        {MOCK_MKT_STATS.map((s) => (
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

      {/* S3 · My Clients */}
      <MyClients />

      {/* S4 · Today's Schedule */}
      <TodaySchedule />

      {/* S5 · Running Campaigns */}
      <RunningCampaigns />

      {/* S6 · Draft Content */}
      <DraftContent />

      {/* S7 · Publishing Queue */}
      <PublishingQueue />

      {/* S8 · Team Notifications */}
      <TeamNotifications />

      {/* S9 · Performance Snapshot */}
      <SectionTitle
        title="Performance Snapshot"
        description="Aggregated performance this week across all your clients."
      />
      <PerformanceSnapshot />

      {/* S10 · Quick Actions */}
      <QuickActions />
    </PageContainer>
  );
}
