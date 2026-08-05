/**
 * PlatformStatus.jsx
 *
 * Module 5 — Platform Status page.
 * Shows connection health, activity breakdown, and management actions
 * for every social media account.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdCheckCircle, MdErrorOutline, MdWarning, MdLinkOff, MdLink,
  MdRefresh, MdArrowForward,
} from 'react-icons/md';
import PageContainer   from '../../components/PageContainer/PageContainer';
import SectionTitle    from '../../components/SectionTitle/SectionTitle';
import LoadingSkeleton from '../../components/LoadingSkeleton/LoadingSkeleton';
import { mockPlatformStatus, PLATFORM_META } from './publishingMockData';
import SubNav from './components/SubNav';
import publishingService from '../../../../services/publishingService';
import './PlatformStatus.css';

function formatDateTime(iso) {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const HEALTH_CONFIG = {
  healthy:      { icon: <MdCheckCircle />, color: '#10b981', label: 'Healthy',       bg: 'rgba(16,185,129,0.08)' },
  warning:      { icon: <MdWarning />,     color: '#f59e0b', label: 'Needs Attention', bg: 'rgba(245,158,11,0.08)' },
  error:        { icon: <MdErrorOutline />,color: '#ef4444', label: 'Error',          bg: 'rgba(239,68,68,0.08)' },
  disconnected: { icon: <MdLinkOff />,     color: '#94a3b8', label: 'Disconnected',   bg: 'rgba(148,163,184,0.08)' },
};

export default function PlatformStatus({ ownerType = 'marketing' }) {
  const navigate = useNavigate();
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(null);

  const load = () => {
    setLoading(true);
    publishingService.getSocialAccounts()
      .catch(() => mockPlatformStatus)
      .then((data) => {
        const normalized = data.length > 0 ? data.map((a) => ({
          platform: a.platform,
          connected: a.status === 'connected' || a.connected,
          publishedToday: a.publishedToday ?? 0,
          queued: a.queued ?? 0,
          failed: a.failed ?? 0,
          lastSync: a.lastSync ?? a.last_sync,
          health: a.health ?? (a.status === 'connected' ? 'healthy' : 'disconnected'),
          username: a.username ?? null,
        })) : mockPlatformStatus;
        setPlatforms(normalized);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const handleRefresh = async (platform) => {
    setRefreshing(platform);
    await new Promise((r) => setTimeout(r, 1200));
    setRefreshing(null);
  };

  const connected = platforms.filter((p) => p.connected);
  const disconnected = platforms.filter((p) => !p.connected);
  const hasIssues = platforms.filter((p) => p.health === 'error' || p.health === 'warning');

  return (
    <PageContainer
      title="Platform Status"
      description="Monitor the health and activity of all connected social media accounts."
      breadcrumb={[ownerType === 'marketing' ? 'Marketing' : 'Creator', 'Publishing', 'Platform Status']}
    >
      <SubNav role={ownerType} />

      {/* ── Overview Summary ──────────────────────────────────────────── */}
      {!loading && (
        <div className="ps-overview">
          <div className="ps-overview__stat">
            <MdCheckCircle className="ps-overview__icon ps-overview__icon--success" />
            <div>
              <span className="ps-overview__val">{connected.length}</span>
              <span className="ps-overview__lbl">Connected</span>
            </div>
          </div>
          <div className="ps-overview__stat">
            <MdLinkOff className="ps-overview__icon ps-overview__icon--muted" />
            <div>
              <span className="ps-overview__val">{disconnected.length}</span>
              <span className="ps-overview__lbl">Disconnected</span>
            </div>
          </div>
          <div className="ps-overview__stat">
            <MdWarning className="ps-overview__icon ps-overview__icon--warn" />
            <div>
              <span className="ps-overview__val">{hasIssues.length}</span>
              <span className="ps-overview__lbl">Need Attention</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Platforms Grid ────────────────────────────────────────────── */}
      {loading ? (
        <LoadingSkeleton type="card" rows={6} />
      ) : (
        <div className="ps-grid">
          {platforms.map((plat) => {
            const meta   = PLATFORM_META[plat.platform] ?? {};
            const health = HEALTH_CONFIG[plat.health] ?? HEALTH_CONFIG.disconnected;
            return (
              <div
                key={plat.platform}
                className="ps-card"
                style={{ borderTopColor: meta.color }}
              >
                {/* Header */}
                <div className="ps-card__head">
                  <div className="ps-card__identity">
                    <span className="ps-card__icon" style={{ color: meta.color }}>{meta.icon}</span>
                    <div>
                      <div className="ps-card__name">{meta.label}</div>
                      {plat.username && <div className="ps-card__user">@{plat.username}</div>}
                    </div>
                  </div>
                  <div
                    className="ps-card__health-badge"
                    style={{ color: health.color, background: health.bg }}
                  >
                    <span className="ps-card__health-icon">{health.icon}</span>
                    {health.label}
                  </div>
                </div>

                {/* Metrics */}
                <div className="ps-card__metrics">
                  <div className="ps-card__metric">
                    <span className="ps-card__metric-val">{plat.publishedToday}</span>
                    <span className="ps-card__metric-lbl">Published Today</span>
                  </div>
                  <div className="ps-card__divider" />
                  <div className="ps-card__metric">
                    <span className="ps-card__metric-val">{plat.queued}</span>
                    <span className="ps-card__metric-lbl">In Queue</span>
                  </div>
                  <div className="ps-card__divider" />
                  <div className="ps-card__metric">
                    <span
                      className="ps-card__metric-val"
                      style={{ color: plat.failed > 0 ? '#ef4444' : 'inherit' }}
                    >
                      {plat.failed}
                    </span>
                    <span className="ps-card__metric-lbl">Failed</span>
                  </div>
                </div>

                {/* Sync */}
                <div className="ps-card__sync">
                  Last sync: {formatDateTime(plat.lastSync)}
                </div>

                {/* Actions */}
                <div className="ps-card__actions">
                  {plat.connected ? (
                    <>
                      <button
                        className="ps-card__btn ps-card__btn--refresh"
                        onClick={() => handleRefresh(plat.platform)}
                        disabled={refreshing === plat.platform}
                        id={`ps-refresh-${plat.platform}`}
                      >
                        <MdRefresh className={refreshing === plat.platform ? 'ps-spin' : ''} />
                        {refreshing === plat.platform ? 'Refreshing…' : 'Refresh Token'}
                      </button>
                      {plat.failed > 0 && (
                        <button
                          className="ps-card__btn ps-card__btn--view"
                          onClick={() => navigate(ownerType === 'marketing' ? '/marketing/publishing/failed' : '/creator/publishing/failed')}
                          id={`ps-viewfailed-${plat.platform}`}
                        >
                          <MdArrowForward /> View Failed
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      className="ps-card__btn ps-card__btn--connect"
                      onClick={() => navigate('/connect-apps')}
                      id={`ps-connect-${plat.platform}`}
                    >
                      <MdLink /> Connect Account
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
