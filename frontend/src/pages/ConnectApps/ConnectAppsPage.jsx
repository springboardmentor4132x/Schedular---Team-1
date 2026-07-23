/**
 * ConnectAppsPage.jsx  — /connect-apps
 *
 * Platform cards with Connect / Reconnect / Disconnect / Refresh Token / View Details.
 * All actions call service functions — no hardcoded alert().
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FaInstagram, FaFacebookF, FaLinkedinIn,
  FaPinterestP, FaYoutube,
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { MdRefresh, MdInfo } from 'react-icons/md';
import {
  getConnectedAccounts, connectPlatform, disconnectPlatform,
  refreshPlatform, getPlatformDetails,
} from '../../services/socialService';
import './ConnectAppsPage.css';

const PLATFORM_META = {
  facebook:  { icon: <FaFacebookF />,  color: '#1877f2', label: 'Facebook'  },
  instagram: { icon: <FaInstagram />,  color: '#e1306c', label: 'Instagram' },
  linkedin:  { icon: <FaLinkedinIn />, color: '#0a66c2', label: 'LinkedIn'  },
  pinterest: { icon: <FaPinterestP />, color: '#e60023', label: 'Pinterest' },
  youtube:   { icon: <FaYoutube />,   color: '#ff0000', label: 'YouTube'   },
  x:         { icon: <FaXTwitter />,  color: '#14171a', label: 'X'         },
};

function StatusBadge({ status }) {
  const map = {
    connected:    ['Connected',    'connected'],
    disconnected: ['Disconnected', 'disconnected'],
    syncing:      ['Syncing',      'syncing'],
    error:        ['Error',        'error'],
  };
  const [label, cls] = map[status] ?? ['Unknown', 'disconnected'];
  return <span className={`sp-ca-badge sp-ca-badge--${cls}`}>{label}</span>;
}

function formatTime(iso) {
  if (!iso) return 'Never';
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ConnectAppsPage() {
  const [searchParams]          = useSearchParams();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [busy, setBusy]         = useState({}); // platform -> action string
  const [toast, setToast]       = useState('');
  const [detail, setDetail]     = useState(null); // platform details modal

  useEffect(() => {
    getConnectedAccounts().then((data) => {
      setAccounts(data);
      setLoading(false);
    });
  }, []);

  const showToast = (msg) => {
    setTimeout(() => {
      setToast(msg);
      setTimeout(() => setToast(''), 4000);
    }, 0);
  };

  useEffect(() => {
    const connected = searchParams.get('connected');
    const oauthError = searchParams.get('oauth_error');
    const reason = searchParams.get('reason');

    if (connected) {
      const label = PLATFORM_META[connected]?.label || connected;
      showToast(`${label} account connected successfully!`);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (oauthError) {
      const label = PLATFORM_META[oauthError]?.label || oauthError;
      let msg = `${label} connection failed.`;
      if (reason === 'invalid_scope') {
        msg = `${label} connection failed because requested permissions are not available on the developer app.`;
      } else if (reason === 'user_denied') {
        msg = `${label} connection authorization was cancelled.`;
      } else if (reason === 'invalid_state') {
        msg = `${label} connection timed out or security state was invalid.`;
      } else if (reason === 'token_exchange_failed') {
        msg = `Could not complete ${label} token exchange.`;
      } else if (reason === 'unsupported_provider') {
        msg = `${label} integration is not configured or unsupported.`;
      }
      showToast(msg);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams]);

  const setBusyFor = (platform, action) =>
    setBusy((b) => ({ ...b, [platform]: action }));
  const clearBusy = (platform) =>
    setBusy((b) => { const n = { ...b }; delete n[platform]; return n; });

  const handle = (platform, action, fn, successMsg) => async () => {
    setBusyFor(platform, action);
    try {
      const result = await fn();
      if (result?.success !== false) {
        // OAuth must be opened as a top-level browser navigation, not an Axios
        // request, so the provider can show consent and return to our callback.
        if (result?.authorizationUrl) {
          window.location.assign(result.authorizationUrl);
          return;
        }
        showToast(result?.message ?? successMsg);
        // Refresh account list
        const fresh = await getConnectedAccounts();
        setAccounts(fresh);
      } else {
        showToast(result?.message ?? 'Action failed.');
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Something went wrong. Please try again.';
      showToast(msg);
    } finally {
      clearBusy(platform);
    }
  };

  const handleViewDetails = async (platform) => {
    const data = await getPlatformDetails(platform);
    setDetail({ platform, ...data });
  };

  return (
    <div className="sp-ca-page">
      <header className="sp-ca-head">
        <h1 className="sp-ca-heading">Connect Apps</h1>
        <p className="sp-ca-sub">Manage your social media platform connections.</p>
      </header>

      {/* Toast */}
      {toast && <div className="sp-ca-toast">{toast}</div>}

      {loading ? (
        <div className="sp-ca-grid">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="sp-ca-card sp-ca-card--skeleton">
              <div className="sp-skeleton sp-skeleton--circle" />
              <div className="sp-skeleton sp-skeleton--line" />
              <div className="sp-skeleton sp-skeleton--line sp-skeleton--short" />
            </div>
          ))}
        </div>
      ) : (
        <div className="sp-ca-grid">
          {accounts.map((acct) => {
            const meta = PLATFORM_META[acct.platform] ?? {};
            const isConnected = acct.status === 'connected';
            const isBusy = !!busy[acct.platform];
            const currentAction = busy[acct.platform];

            return (
              <div key={acct.platform} className={`sp-ca-card${isConnected ? ' sp-ca-card--connected' : ''}`}>
                {/* Icon + status */}
                <div className="sp-ca-card__top">
                  <div className="sp-ca-card__icon-wrap" style={{ background: `${meta.color}14` }}>
                    <span className="sp-ca-card__icon" style={{ color: meta.color }}>
                      {meta.icon}
                    </span>
                  </div>
                  <StatusBadge status={acct.status} />
                </div>

                {/* Platform name */}
                <h3 className="sp-ca-card__name">{meta.label}</h3>

                {/* Connected account info */}
                {isConnected ? (
                  <div className="sp-ca-card__info">
                    {acct.accountName && (
                      <p className="sp-ca-card__account">{acct.accountName}</p>
                    )}
                    {acct.accountEmail && (
                      <p className="sp-ca-card__email">{acct.accountEmail}</p>
                    )}
                    <p className="sp-ca-card__sync">Last sync: {formatTime(acct.lastSync)}</p>
                    {acct.permissions?.length > 0 && (
                      <p className="sp-ca-card__perms">
                        {acct.permissions.join(', ')}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="sp-ca-card__not-connected">Not connected</p>
                )}

                {/* Actions */}
                <div className="sp-ca-card__actions">
                  {!isConnected ? (
                    <button
                      className="sp-ca-btn sp-ca-btn--primary"
                      disabled={isBusy}
                      onClick={handle(
                        acct.platform, 'connect',
                        () => connectPlatform(acct.platform),
                        `${meta.label} connected.`,
                      )}
                    >
                      {currentAction === 'connect' ? 'Connecting…' : 'Connect'}
                    </button>
                  ) : (
                    <>
                      <button
                        className="sp-ca-btn sp-ca-btn--outline"
                        disabled={isBusy}
                        onClick={handle(
                          acct.platform, 'reconnect',
                          () => connectPlatform(acct.platform),
                          `${meta.label} reconnected.`,
                        )}
                      >
                        {currentAction === 'reconnect' ? 'Reconnecting…' : 'Reconnect'}
                      </button>
                      <button
                        className="sp-ca-btn sp-ca-btn--icon"
                        title="Refresh Token"
                        disabled={isBusy}
                        onClick={handle(
                          acct.platform, 'refresh',
                          () => refreshPlatform(acct.platform),
                          `${meta.label} token refreshed.`,
                        )}
                      >
                        <MdRefresh className={currentAction === 'refresh' ? 'sp-spin' : ''} />
                      </button>
                      <button
                        className="sp-ca-btn sp-ca-btn--icon"
                        title="View Details"
                        onClick={() => handleViewDetails(acct.platform)}
                      >
                        <MdInfo />
                      </button>
                      <button
                        className="sp-ca-btn sp-ca-btn--danger"
                        disabled={isBusy}
                        onClick={handle(
                          acct.platform, 'disconnect',
                          () => disconnectPlatform(acct.platform),
                          `${meta.label} disconnected.`,
                        )}
                      >
                        {currentAction === 'disconnect' ? 'Disconnecting…' : 'Disconnect'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {detail && (
        <div className="sp-ca-modal-backdrop" onClick={() => setDetail(null)}>
          <div className="sp-ca-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="sp-ca-modal__title">
              {PLATFORM_META[detail.platform]?.label} Details
            </h3>
            <ul className="sp-ca-modal__list">
              <li><strong>Status:</strong> {detail.status}</li>
              {detail.accountName && <li><strong>Account:</strong> {detail.accountName}</li>}
              {detail.accountEmail && <li><strong>Email:</strong> {detail.accountEmail}</li>}
              <li><strong>Last sync:</strong> {formatTime(detail.lastSync)}</li>
              {detail.permissions?.length > 0 && (
                <li><strong>Permissions:</strong> {detail.permissions.join(', ')}</li>
              )}
            </ul>
            <button className="sp-ca-btn sp-ca-btn--primary" onClick={() => setDetail(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
