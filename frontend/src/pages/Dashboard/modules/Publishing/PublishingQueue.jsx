/**
 * PublishingQueue.jsx
 *
 * Module 5 — Publishing Queue page.
 * Full filterable, searchable, paginated queue table.
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdSearch, MdFilterList, MdEdit, MdDelete, MdRefresh } from 'react-icons/md';
import PageContainer   from '../../components/PageContainer/PageContainer';
import LoadingSkeleton from '../../components/LoadingSkeleton/LoadingSkeleton';
import EmptyState      from '../../components/EmptyState/EmptyState';
import StatusBadge     from './components/StatusBadge';
import PlatformBadge   from './components/PlatformBadge';
import SubNav          from './components/SubNav';
import { mockQueuePosts } from './publishingMockData';
import publishingService from '../../../../services/publishingService';
import './PublishingQueue.css';

const PLATFORMS = ['all', 'facebook', 'instagram', 'linkedin', 'youtube', 'x', 'pinterest'];
const STATUSES  = ['all', 'scheduled', 'queued', 'pending_approval', 'retrying'];
const PAGE_SIZE  = 10;

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function PublishingQueue({ ownerType = 'marketing' }) {
  const navigate = useNavigate();
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [platform, setPlatform]   = useState('all');
  const [status, setStatus]       = useState('all');
  const [dateFrom, setDateFrom]   = useState('');
  const [dateTo, setDateTo]       = useState('');
  const [page, setPage]           = useState(1);

  useEffect(() => {
    publishingService.getQueue()
      .catch(() => mockQueuePosts)
      .then((data) => { setItems(data); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    return items.filter((post) => {
      if (search && !post.caption?.toLowerCase().includes(search.toLowerCase())) return false;
      if (platform !== 'all' && !(post.platforms || []).includes(platform)) return false;
      if (status !== 'all' && post.status !== status) return false;
      if (dateFrom && post.scheduledFor && new Date(post.scheduledFor) < new Date(dateFrom)) return false;
      if (dateTo   && post.scheduledFor && new Date(post.scheduledFor) > new Date(dateTo))   return false;
      return true;
    });
  }, [items, search, platform, status, dateFrom, dateTo]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleRetry = async (postId) => {
    try {
      await publishingService.retryPost(postId);
      const refreshed = await publishingService.getQueue().catch(() => mockQueuePosts);
      setItems(refreshed);
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Delete this post from the queue?')) return;
    try {
      await publishingService.deletePost(postId);
      setItems((prev) => prev.filter((p) => p.id !== postId));
    } catch (e) { console.error(e); }
  };

  return (
    <PageContainer
      title="Publishing Queue"
      description="Manage all queued posts, adjust positions, and monitor scheduling."
      breadcrumb={[ownerType === 'marketing' ? 'Marketing' : 'Creator', 'Publishing', 'Queue']}
    >
      <SubNav role={ownerType} />

      {/* ── Filters ───────────────────────────────────────────────────── */}
      <div className="pq-filters">
        <div className="pq-search">
          <MdSearch className="pq-search__icon" />
          <input
            type="text"
            className="pq-search__input"
            placeholder="Search posts…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            id="pq-search-input"
          />
        </div>
        <div className="pq-filter-row">
          <MdFilterList className="pq-filter-row__icon" />
          <select
            value={platform}
            onChange={(e) => { setPlatform(e.target.value); setPage(1); }}
            className="pq-select"
            id="pq-platform-filter"
          >
            {PLATFORMS.map((p) => <option key={p} value={p}>{p === 'all' ? 'All Platforms' : p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="pq-select"
            id="pq-status-filter"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
          <input type="date" className="pq-select" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} title="From date" />
          <input type="date" className="pq-select" value={dateTo}   onChange={(e) => { setDateTo(e.target.value);   setPage(1); }} title="To date" />
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────── */}
      {loading ? (
        <LoadingSkeleton type="table" rows={8} />
      ) : paged.length === 0 ? (
        <EmptyState
          title="No posts in queue"
          description="Posts scheduled for future publishing will appear here."
          illustration="📅"
          actionLabel="Create a Post"
          onAction={() => navigate(ownerType === 'marketing' ? '/marketing/scheduling' : '/creator/scheduling')}
        />
      ) : (
        <div className="pq-table-wrap">
          <table className="pq-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Post</th>
                <th>Platform</th>
                <th>Scheduled Time</th>
                <th>Status</th>
                <th>Retries</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((post) => (
                <tr key={post.id}>
                  <td className="pq-table__pos">{post.queuePosition ?? '—'}</td>
                  <td className="pq-table__caption">{post.caption}</td>
                  <td>
                    <div className="pq-platforms">
                      {(post.platforms || []).map((p) => (
                        <PlatformBadge key={p} platform={p} size="sm" showLabel={false} />
                      ))}
                    </div>
                  </td>
                  <td className="pq-table__time">{formatDateTime(post.scheduledFor || post.scheduled_for)}</td>
                  <td><StatusBadge status={post.status} size="sm" /></td>
                  <td className={post.retryCount > 0 ? 'pq-table__retry--warn' : ''}>{post.retryCount ?? 0}</td>
                  <td className="pq-table__author">{post.createdBy ?? '—'}</td>
                  <td>
                    <div className="pq-actions">
                      <button
                        className="pq-action-btn pq-action-btn--edit"
                        title="Edit post"
                        onClick={() => navigate(ownerType === 'marketing' ? '/marketing/scheduling' : '/creator/scheduling')}
                      >
                        <MdEdit />
                      </button>
                      {post.status === 'failed' && (
                        <button
                          className="pq-action-btn pq-action-btn--retry"
                          title="Retry publishing"
                          onClick={() => handleRetry(post.id)}
                        >
                          <MdRefresh />
                        </button>
                      )}
                      <button
                        className="pq-action-btn pq-action-btn--delete"
                        title="Delete post"
                        onClick={() => handleDelete(post.id)}
                      >
                        <MdDelete />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ─────────────────────────────────────────────────── */}
      {!loading && totalPages > 1 && (
        <div className="pq-pagination">
          <span className="pq-pagination__info">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
          </span>
          <div className="pq-pagination__controls">
            <button className="pq-page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>←</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`pq-page-btn${p === page ? ' pq-page-btn--active' : ''}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button className="pq-page-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>→</button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
