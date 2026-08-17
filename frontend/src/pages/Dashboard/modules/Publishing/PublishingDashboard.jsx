/**
 * PublishingDashboard.jsx
 *
 * Module 5 — Publishing Dashboard.
 * Uses real backend publishing logs, queue and connected accounts.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  MdSchedule,
  MdCheckCircle,
  MdListAlt,
  MdErrorOutline,
  MdPendingActions,
  MdCancel,
  MdAdd,
  MdRefresh,
} from 'react-icons/md';

import PageContainer from '../../components/PageContainer/PageContainer';
import StatsCard from '../../components/StatsCard/StatsCard';
import SectionTitle from '../../components/SectionTitle/SectionTitle';
import LoadingSkeleton from '../../components/LoadingSkeleton/LoadingSkeleton';
import EmptyState from '../../components/EmptyState/EmptyState';

import StatusBadge from './components/StatusBadge';
import PlatformBadge from './components/PlatformBadge';
import SubNav from './components/SubNav';

import { PLATFORM_META } from './publishingMockData';

import publishingService from '../../../../services/publishingService';

import './PublishingDashboard.css';


/* ============================================================
   DATE FORMAT
   ============================================================ */

function formatDateTime(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}


/* ============================================================
   PLATFORM NORMALIZER

   Backend may return:
   facebook
   Facebook
   FACEBOOK
   fb
   etc.

   Dashboard internally uses:
   facebook
   instagram
   linkedin
   x
   youtube
   ============================================================ */

function normalizePlatform(value) {
  if (!value) {
    return 'facebook';
  }

  const platform = String(value)
    .trim()
    .toLowerCase();

  if (
    platform === 'facebook' ||
    platform === 'fb'
  ) {
    return 'facebook';
  }

  if (
    platform === 'instagram' ||
    platform === 'ig'
  ) {
    return 'instagram';
  }

  if (
    platform === 'linkedin' ||
    platform === 'linkedIn'.toLowerCase()
  ) {
    return 'linkedin';
  }

  if (
    platform === 'youtube' ||
    platform === 'yt'
  ) {
    return 'youtube';
  }

  if (
    platform === 'twitter' ||
    platform === 'x'
  ) {
    return 'x';
  }

  return platform;
}


/* ============================================================
   STATUS NORMALIZER
   ============================================================ */

function normalizeStatus(value) {
  if (!value) {
    return 'unknown';
  }

  return String(value)
    .trim()
    .toLowerCase();
}


/* ============================================================
   HEALTH DOT
   ============================================================ */

function HealthDot({ health }) {
  const colors = {
    healthy: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    disconnected: '#94a3b8',
  };

  return (
    <span
      className="pub-platform-card__health-dot"
      style={{
        background: colors[health] ?? '#94a3b8',
      }}
      title={health}
    />
  );
}


/* ============================================================
   COMPONENT
   ============================================================ */

export default function PublishingDashboard({
  ownerType = 'marketing',
}) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState(null);

  const [timeline, setTimeline] = useState([]);

  const [queue, setQueue] = useState([]);

  const [logs, setLogs] = useState([]);

  const [platforms, setPlatforms] = useState([]);

  const [running, setRunning] = useState(false);


  /* ============================================================
     LOAD DASHBOARD DATA
     ============================================================ */

  const load = useCallback(async () => {
    setLoading(true);

    try {
      /* --------------------------------------------------------
         GET QUEUE
         -------------------------------------------------------- */

      const queueData =
        await publishingService
          .getQueue()
          .catch((error) => {
            console.error(
              'Failed to load publishing queue:',
              error
            );

            return [];
          });


      /* --------------------------------------------------------
         GET REAL PUBLISHING LOGS
         -------------------------------------------------------- */

      const logsData =
        await publishingService
          .getPublishingLogs()
          .catch((error) => {
            console.error(
              'Failed to load publishing logs:',
              error
            );

            return [];
          });


      /* --------------------------------------------------------
         GET CONNECTED SOCIAL ACCOUNTS
         -------------------------------------------------------- */

      const socialAccounts =
        await publishingService
          .getSocialAccounts()
          .catch((error) => {
            console.error(
              'Failed to load social accounts:',
              error
            );

            return [];
          });


      /* --------------------------------------------------------
         MAKE SURE ARRAYS
         -------------------------------------------------------- */

      const safeQueue = Array.isArray(queueData)
        ? queueData
        : [];

      const safeLogs = Array.isArray(logsData)
        ? logsData
        : [];

      const safeAccounts = Array.isArray(socialAccounts)
        ? socialAccounts
        : [];


      /* ========================================================
         KPI COUNTS
         ======================================================== */

      const publishedCount = safeLogs.filter(
        (log) =>
          normalizeStatus(log.status) === 'published'
      ).length;


      const failedCount = safeLogs.filter(
        (log) =>
          normalizeStatus(log.status) === 'failed'
      ).length;


      const scheduledCount = safeQueue.filter(
        (post) =>
          normalizeStatus(post.status) === 'scheduled'
      ).length;


      const pendingApprovalCount = safeQueue.filter(
        (post) =>
          normalizeStatus(post.status) ===
          'pending_approval'
      ).length;


      const cancelledCount = safeQueue.filter(
        (post) =>
          normalizeStatus(post.status) === 'cancelled'
      ).length;


      setStats({
        scheduledPosts: scheduledCount,

        publishedToday: publishedCount,

        queueSize: safeQueue.length,

        failedPosts: failedCount,

        pendingApproval: pendingApprovalCount,

        cancelledPosts: cancelledCount,
      });


      /* ========================================================
         QUEUE
         ======================================================== */

      setQueue(
        safeQueue.slice(0, 5)
      );


      /* ========================================================
         NORMALIZE REAL LOGS
         ======================================================== */

      const normalizedLogs = safeLogs.map((log) => {
        const platform = normalizePlatform(
          log.platform ||
          log.provider ||
          log.network ||
          log.platform_name
        );

        const status = normalizeStatus(
          log.status
        );

        const caption =
          log.caption ||
          log.postCaption ||
          log.post_caption ||
          log.post?.caption ||
          '—';

        const time =
          log.attemptedAt ||
          log.attempted_at ||
          log.time ||
          log.createdAt ||
          log.created_at ||
          null;

        return {
          id: log.id,

          time,

          platform,

          postCaption: caption,

          status,

          duration:
            log.duration ||
            '—',

          retryAttempts:
            log.retryAttempts ??
            log.retry_attempts ??
            0,

          error:
            log.error ||
            log.error_message ||
            null,

          externalPostId:
            log.externalPostId ||
            log.external_post_id ||
            null,

          postId:
            log.postId ||
            log.post_id ||
            null,
        };
      });


      setLogs(
        normalizedLogs.slice(0, 6)
      );


      /* ========================================================
         ACTIVITY TIMELINE

         IMPORTANT:
         This uses REAL publishing logs.
         No mock timeline.
         ======================================================== */

      const realTimeline = normalizedLogs
        .slice(0, 10)
        .map((log) => ({
          id: log.id,

          time: formatDateTime(
            log.time
          ),

          platform:
            log.platform,

          status:
            log.status,

          caption:
            log.postCaption,
        }));


      setTimeline(
        realTimeline
      );


      /* ========================================================
         PLATFORM STATUS
         ======================================================== */

      const platformData =
        safeAccounts.map((account) => {
          const accountPlatform =
            normalizePlatform(
              account.platform ||
              account.provider ||
              account.network
            );


          const platformLogs =
            safeLogs.filter((log) =>
              normalizePlatform(
                log.platform ||
                log.provider ||
                log.network
              ) === accountPlatform
            );


          const platformPublished =
            platformLogs.filter(
              (log) =>
                normalizeStatus(
                  log.status
                ) === 'published'
            ).length;


          const platformFailed =
            platformLogs.filter(
              (log) =>
                normalizeStatus(
                  log.status
                ) === 'failed'
            ).length;


          const platformQueued =
            safeQueue.filter((post) => {
              if (
                !Array.isArray(
                  post.platforms
                )
              ) {
                return false;
              }

              return post.platforms.some(
                (platform) =>
                  normalizePlatform(
                    platform
                  ) === accountPlatform
              );
            }).length;


          let health =
            'disconnected';


          if (
            account.status ===
            'connected'
          ) {
            if (
              platformFailed > 0
            ) {
              health = 'warning';
            } else {
              health = 'healthy';
            }
          }


          return {
            platform:
              accountPlatform,

            connected:
              account.status ===
              'connected',

            publishedToday:
              platformPublished,

            queued:
              platformQueued,

            failed:
              platformFailed,

            lastSync:
              account.last_sync ||
              account.lastSync ||
              null,

            health,
          };
        });


      setPlatforms(
        platformData
      );


    } catch (error) {
      console.error(
        'Publishing dashboard load failed:',
        error
      );

      setStats({
        scheduledPosts: 0,
        publishedToday: 0,
        queueSize: 0,
        failedPosts: 0,
        pendingApproval: 0,
        cancelledPosts: 0,
      });

      setQueue([]);
      setLogs([]);
      setTimeline([]);
      setPlatforms([]);

    } finally {
      setLoading(false);
    }
  }, []);


  /* ============================================================
     INITIAL LOAD
     ============================================================ */

  useEffect(() => {
    load();
  }, [load]);


  /* ============================================================
     RUN DUE
     ============================================================ */

  const handleRunDue = async () => {
    setRunning(true);

    try {
      await publishingService.runDue();

      await load();

    } catch (error) {
      console.error(
        'Run-due failed:',
        error
      );

    } finally {
      setRunning(false);
    }
  };


  /* ============================================================
     SUMMARY CARDS
     ============================================================ */

  const summaryCards = stats
    ? [
        {
          title: 'Scheduled Posts',
          value: stats.scheduledPosts,
          icon: <MdSchedule />,
          trend: 'up',
          change: 0,
        },

        {
          title: 'Published Today',
          value: stats.publishedToday,
          icon: <MdCheckCircle />,
          trend: 'up',
          change: 0,
        },

        {
          title: 'In Queue',
          value: stats.queueSize,
          icon: <MdListAlt />,
          trend: 'neutral',
          change: 0,
        },

        {
          title: 'Failed Posts',
          value: stats.failedPosts,
          icon: <MdErrorOutline />,
          trend:
            stats.failedPosts > 0
              ? 'down'
              : 'neutral',
          change: 0,
        },

        {
          title: 'Pending Approval',
          value: stats.pendingApproval,
          icon: <MdPendingActions />,
          trend: 'neutral',
          change: 0,
        },

        {
          title: 'Cancelled',
          value: stats.cancelledPosts,
          icon: <MdCancel />,
          trend: 'neutral',
          change: 0,
        },
      ]
    : [];


  /* ============================================================
     RENDER
     ============================================================ */

  return (
    <PageContainer
      title="Publishing Dashboard"
      description="Monitor post scheduling, publishing health, and platform performance in real-time."
      breadcrumb={
        ownerType === 'marketing'
          ? ['Marketing', 'Publishing']
          : ['Creator', 'Publishing']
      }
    >

      <SubNav
        role={ownerType}
      />


      {/* ========================================================
          ACTION BAR
          ======================================================== */}

      <div className="pub-dash-toolbar">

        <button
          className="pub-dash-btn pub-dash-btn--primary"
          onClick={() =>
            navigate(
              ownerType === 'marketing'
                ? '/marketing/scheduling'
                : '/creator/scheduling'
            )
          }
          id="pub-create-post-btn"
        >
          <MdAdd />
          Quick Publish
        </button>


        <button
          className="pub-dash-btn pub-dash-btn--secondary"
          onClick={handleRunDue}
          disabled={running}
          id="pub-run-due-btn"
        >
          <MdRefresh
            className={
              running
                ? 'pub-spin'
                : ''
            }
          />

          {running
            ? 'Processing...'
            : 'Run Due Now'}
        </button>

      </div>


      {/* ========================================================
          SUMMARY
          ======================================================== */}

      {loading ? (

        <LoadingSkeleton
          type="card"
          rows={6}
        />

      ) : (

        <div className="pub-stats-grid">

          {summaryCards.map(
            (card, index) => (
              <StatsCard
                key={index}
                {...card}
              />
            )
          )}

        </div>

      )}


      {/* ========================================================
          TIMELINE + QUEUE
          ======================================================== */}

      <div className="pub-split-grid">


        {/* ================= TIMELINE ================= */}

        <div className="pub-panel">

          <SectionTitle
            title="Publishing Activity Timeline"
            description="Recent publishing activity."
          />


          {loading ? (

            <LoadingSkeleton
              type="list"
              rows={5}
            />

          ) : timeline.length === 0 ? (

            <EmptyState
              title="No activity yet"
              description="Publishing activity will appear here."
            />

          ) : (

            <div className="pub-timeline">

              {timeline.map((item) => (

                <div
                  key={item.id}
                  className="pub-timeline__item"
                >

                  <div className="pub-timeline__time">
                    {item.time}
                  </div>


                  <div className="pub-timeline__connector">

                    <div className="pub-timeline__dot" />

                    <div className="pub-timeline__line" />

                  </div>


                  <div className="pub-timeline__content">

                    <div className="pub-timeline__header">

                      <PlatformBadge
                        platform={
                          normalizePlatform(
                            item.platform
                          )
                        }
                        size="sm"
                      />


                      <StatusBadge
                        status={
                          normalizeStatus(
                            item.status
                          )
                        }
                        size="sm"
                      />

                    </div>


                    <p className="pub-timeline__caption">
                      {item.caption}
                    </p>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>


        {/* ================= QUEUE ================= */}

        <div className="pub-panel">

          <SectionTitle
            title="Queue Overview"
            description="Next 5 posts in the publishing queue."
            action={
              <button
                className="pub-panel-link"
                onClick={() =>
                  navigate(
                    ownerType === 'marketing'
                      ? '/marketing/publishing/queue'
                      : '/creator/publishing/queue'
                  )
                }
              >
                View All →
              </button>
            }
          />


          {loading ? (

            <LoadingSkeleton
              type="list"
              rows={5}
            />

          ) : queue.length === 0 ? (

            <EmptyState
              title="Queue is empty"
              description="No posts scheduled in the queue."
            />

          ) : (

            <div className="pub-queue-list">

              {queue.map((post) => (

                <div
                  key={post.id}
                  className="pub-queue-item"
                >

                  <div className="pub-queue-item__pos">
                    #{post.queuePosition ?? '—'}
                  </div>


                  <div className="pub-queue-item__info">

                    <p className="pub-queue-item__caption">
                      {post.caption ||
                        'Untitled post'}
                    </p>


                    <div className="pub-queue-item__meta">

                      <div className="pub-queue-item__platforms">

                        {(post.platforms || []).map(
                          (platform) => (

                            <PlatformBadge
                              key={platform}
                              platform={
                                normalizePlatform(
                                  platform
                                )
                              }
                              size="sm"
                              showLabel={false}
                            />

                          )
                        )}

                      </div>


                      <span className="pub-queue-item__time">

                        {formatDateTime(
                          post.scheduledFor ||
                          post.scheduled_for
                        )}

                      </span>

                    </div>

                  </div>


                  <StatusBadge
                    status={
                      normalizeStatus(
                        post.status
                      )
                    }
                    size="sm"
                  />

                </div>

              ))}

            </div>

          )}

        </div>

      </div>


      {/* ========================================================
          PLATFORM STATUS
          ======================================================== */}

      <SectionTitle
        title="Platform Publishing Status"
        description="Health and activity per connected social account."
        action={
          <button
            className="pub-panel-link"
            onClick={() =>
              navigate('/connect-apps')
            }
          >
            Manage Connections →
          </button>
        }
      />


      {loading ? (

        <LoadingSkeleton
          type="card"
          rows={6}
        />

      ) : platforms.length === 0 ? (

        <EmptyState
          title="No connected platforms"
          description="Connect a social media account to start publishing."
        />

      ) : (

        <div className="pub-platform-grid">

          {platforms.map((plat) => {

            const platform =
              normalizePlatform(
                plat.platform
              );

            const meta =
              PLATFORM_META[
                platform
              ] ?? {};


            return (

              <div
                key={platform}
                className="pub-platform-card"
                style={{
                  borderTopColor:
                    meta.color,
                }}
              >

                <div className="pub-platform-card__header">

                  <div className="pub-platform-card__identity">

                    <span
                      className="pub-platform-card__icon"
                      style={{
                        color:
                          meta.color,
                      }}
                    >
                      {meta.icon}
                    </span>


                    <span className="pub-platform-card__name">

                      {meta.label ||
                        platform}

                    </span>

                  </div>


                  <HealthDot
                    health={
                      plat.health
                    }
                  />

                </div>


                <div className="pub-platform-card__status">

                  <span
                    className={`pub-platform-card__connection pub-platform-card__connection--${
                      plat.connected
                        ? 'connected'
                        : 'disconnected'
                    }`}
                  >

                    {plat.connected
                      ? '● Connected'
                      : '○ Disconnected'}

                  </span>

                </div>


                <div className="pub-platform-card__metrics">

                  <div className="pub-platform-card__metric">

                    <span className="pub-platform-card__metric-val">
                      {plat.publishedToday}
                    </span>

                    <span className="pub-platform-card__metric-lbl">
                      Published Today
                    </span>

                  </div>


                  <div className="pub-platform-card__metric">

                    <span className="pub-platform-card__metric-val">
                      {plat.queued}
                    </span>

                    <span className="pub-platform-card__metric-lbl">
                      In Queue
                    </span>

                  </div>


                  <div className="pub-platform-card__metric">

                    <span
                      className="pub-platform-card__metric-val"
                      style={{
                        color:
                          plat.failed > 0
                            ? '#ef4444'
                            : 'inherit',
                      }}
                    >
                      {plat.failed}
                    </span>

                    <span className="pub-platform-card__metric-lbl">
                      Failed
                    </span>

                  </div>

                </div>


                <div className="pub-platform-card__sync">

                  Last sync:{' '}

                  {plat.lastSync
                    ? formatDateTime(
                        plat.lastSync
                      )
                    : 'Never'}

                </div>


                {!plat.connected && (

                  <button
                    className="pub-platform-card__reconnect"
                    onClick={() =>
                      navigate(
                        '/connect-apps'
                      )
                    }
                  >
                    Connect Account
                  </button>

                )}

              </div>

            );

          })}

        </div>

      )}


      {/* ========================================================
          RECENT PUBLISHING LOGS
          ======================================================== */}

      <div className="pub-panel">

        <SectionTitle
          title="Recent Publishing Logs"
          description="Last 6 publishing events across all platforms."
        />


        {loading ? (

          <LoadingSkeleton
            type="table"
            rows={6}
          />

        ) : logs.length === 0 ? (

          <EmptyState
            title="No logs yet"
            description="Publishing activity will appear here."
          />

        ) : (

          <div className="pub-logs-table-wrap">

            <table className="pub-logs-table">

              <thead>

                <tr>
                  <th>Time</th>
                  <th>Platform</th>
                  <th>Post</th>
                  <th>Status</th>
                  <th>External Post ID</th>
                  <th>Error</th>
                  <th>Retries</th>
                </tr>

              </thead>


              <tbody>

                {logs.map((log) => (

                  <tr key={log.id}>

                    <td className="pub-logs-table__time">
                      {formatDateTime(
                        log.time
                      )}
                    </td>


                    <td>

                      <PlatformBadge
                        platform={
                          normalizePlatform(
                            log.platform
                          )
                        }
                        size="sm"
                      />

                    </td>


                    <td className="pub-logs-table__caption">
                      {log.postCaption}
                    </td>


                    <td>

                      <StatusBadge
                        status={
                          normalizeStatus(
                            log.status
                          )
                        }
                        size="sm"
                      />

                    </td>


                    <td>

                      {log.externalPostId
                        ? log.externalPostId
                        : '—'}

                    </td>


                    <td>

                      {log.error ? (

                        <span
                          style={{
                            color: '#ef4444',
                            fontSize: '12px',
                          }}
                          title={log.error}
                        >
                          {log.error.length > 80
                            ? `${log.error.slice(
                                0,
                                80
                              )}...`
                            : log.error}
                        </span>

                      ) : (

                        <span>—</span>

                      )}

                    </td>


                    <td
                      className={
                        log.retryAttempts > 0
                          ? 'pub-logs-table__retries--warn'
                          : ''
                      }
                    >
                      {log.retryAttempts}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </PageContainer>
  );
}