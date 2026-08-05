/**
 * PublishingDashboard.jsx
 *
 * Module 5 — Publishing Dashboard.
 * Shows KPI summary, activity timeline, queue overview,
 * platform publishing summary, and recent logs.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdSchedule, MdCheckCircle, MdListAlt, MdErrorOutline,
  MdPendingActions, MdCancel, MdAdd, MdRefresh,
} from 'react-icons/md';
import PageContainer   from '../../components/PageContainer/PageContainer';
import StatsCard       from '../../components/StatsCard/StatsCard';
import SectionTitle    from '../../components/SectionTitle/SectionTitle';
import LoadingSkeleton from '../../components/LoadingSkeleton/LoadingSkeleton';
import EmptyState      from '../../components/EmptyState/EmptyState';
import StatusBadge     from './components/StatusBadge';
import PlatformBadge   from './components/PlatformBadge';
import {
  mockPublishingStats,
  mockPublishingTimeline,
  mockQueuePosts,
  mockPublishingLogs,
  mockPlatformStatus,
  PLATFORM_META,
} from './publishingMockData';
import SubNav from './components/SubNav';
import publishingService from '../../../../services/publishingService';
import './PublishingDashboard.css';

function formatDateTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function HealthDot({ health }) {
  const colors = { healthy: '#10b981', warning: '#f59e0b', error: '#ef4444', disconnected: '#94a3b8' };
  return (
    <span
      className="pub-platform-card__health-dot"
      style={{ background: colors[health] ?? '#94a3b8' }}
      title={health}
    />
  );
}

export default function PublishingDashboard({ ownerType = 'marketing' }) {
  const navigate = useNavigate();
  const [loading, setLoading]     = useState(true);
  const [stats, setStats]         = useState(null);
  const [timeline, setTimeline]   = useState([]);
  const [queue, setQueue]         = useState([]);
  const [logs, setLogs]           = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [running, setRunning]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Try real API first, fall back to mock
      const [queueData, logsData] = await Promise.all([
        publishingService.getQueue().catch(() => mockQueuePosts),
        publishingService.getPublishingLogs().catch(() => mockPublishingLogs),
      ]);
      const socialAccounts = await publishingService.getSocialAccounts().catch(() => []);

      setStats(mockPublishingStats);
      setTimeline(mockPublishingTimeline);
      setQueue(queueData.slice(0, 5));
      setLogs(logsData.slice(0, 6));
      setPlatforms(
        socialAccounts.length > 0
          ? socialAccounts.map((a) => ({
              platform: a.platform,
              connected: a.status === 'connected',
              publishedToday: 0,
              queued: 0,
              failed: 0,
              lastSync: a.last_sync,
              health: a.status === 'connected' ? 'healthy' : 'disconnected',
            }))
          : mockPlatformStatus
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const handleRunDue = async () => {
    setRunning(true);
    try {
      await publishingService.runDue();
      await load();
    } catch (e) {
      console.error('Run-due failed:', e);
    } finally {
      setRunning(false);
    }
  };

  const summaryCards = stats ? [
    { title: 'Scheduled Posts',  value: stats.scheduledPosts,  icon: <MdSchedule />,       trend: 'up',      change: 12 },
    { title: 'Published Today',  value: stats.publishedToday,  icon: <MdCheckCircle />,     trend: 'up',      change: 8  },
    { title: 'In Queue',         value: stats.queueSize,       icon: <MdListAlt />,         trend: 'neutral', change: 0  },
    { title: 'Failed Posts',     value: stats.failedPosts,     icon: <MdErrorOutline />,    trend: 'down',    change: -2 },
    { title: 'Pending Approval', value: stats.pendingApproval, icon: <MdPendingActions />,  trend: 'neutral', change: 0  },
    { title: 'Cancelled',        value: stats.cancelledPosts,  icon: <MdCancel />,          trend: 'neutral', change: 0  },
  ] : [];

  return (
    <PageContainer
      title="Publishing Dashboard"
      description="Monitor post scheduling, publishing health, and platform performance in real-time."
      breadcrumb={ownerType === 'marketing' ? ['Marketing', 'Publishing'] : ['Creator', 'Publishing']}
    >
      <SubNav role={ownerType} />

      {/* ── Action Bar ─────────────────────────────────────────────────── */}
      <div className="pub-dash-toolbar">
        <button
          className="pub-dash-btn pub-dash-btn--primary"
          onClick={() => navigate(ownerType === 'marketing' ? '/marketing/scheduling' : '/creator/scheduling')}
          id="pub-create-post-btn"
        >
          <MdAdd /> Quick Publish
        </button>
        <button
          className="pub-dash-btn pub-dash-btn--secondary"
          onClick={handleRunDue}
          disabled={running}
          id="pub-run-due-btn"
        >
          <MdRefresh className={running ? 'pub-spin' : ''} />
          {running ? 'Processing...' : 'Run Due Now'}
        </button>
      </div>

      {/* ── Summary KPI Cards ──────────────────────────────────────────── */}
      {loading ? (
        <LoadingSkeleton type="card" rows={6} />
      ) : (
        <div className="pub-stats-grid">
          {summaryCards.map((c, i) => (
            <StatsCard key={i} {...c} />
          ))}
        </div>
      )}

      {/* ── Activity Timeline + Queue Overview ─────────────────────────── */}
      <div className="pub-split-grid">
        {/* Timeline */}
        <div className="pub-panel">
          <SectionTitle title="Publishing Activity Timeline" description="Today's schedule at a glance." />
          {loading ? <LoadingSkeleton type="list" rows={5} /> : (
            timeline.length === 0
              ? <EmptyState title="No activity yet" description="Posts will appear here once scheduled." />
              : (
                <div className="pub-timeline">
                  {timeline.map((item) => (
                    <div key={item.id} className="pub-timeline__item">
                      <div className="pub-timeline__time">{item.time}</div>
                      <div className="pub-timeline__connector">
                        <div className="pub-timeline__dot" />
                        <div className="pub-timeline__line" />
                      </div>
                      <div className="pub-timeline__content">
                        <div className="pub-timeline__header">
                          <PlatformBadge platform={item.platform} size="sm" />
                          <StatusBadge status={item.status} size="sm" />
                        </div>
                        <p className="pub-timeline__caption">{item.caption}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
          )}
        </div>

        {/* Queue Overview */}
        <div className="pub-panel">
          <SectionTitle
            title="Queue Overview"
            description="Next 5 posts in the publishing queue."
            action={
              <button className="pub-panel-link" onClick={() => navigate('/marketing/publishing/queue')}>
                View All →
              </button>
            }
          />
          {loading ? <LoadingSkeleton type="list" rows={5} /> : (
            queue.length === 0
              ? <EmptyState title="Queue is empty" description="No posts scheduled in the queue." />
              : (
                <div className="pub-queue-list">
                  {queue.map((post) => (
                    <div key={post.id} className="pub-queue-item">
                      <div className="pub-queue-item__pos">#{post.queuePosition ?? '—'}</div>
                      <div className="pub-queue-item__info">
                        <p className="pub-queue-item__caption">{post.caption}</p>
                        <div className="pub-queue-item__meta">
                          <div className="pub-queue-item__platforms">
                            {(post.platforms || []).map((p) => (
                              <PlatformBadge key={p} platform={p} size="sm" showLabel={false} />
                            ))}
                          </div>
                          <span className="pub-queue-item__time">{formatDateTime(post.scheduledFor || post.scheduled_for)}</span>
                        </div>
                      </div>
                      <StatusBadge status={post.status} size="sm" />
                    </div>
                  ))}
                </div>
              )
          )}
        </div>
      </div>

      {/* ── Platform Publishing Summary ─────────────────────────────────── */}
      <SectionTitle
        title="Platform Publishing Status"
        description="Health and activity per connected social account."
        action={
          <button className="pub-panel-link" onClick={() => navigate('/marketing/publishing/platforms')}>
            Manage Connections →
          </button>
        }
      />
      {loading ? <LoadingSkeleton type="card" rows={6} /> : (
        <div className="pub-platform-grid">
          {platforms.map((plat) => {
            const meta = PLATFORM_META[plat.platform] ?? {};
            return (
              <div key={plat.platform} className="pub-platform-card" style={{ borderTopColor: meta.color }}>
                <div className="pub-platform-card__header">
                  <div className="pub-platform-card__identity">
                    <span className="pub-platform-card__icon" style={{ color: meta.color }}>{meta.icon}</span>
                    <span className="pub-platform-card__name">{meta.label}</span>
                  </div>
                  <HealthDot health={plat.health} />
                </div>
                <div className="pub-platform-card__status">
                  <span className={`pub-platform-card__connection pub-platform-card__connection--${plat.connected ? 'connected' : 'disconnected'}`}>
                    {plat.connected ? '● Connected' : '○ Disconnected'}
                  </span>
                </div>
                <div className="pub-platform-card__metrics">
                  <div className="pub-platform-card__metric">
                    <span className="pub-platform-card__metric-val">{plat.publishedToday}</span>
                    <span className="pub-platform-card__metric-lbl">Published Today</span>
                  </div>
                  <div className="pub-platform-card__metric">
                    <span className="pub-platform-card__metric-val">{plat.queued}</span>
                    <span className="pub-platform-card__metric-lbl">In Queue</span>
                  </div>
                  <div className="pub-platform-card__metric">
                    <span className="pub-platform-card__metric-val" style={{ color: plat.failed > 0 ? '#ef4444' : 'inherit' }}>{plat.failed}</span>
                    <span className="pub-platform-card__metric-lbl">Failed</span>
                  </div>
                </div>
                <div className="pub-platform-card__sync">
                  Last sync: {plat.lastSync ? formatDateTime(plat.lastSync) : 'Never'}
                </div>
                {!plat.connected && (
                  <button
                    className="pub-platform-card__reconnect"
                    onClick={() => navigate('/connect-apps')}
                  >
                    Connect Account
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Recent Publishing Logs ──────────────────────────────────────── */}
      <div className="pub-panel">
        <SectionTitle
          title="Recent Publishing Logs"
          description="Last 6 publishing events across all platforms."
          action={
            <button className="pub-panel-link" onClick={() => navigate('/marketing/publishing/logs')}>
              View Full Logs →
            </button>
          }
        />
        {loading ? <LoadingSkeleton type="table" rows={6} /> : (
          logs.length === 0
            ? <EmptyState title="No logs yet" description="Publishing activity will appear here." />
            : (
              <div className="pub-logs-table-wrap">
                <table className="pub-logs-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Platform</th>
                      <th>Post</th>
                      <th>Status</th>
                      <th>Duration</th>
                      <th>Retries</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td className="pub-logs-table__time">{formatDateTime(log.time)}</td>
                        <td><PlatformBadge platform={log.platform} size="sm" /></td>
                        <td className="pub-logs-table__caption">{log.postCaption}</td>
                        <td><StatusBadge status={log.status} size="sm" /></td>
                        <td>{log.duration}</td>
                        <td className={log.retryAttempts > 0 ? 'pub-logs-table__retries--warn' : ''}>{log.retryAttempts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
        )}
      </div>
    </PageContainer>
  );
}
