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

import { useState } from 'react';
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

import {
  MOCK_CREATOR_STATS,
  MOCK_TODAY_CONTENT,
  MOCK_RECENT_POSTS,
  MOCK_CREATOR_CAMPAIGNS,
  MOCK_UPCOMING_SCHEDULE,
  MOCK_CALENDAR_PREVIEW,
  MOCK_CREATOR_PERFORMANCE,
  MOCK_CREATOR_NOTIFICATIONS,
  MOCK_CREATOR_PLATFORMS,
} from './CreatorDashboardMockData';

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

  // Section 4 Filters: 'all' | 'draft' | 'scheduled' | 'published'
  const [filterTab, setFilterTab] = useState('all');

  const filteredPosts = MOCK_RECENT_POSTS.filter((post) => {
    if (filterTab === 'all') return true;
    return post.status === filterTab;
  });

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
            Your content is on track. <strong>3 posts</strong> scheduled for today •{' '}
            <strong>2 active campaigns</strong> running.
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
        {MOCK_CREATOR_STATS.map((s) => (
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
              {MOCK_TODAY_CONTENT.map((post) => (
                <div key={post.id} className="cd-today-item">
                  <div className="cd-today-item__time-box">
                    <span className="cd-today-item__time">{post.time.split(' ')[0]}</span>
                    <span className="cd-today-item__ampm">{post.time.split(' ')[1]}</span>
                  </div>
                  <div
                    className="cd-today-item__platform-icon"
                    style={{ background: PLATFORM_COLORS[post.platform] ?? '#6b7280' }}
                  >
                    {PLATFORM_CHARS[post.platform]}
                  </div>
                  <div className="cd-today-item__details">
                    <div className="cd-today-item__header">
                      <span className="cd-today-item__type">{post.type}</span>
                      {post.campaign && (
                        <span className="cd-today-item__campaign">{post.campaign}</span>
                      )}
                    </div>
                    <p className="cd-today-item__caption">{post.caption}</p>
                  </div>
                  <span className={`cd-today-item__status cd-status--${post.status}`}>
                    {post.status}
                  </span>
                  <div className="cd-today-item__actions">
                    <button className="cd-today-btn">View</button>
                    <button className="cd-today-btn cd-today-btn--primary">Edit</button>
                  </div>
                </div>
              ))}
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
              {filteredPosts.slice(0, 4).map((post) => (
                <div key={post.id} className="cd-post-card">
                  <div className="cd-post-card__thumb">
                    <div
                      className="cd-post-card__badge-platform"
                      style={{ background: PLATFORM_COLORS[post.platform] ?? '#6b7280' }}
                    >
                      {PLATFORM_CHARS[post.platform]}
                    </div>
                    <span className="cd-post-card__emoji">📝</span>
                  </div>
                  <div className="cd-post-card__body">
                    <div className="cd-post-card__header">
                      {post.campaign && (
                        <span className="cd-post-card__campaign">{post.campaign}</span>
                      )}
                      <span className="cd-post-card__date">
                        {new Date(post.dateTime).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="cd-post-card__caption">{post.caption}</p>
                    <div className="cd-post-card__footer">
                      <span className={`cd-post-card__status-tag cd-tag--${post.status}`}>
                        {post.status}
                      </span>
                      <button className="cd-post-card__action-btn">Edit</button>
                    </div>
                  </div>
                </div>
              ))}
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
              {MOCK_CREATOR_CAMPAIGNS.map((c) => (
                <div key={c.id} className="cd-campaign-card">
                  <div className="cd-campaign-card__top">
                    <h3 className="cd-campaign-card__name">{c.name}</h3>
                    <span className="cd-campaign-card__posts">{c.postsCount} posts planned</span>
                  </div>
                  <div className="cd-campaign-card__progress-row">
                    <div className="cd-campaign-card__track">
                      <div className="cd-campaign-card__fill" style={{ width: `${c.progress}%` }} />
                    </div>
                    <span className="cd-campaign-card__pct">{c.progress}%</span>
                  </div>
                  <div className="cd-campaign-card__footer">
                    <div className="cd-campaign-card__platforms">
                      {c.platforms.map((p) => (
                        <span
                          key={p}
                          className="cd-campaign-card__platform-dot"
                          style={{ background: PLATFORM_COLORS[p] ?? '#6b7280' }}
                          title={p}
                        >
                          {PLATFORM_CHARS[p]}
                        </span>
                      ))}
                    </div>
                    <span className="cd-campaign-card__deadline">
                      Ends: {new Date(c.deadline).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <button className="cd-campaign-card__manage-btn">Manage</button>
                  </div>
                </div>
              ))}
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
                {MOCK_CREATOR_PLATFORMS.map((platform) => (
                  <div
                    key={platform.id}
                    className={`cd-platform-badge${platform.connected ? ' cd-platform-badge--connected' : ''}`}
                  >
                    <span className="cd-platform-badge__indicator" />
                    <span style={{ fontSize: '12px' }}>{PLATFORM_CHARS[platform.id]}</span>
                    <span>{platform.label}</span>
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
              {MOCK_CALENDAR_PREVIEW.map((day) => (
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
              {MOCK_UPCOMING_SCHEDULE.map((item) => (
                <div
                  key={item.id}
                  className={`cd-schedule-row${item.dayGroup === 'Today' ? ' cd-schedule-row--today' : ''}`}
                >
                  <div className="cd-schedule-dot" />
                  <div className="cd-schedule-info">
                    <div className="cd-schedule-header">
                      <span className="cd-schedule-day">{item.dayGroup}</span>
                      <span className="cd-schedule-time">{item.time}</span>
                      {item.campaign && (
                        <span className="cd-schedule-campaign">{item.campaign}</span>
                      )}
                    </div>
                    <div className="cd-schedule-details">
                      <div
                        className="cd-schedule-platform"
                        style={{ background: PLATFORM_COLORS[item.platform] ?? '#6b7280' }}
                      >
                        {PLATFORM_CHARS[item.platform]}
                      </div>
                      <p className="cd-schedule-caption">{item.caption}</p>
                    </div>
                  </div>
                </div>
              ))}
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
                  <span className="cd-perf-metric-card__title">Weekly Reach</span>
                  <span className="cd-perf-metric-card__value">
                    {MOCK_CREATOR_PERFORMANCE.weeklyReach}
                  </span>
                  <span className="cd-perf-metric-card__change">
                    +{MOCK_CREATOR_PERFORMANCE.reachChange}%
                  </span>
                </div>
                <div className="cd-perf-metric-card">
                  <span className="cd-perf-metric-card__title">Engagement Rate</span>
                  <span className="cd-perf-metric-card__value">
                    {MOCK_CREATOR_PERFORMANCE.avgEngagement}
                  </span>
                  <span className="cd-perf-metric-card__change">
                    +{MOCK_CREATOR_PERFORMANCE.engChange}%
                  </span>
                </div>
              </div>

              {/* Reach chart */}
              <div className="cd-perf-chart-wrap">
                <span className="cd-perf-chart-title">Reach trend (Mon - Sun)</span>
                <div className="cd-mini-line-chart">
                  {MOCK_CREATOR_PERFORMANCE.reachTrend.map((d, i) => {
                    const maxVal = Math.max(
                      ...MOCK_CREATOR_PERFORMANCE.reachTrend.map((t) => t.value)
                    );
                    const barHeight = (d.value / maxVal) * 50;
                    return (
                      <div
                        key={d.label}
                        className={`cd-mini-line-bar${i === 6 ? ' cd-mini-line-bar--active' : ''}`}
                        style={{ height: `${barHeight}px` }}
                        title={`${d.label}: ${d.value}`}
                      />
                    );
                  })}
                </div>
                <div className="cd-mini-line-labels">
                  <span>Mon</span>
                  <span>Sun</span>
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
              {MOCK_CREATOR_NOTIFICATIONS.map((n) => (
                <div key={n.id} className="cd-notif-item">
                  <span className="cd-notif-item__icon">{n.icon}</span>
                  <div className="cd-notif-item__body">
                    <p className="cd-notif-item__text">{n.text}</p>
                    <span className="cd-notif-item__time">
                      {new Date(n.time).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {!n.isRead && <div className="cd-notif-item__unread-dot" />}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}
