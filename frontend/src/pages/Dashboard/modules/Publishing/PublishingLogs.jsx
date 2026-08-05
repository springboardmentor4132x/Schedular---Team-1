/**
 * PublishingLogs.jsx
 *
 * Module 5 — Publishing Logs page.
 * Complete publishing history with filters, search, and export.
 */

import { useState, useEffect, useMemo } from 'react';
import { MdSearch, MdFilterList, MdDownload, MdErrorOutline } from 'react-icons/md';
import PageContainer   from '../../components/PageContainer/PageContainer';
import LoadingSkeleton from '../../components/LoadingSkeleton/LoadingSkeleton';
import EmptyState      from '../../components/EmptyState/EmptyState';
import StatusBadge     from './components/StatusBadge';
import PlatformBadge   from './components/PlatformBadge';
import SubNav          from './components/SubNav';
import { mockPublishingLogs } from './publishingMockData';
import publishingService from '../../../../services/publishingService';
import './PublishingLogs.css';

const PLATFORMS = ['all', 'facebook', 'instagram', 'linkedin', 'youtube', 'x', 'pinterest'];
const STATUSES  = ['all', 'published', 'failed', 'retrying'];
const PAGE_SIZE  = 15;

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function PublishingLogs({ ownerType = 'marketing' }) {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [platform, setPlatform] = useState('all');
  const [status, setStatus]     = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [page, setPage]         = useState(1);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    publishingService.getPublishingLogs()
      .catch(() => mockPublishingLogs)
      .then((data) => {
        // Normalize: map post statuses to log entries
        const normalized = data.map((item, i) => ({
          id: item.id ?? `log-${i}`,
          time: item.time ?? item.updated_at ?? item.created_at,
          platform: Array.isArray(item.platforms) ? item.platforms[0] : item.platform ?? 'facebook',
          postCaption: item.postCaption ?? item.caption ?? 'No caption',
          status: item.status ?? 'published',
          apiResponse: item.apiResponse ?? '200 OK',
          duration: item.duration ?? '—',
          retryAttempts: item.retryAttempts ?? 0,
          errorMessage: item.errorMessage ?? null,
        }));
        setItems(normalized);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    return items.filter((log) => {
      if (search && !log.postCaption?.toLowerCase().includes(search.toLowerCase())) return false;
      if (platform !== 'all' && log.platform !== platform) return false;
      if (status !== 'all' && log.status !== status) return false;
      if (dateFrom && log.time && new Date(log.time) < new Date(dateFrom)) return false;
      return true;
    });
  }, [items, search, platform, status, dateFrom]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExport = () => {
    const csv = [
      ['Time', 'Platform', 'Post Caption', 'Status', 'API Response', 'Duration', 'Retry Attempts', 'Error'].join(','),
      ...filtered.map((log) => [
        `"${formatDateTime(log.time)}"`,
        log.platform,
        `"${log.postCaption}"`,
        log.status,
        log.apiResponse,
        log.duration,
        log.retryAttempts,
        `"${log.errorMessage ?? ''}"`,
      ].join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'publishing_logs.csv';
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <PageContainer
      title="Publishing Logs"
      description="Complete history of all publishing events with status, duration, and error details."
      breadcrumb={[ownerType === 'marketing' ? 'Marketing' : 'Creator', 'Publishing', 'Logs']}
    >
      <SubNav role={ownerType} />

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <div className="pl-filters">
        <div className="pl-search">
          <MdSearch className="pl-search__icon" />
          <input
            className="pl-search__input"
            type="text"
            placeholder="Search logs…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            id="pl-search-input"
          />
        </div>
        <div className="pl-filter-row">
          <MdFilterList className="pl-icon" />
          <select className="pl-select" value={platform} onChange={(e) => { setPlatform(e.target.value); setPage(1); }}>
            {PLATFORMS.map((p) => <option key={p} value={p}>{p === 'all' ? 'All Platforms' : p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
          <select className="pl-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            {STATUSES.map((s) => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <input type="date" className="pl-select" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} title="From date" />
          <button className="pl-export-btn" onClick={handleExport} title="Export CSV" id="pl-export-btn">
            <MdDownload /> Export
          </button>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      {loading ? (
        <LoadingSkeleton type="table" rows={10} />
      ) : paged.length === 0 ? (
        <EmptyState title="No logs found" description="Try adjusting your filters to find logs." illustration="📋" />
      ) : (
        <div className="pl-table-wrap">
          <table className="pl-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Platform</th>
                <th>Post Caption</th>
                <th>Status</th>
                <th>API Response</th>
                <th>Duration</th>
                <th>Retries</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((log) => (
                <>
                  <tr
                    key={log.id}
                    className={log.errorMessage ? 'pl-table__row--error' : ''}
                    onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                    style={{ cursor: log.errorMessage ? 'pointer' : 'default' }}
                  >
                    <td className="pl-table__time">{formatDateTime(log.time)}</td>
                    <td><PlatformBadge platform={log.platform} size="sm" /></td>
                    <td className="pl-table__caption">{log.postCaption}</td>
                    <td><StatusBadge status={log.status} size="sm" /></td>
                    <td className={`pl-table__api ${log.status === 'failed' ? 'pl-table__api--error' : ''}`}>{log.apiResponse}</td>
                    <td>{log.duration}</td>
                    <td className={log.retryAttempts > 0 ? 'pl-table__retry--warn' : ''}>{log.retryAttempts}</td>
                    <td>{log.errorMessage ? <MdErrorOutline className="pl-error-icon" /> : '—'}</td>
                  </tr>
                  {expanded === log.id && log.errorMessage && (
                    <tr key={`${log.id}-err`} className="pl-table__error-row">
                      <td colSpan={8}>
                        <div className="pl-error-detail">
                          <strong>Error Details:</strong> {log.errorMessage}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ─────────────────────────────────────────────────── */}
      {!loading && totalPages > 1 && (
        <div className="pl-pagination">
          <span className="pl-pagination__info">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} logs
          </span>
          <div className="pl-pagination__controls">
            <button className="pl-page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>←</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
              <button key={p} className={`pl-page-btn${p === page ? ' pl-page-btn--active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="pl-page-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>→</button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
