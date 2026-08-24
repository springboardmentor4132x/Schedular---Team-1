/**
 * CreatorDashboard.jsx
 *
 * Content Creator Dashboard home page.
 * Provides active operational widgets tailored for personal content production:
 * welcome daily summary, KPI overview, today's schedule, library filter,
 * active campaigns progress, upcoming timeline, mini calendar plan,
 * analytics performance, activity notifications, quick action shortcuts,
 * and connected platform health checks.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdArticle,
  MdCalendarMonth,
  MdCampaign,
  MdEditNote,
  MdFolderOpen,
  MdManageAccounts,
  MdCheckCircle,
  MdSchedule,
  MdRateReview,
} from 'react-icons/md';
import { useApp } from '../../../../context/AppContext';
import { resolveRole, ROLE_LABELS } from '../../shared/constants';
import PageContainer from '../../components/PageContainer/PageContainer';
import StatsCard from '../../components/StatsCard/StatsCard';
import Avatar from '../../components/Avatar/Avatar';
import SectionTitle from '../../components/SectionTitle/SectionTitle';

const FALLBACK_CALENDAR_PREVIEW = [
  { date: 'Aug 21', dayName: 'Mon', postsCount: 2, isToday: false },
  { date: 'Aug 22', dayName: 'Tue', postsCount: 0, isToday: false },
  { date: 'Aug 23', dayName: 'Wed', postsCount: 3, isToday: true },
  { date: 'Aug 24', dayName: 'Thu', postsCount: 1, isToday: false },
  { date: 'Aug 25', dayName: 'Fri', postsCount: 4, isToday: false },
  { date: 'Aug 26', dayName: 'Sat', postsCount: 0, isToday: false },
  { date: 'Aug 27', dayName: 'Sun', postsCount: 2, isToday: false },
];

import postService from '../../../../services/postService';
import campaignService from '../../../../services/campaignService';
import { getConnectedAccounts } from '../../../../services/socialService';
import { getDashboardSummary } from '../../../../services/dashboardService';
import { getNotifications } from '../../../../services/notificationService';
import analyticsService from '../../../../services/analyticsService';

import './CreatorDashboard.css';

// ── Icon/Color maps ──────────────────────────────────────────────────────────
const STAT_ICONS = {
  total: <MdArticle />,
  drafts: <MdEditNote />,
  scheduled: <MdSchedule />,
  published: <MdCheckCircle />,
  campaigns: <MdCampaign />,
  reviews: <MdRateReview />,
};

const PLATFORM_COLORS = {
  facebook: '#1877F2',
  instagram: '#E1306C',
  linkedin: '#0A66C2',
  youtube: '#FF0000',
  x: '#0f172a',
  pinterest: '#E60023',
};

const PLATFORM_CHARS = {
  facebook: 'f',
  instagram: '📷',
  linkedin: 'in',
  youtube: '▶',
  x: '✕',
  pinterest: 'P',
};

function getGreetingTime() {
  const hr = new Date().getHours();
  if (hr < 12) return 'Good Morning';
  if (hr < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function CreatorDashboard() {
  const { user } = useApp();
  const navigate = useNavigate();

  const role = resolveRole(user?.role);
  const firstName = user?.fullName?.split(' ')[0] ?? 'Creator';
  const lastName = user?.fullName?.split(' ').slice(1).join(' ') ?? '';
  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [metrics, setMetrics] = useState({ reach: 0, engagement: 0 });
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    postService.getPosts().then(data => { if (data) setPosts(data); });
    campaignService.getCampaigns().then(data => { if (data) setCampaigns(data); });
    getDashboardSummary().then(data => {
      if (data) {
        setSummary(data);
        setStats([
          { id: 'total', title: 'Total Posts', value: (data.publishedPosts + data.scheduledPosts + data.draftPosts).toString(), change: 'All time', trend: 'neutral' },
          { id: 'drafts', title: 'Drafts', value: data.draftPosts.toString(), change: 'Requires edit', trend: 'up' },
          { id: 'scheduled', title: 'Scheduled', value: data.scheduledPosts.toString(), change: 'In Queue', trend: 'up' },
          { id: 'published', title: 'Published', value: data.publishedPosts.toString(), change: 'Live', trend: 'neutral' },
          { id: 'campaigns', title: 'Campaigns', value: data.activeCampaigns.toString(), change: 'Active', trend: 'up' },
          { id: 'reviews', title: 'Reviews', value: data.unreadNotifications.toString(), change: 'Pending', trend: 'neutral' }
        ]);
      }
    });
    getConnectedAccounts().then(data => { if (data) setPlatforms(data); }).catch(() => setPlatforms([]));
    getNotifications().then(data => { if (data && data.length) setNotifs(data); });
    analyticsService.getMetrics().then(data => { if (data && data.totals) setMetrics(data.totals); });
  }, []);

  // Section 4 Filters: 'all' | 'draft' | 'scheduled' | 'published'
  const [filterTab, setFilterTab] = useState('all');

  const filteredPosts = posts.filter((post) => {
    if (filterTab === 'all') return true;
    return post.status === filterTab;
  });

  const scheduledPosts = posts.filter(p => p.status === 'scheduled' || p.status === 'publishing').slice(0, 5);

  return (
    <PageContainer>
      {/* S1: Creator Welcome Area */}
      <div className="cd-welcome">
        <div className="cd-welcome__left">
          <div className="cd-welcome__eyebrow">
            <span className="cd-welcome__greeting">{getGreetingTime()} 👋</span>
            <span className="cd-welcome__badge">{ROLE_LABELS[role] ?? 'Creator'}</span>
          </div>
          <h1 className="cd-welcome__name">{firstName}</h1>
          <span className="cd-welcome__date">{todayStr}</span>
          <p className="cd-welcome__summary">
            Your content is on track. <strong>{summary?.scheduledPosts ?? 0} post(s)</strong> scheduled •{' '}
            <strong>{summary?.activeCampaigns ?? 0} active campaign(s)</strong> running.
          </p>
        </div>
        <div className="cd-welcome__right">
          <Avatar
            profileImage={user?.profileImage}
            firstName={firstName}
            lastName={lastName}
            size="xl"
          />
        </div>
      </div>

      {/* S2: KPI Overview Cards */}
      <SectionTitle
        title="Overview"
        description="Key performance indicators of your personal studio workspace."
      />
      <div className="cd-stats-grid">
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

      {/* Main Grid Content */}
      <div className="cd-grid-2-col">
        {/* Left Column (Primary Activities) */}
        <div className="cd-grid-col-main" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* S3: Today's Content */}
          <div className="cd-card">
            <div className="cd-card__header">
              <div>
                <h2 className="cd-card__title">Today's Content Plan</h2>
                <p className="cd-card__subtitle">Scheduled publications waiting for release today</p>
              </div>
            </div>
            <div className="cd-today-list">
              {scheduledPosts.map((post) => {
                let plat = 'facebook';
                try { const arr = JSON.parse(post.platforms); if (arr.length) plat = arr[0]; } catch { plat = 'facebook'; }
                return (
                <div key={post.id} className="cd-today-item">
                  <div className="cd-today-item__time-box">
                    <span className="cd-today-item__time">{post.scheduled_for ? new Date(post.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}</span>
                  </div>
                  <div
                    className="cd-today-item__platform-icon"
                    style={{ background: PLATFORM_COLORS[plat] ?? '#6b7280' }}
                  >
                    {PLATFORM_CHARS[plat]}
                  </div>
                  <div className="cd-today-item__details">
                    <div className="cd-today-item__header">
                      <span className="cd-today-item__type">Post</span>
                    </div>
                    <p className="cd-today-item__caption">{post.caption || '(No caption)'}</p>
                  </div>
                  <span className={`cd-today-item__status cd-status--${post.status}`}>
                    {post.status}
                  </span>
                  <div className="cd-today-item__actions">
                    <button className="cd-today-btn">View</button>
                    <button className="cd-today-btn cd-today-btn--primary">Edit</button>
                  </div>
                </div>
              )})}
            </div>
          </div>

          {/* S4: My Content / Recent Posts */}
          <div className="cd-card">
            <div className="cd-card__header">
              <div>
                <h2 className="cd-card__title">My Content Studio</h2>
                <p className="cd-card__subtitle">Recent drafts, scheduled and published posts</p>
              </div>
              <button
                className="cd-card__header-btn"
                onClick={() => navigate('/creator/posts')}
              >
                View Library →
              </button>
            </div>
            <div className="cd-recent-filter">
              {['all', 'draft', 'scheduled', 'published'].map((tab) => (
                <button
                  key={tab}
                  className={`cd-filter-btn${filterTab === tab ? ' cd-filter-btn--active' : ''}`}
                  onClick={() => setFilterTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
            <div className="cd-posts-grid">
              {filteredPosts.slice(0, 4).map((post) => {
                let plat = 'facebook';
                try { const arr = JSON.parse(post.platforms); if (arr.length) plat = arr[0]; } catch { plat = 'facebook'; }
                return (
                <div key={post.id} className="cd-post-card">
                  <div className="cd-post-card__thumb">
                    <div
                      className="cd-post-card__badge-platform"
                      style={{ background: PLATFORM_COLORS[plat] ?? '#6b7280' }}
                    >
                      {PLATFORM_CHARS[plat]}
                    </div>
                    <span className="cd-post-card__emoji">📝</span>
                  </div>
                  <div className="cd-post-card__body">
                    <div className="cd-post-card__header">
                      <span className="cd-post-card__date">
                        {post.created_at ? new Date(post.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        }) : 'TBD'}
                      </span>
                    </div>
                    <p className="cd-post-card__caption">{post.caption || '(No caption)'}</p>
                    <div className="cd-post-card__footer">
                      <span className={`cd-post-card__status-tag cd-tag--${post.status}`}>
                        {post.status}
                      </span>
                      <button className="cd-post-card__action-btn">Edit</button>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </div>

          {/* S5: Active Campaigns */}
          <div className="cd-card">
            <div className="cd-card__header">
              <div>
                <h2 className="cd-card__title">Active Campaigns</h2>
                <p className="cd-card__subtitle">Your promotional events and campaigns</p>
              </div>
              <button
                className="cd-card__header-btn"
                onClick={() => navigate('/creator/campaigns')}
              >
                Create Campaign →
              </button>
            </div>
            <div className="cd-campaigns-grid">
              {campaigns.map((c) => {
                const progress = c.status === 'active' ? 50 : (c.status === 'completed' ? 100 : 0);
                return (
                <div key={c.id} className="cd-campaign-card">
                  <div className="cd-campaign-card__top">
                    <h3 className="cd-campaign-card__name">{c.name}</h3>
                    <span className="cd-campaign-card__posts">{c.status}</span>
                  </div>
                  <div className="cd-campaign-card__progress-row">
                    <div className="cd-campaign-card__track">
                      <div className="cd-campaign-card__fill" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="cd-campaign-card__pct">{progress}%</span>
                  </div>
                  <div className="cd-campaign-card__footer">
                    <div className="cd-campaign-card__platforms">
                      <span
                        className="cd-campaign-card__platform-dot"
                        style={{ background: PLATFORM_COLORS['facebook'] }}
                        title="Platform"
                      >
                        {PLATFORM_CHARS['facebook']}
                      </span>
                    </div>
                    <span className="cd-campaign-card__deadline">
                      Ends: {c.end_date ? new Date(c.end_date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      }) : 'TBD'}
                    </span>
                    <button className="cd-campaign-card__manage-btn">Manage</button>
                  </div>
                </div>
              )})}
            </div>
          </div>
        </div>

        {/* Right Column (Widget Overview) */}
        <div className="cd-grid-col-side" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Section 10: Quick Actions */}
          <div className="cd-card">
            <div className="cd-card__header">
              <h2 className="cd-card__title">Quick Actions</h2>
            </div>
            <div className="cd-quick-actions">
              <button className="cd-action-btn" onClick={() => navigate('/creator/scheduling')}>
                <MdEditNote className="cd-action-btn__icon" />
                <span className="cd-action-btn__label">Create Post</span>
              </button>
              <button className="cd-action-btn" onClick={() => navigate('/creator/scheduling')}>
                <MdSchedule className="cd-action-btn__icon" />
                <span className="cd-action-btn__label">Schedule Post</span>
              </button>
              <button className="cd-action-btn" onClick={() => navigate('/creator/campaigns')}>
                <MdCampaign className="cd-action-btn__icon" />
                <span className="cd-action-btn__label">New Campaign</span>
              </button>
              <button className="cd-action-btn" onClick={() => navigate('/creator/calendar')}>
                <MdCalendarMonth className="cd-action-btn__icon" />
                <span className="cd-action-btn__label">Open Calendar</span>
              </button>
              <button className="cd-action-btn" onClick={() => navigate('/creator/posts')}>
                <MdFolderOpen className="cd-action-btn__icon" />
                <span className="cd-action-btn__label">My Posts</span>
              </button>
              <button className="cd-action-btn" onClick={() => navigate('/connect-apps')}>
                <MdManageAccounts className="cd-action-btn__icon" />
                <span className="cd-action-btn__label">Manage Apps</span>
              </button>
            </div>
          </div>

          {/* Connected Platforms Box */}
          <div className="cd-card">
            <div className="cd-card__header">
              <div>
                <h2 className="cd-card__title">Connected Accounts</h2>
                <p className="cd-card__subtitle">Status of integrated social platform channels</p>
              </div>
              <button
                className="cd-card__header-btn"
                onClick={() => navigate('/connect-apps')}
              >
                Configure
              </button>
            </div>
            <div className="cd-platforms-summary">
              <div className="cd-platforms-list">
                {platforms.map((platform) => (
                  <div
                    key={platform.id}
                    className={`cd-platform-badge${platform.status === 'connected' ? ' cd-platform-badge--connected' : ''}`}
                  >
                    <span className="cd-platform-badge__indicator" />
                    <span style={{ fontSize: '12px' }}>{PLATFORM_CHARS[platform.platform]}</span>
                    <span>{platform.platform}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* S7: Content Calendar Preview */}
          <div className="cd-card">
            <div className="cd-card__header">
              <div>
                <h2 className="cd-card__title">Weekly Content Calendar</h2>
                <p className="cd-card__subtitle">Planning density preview for this week</p>
              </div>
              <button
                className="cd-card__header-btn"
                onClick={() => navigate('/creator/calendar')}
              >
                Calendar →
              </button>
            </div>
            <div className="cd-calendar-preview">
              {FALLBACK_CALENDAR_PREVIEW.map((day) => (
                <div
                  key={day.date}
                  className={`cd-calendar-day${day.isToday ? ' cd-calendar-day--today' : ''}`}
                >
                  <span className="cd-calendar-day__name">{day.dayName}</span>
                  <span className="cd-calendar-day__date">{day.date.split(' ')[1]}</span>
                  {day.postsCount > 0 && (
                    <span className="cd-calendar-day__badge">{day.postsCount}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* S6: Upcoming Schedule Timeline */}
          <div className="cd-card">
            <div className="cd-card__header">
              <h2 className="cd-card__title">Upcoming Releases</h2>
            </div>
            <div className="cd-schedule-list">
              {scheduledPosts.map((item) => {
                let plat = 'facebook';
                try { const arr = JSON.parse(item.platforms); if (arr.length) plat = arr[0]; } catch { plat = 'facebook'; }
                return (
                <div
                  key={item.id}
                  className={`cd-schedule-row${new Date(item.scheduled_for || new Date().toISOString()).toDateString() === new Date().toDateString() ? ' cd-schedule-row--today' : ''}`}
                >
                  <div className="cd-schedule-dot" />
                  <div className="cd-schedule-info">
                    <div className="cd-schedule-header">
                      <span className="cd-schedule-day">Scheduled</span>
                      <span className="cd-schedule-time">{item.scheduled_for ? new Date(item.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}</span>
                    </div>
                    <div className="cd-schedule-details">
                      <div
                        className="cd-schedule-platform"
                        style={{ background: PLATFORM_COLORS[plat] ?? '#6b7280' }}
                      >
                        {PLATFORM_CHARS[plat]}
                      </div>
                      <p className="cd-schedule-caption">{item.caption || '(No caption)'}</p>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </div>

          {/* S8: Performance Snapshot */}
          <div className="cd-card">
            <div className="cd-card__header">
              <h2 className="cd-card__title">Analytics Snapshot</h2>
            </div>
            <div className="cd-perf-snapshot">
              <div className="cd-perf-metrics">
                <div className="cd-perf-metric-card">
                  <span className="cd-perf-metric-card__title">Total Reach</span>
                  <span className="cd-perf-metric-card__value">
                    {metrics.reach || 0}
                  </span>
                  <span className="cd-perf-metric-card__change">
                    +0%
                  </span>
                </div>
                <div className="cd-perf-metric-card">
                  <span className="cd-perf-metric-card__title">Total Engagement</span>
                  <span className="cd-perf-metric-card__value">
                    {metrics.reactions || 0}
                  </span>
                  <span className="cd-perf-metric-card__change">
                    +0%
                  </span>
                </div>
              </div>

              {/* Reach chart */}
              <div className="cd-perf-chart-wrap">
                <span className="cd-perf-chart-title">Reach overview</span>
                <div className="cd-mini-line-chart">
                  <div className="cd-mini-line-bar cd-mini-line-bar--active" style={{ height: '50px' }} title="Current" />
                </div>
              </div>
            </div>
          </div>

          {/* S9: Notifications / Reviews */}
          <div className="cd-card">
            <div className="cd-card__header">
              <h2 className="cd-card__title">Recent Studio Activity</h2>
            </div>
            <div className="cd-notif-list">
              {notifs.map((n) => (
                <div key={n.id} className="cd-notif-item">
                  <span className="cd-notif-item__icon"><MdRateReview /></span>
                  <div className="cd-notif-item__body">
                    <p className="cd-notif-item__text">{n.message || n.title}</p>
                    <span className="cd-notif-item__time">
                      {new Date(n.created_at || new Date()).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {!n.is_read && <div className="cd-notif-item__unread-dot" />}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}
