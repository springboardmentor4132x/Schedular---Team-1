/**
 * FailedPosts.jsx
 *
 * Module 5 — Failed Posts page.
 * Displays all failed publishing attempts with retry / edit / delete actions.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdRefresh, MdLinkOff, MdEdit, MdDelete, MdWarning } from 'react-icons/md';
import PageContainer   from '../../components/PageContainer/PageContainer';
import SectionTitle    from '../../components/SectionTitle/SectionTitle';
import LoadingSkeleton from '../../components/LoadingSkeleton/LoadingSkeleton';
import EmptyState      from '../../components/EmptyState/EmptyState';
import StatusBadge     from './components/StatusBadge';
import PlatformBadge   from './components/PlatformBadge';
import SubNav          from './components/SubNav';
import { mockFailedPosts } from './publishingMockData';
import publishingService from '../../../../services/publishingService';
import './FailedPosts.css';

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function FailedPosts({ ownerType = 'marketing' }) {
  const navigate = useNavigate();
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(null);

  const load = () => {
    setLoading(true);
    publishingService.getFailedPosts()
      .catch(() => mockFailedPosts)
      .then((data) => {
        const normalized = data.map((p) => ({
          id: p.id,
          caption: p.caption ?? p.postCaption ?? 'No caption',
          platforms: p.platforms ?? [],
          failureReason: p.failureReason ?? p.errorMessage ?? 'Unknown error',
          failedAt: p.failedAt ?? p.updated_at ?? p.scheduled_for,
          retryCount: p.retryCount ?? p.retryAttempts ?? 0,
        }));
        setPosts(normalized);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const handleRetry = async (postId) => {
    setRetrying(postId);
    try {
      await publishingService.retryPost(postId);
      load();
    } catch (e) { console.error(e); }
    finally { setRetrying(null); }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Permanently delete this failed post?')) return;
    try {
      await publishingService.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (e) { console.error(e); }
  };

  return (
    <PageContainer
      title="Failed Posts"
      description="Posts that failed to publish due to API errors, expired tokens, or rate limits."
      breadcrumb={[ownerType === 'marketing' ? 'Marketing' : 'Creator', 'Publishing', 'Failed']}
    >
      <SubNav role={ownerType} />

      {loading ? (
        <LoadingSkeleton type="card" rows={4} />
      ) : posts.length === 0 ? (
        <EmptyState
          illustration="✅"
          title="No failed posts"
          description="Great! All your posts have been published successfully."
        />
      ) : (
        <>
          <div className="fp-summary">
            <MdWarning className="fp-summary__icon" />
            <span className="fp-summary__text">
              <strong>{posts.length}</strong> post{posts.length !== 1 ? 's' : ''} failed to publish.
              Retry, reconnect your account, or edit and reschedule.
            </span>
          </div>

          <div className="fp-grid">
            {posts.map((post) => (
              <div key={post.id} className="fp-card">
                {/* Header */}
                <div className="fp-card__header">
                  <div className="fp-card__platforms">
                    {post.platforms.map((p) => (
                      <PlatformBadge key={p} platform={p} size="sm" />
                    ))}
                  </div>
                  <StatusBadge status="failed" size="sm" />
                </div>

                {/* Caption */}
                <p className="fp-card__caption">{post.caption}</p>

                {/* Error reason */}
                <div className="fp-card__reason">
                  <MdWarning className="fp-card__reason-icon" />
                  <span>{post.failureReason}</span>
                </div>

                {/* Metadata */}
                <div className="fp-card__meta">
                  <span>Failed: {formatDateTime(post.failedAt)}</span>
                  <span>Retries: {post.retryCount}</span>
                </div>

                {/* Actions */}
                <div className="fp-card__actions">
                  <button
                    className="fp-action-btn fp-action-btn--retry"
                    onClick={() => handleRetry(post.id)}
                    disabled={retrying === post.id}
                    id={`fp-retry-${post.id}`}
                  >
                    <MdRefresh className={retrying === post.id ? 'fp-spin' : ''} />
                    {retrying === post.id ? 'Retrying…' : 'Retry'}
                  </button>
                  <button
                    className="fp-action-btn fp-action-btn--reconnect"
                    onClick={() => navigate('/connect-apps')}
                    id={`fp-reconnect-${post.id}`}
                  >
                    <MdLinkOff /> Reconnect
                  </button>
                  <button
                    className="fp-action-btn fp-action-btn--edit"
                    onClick={() => navigate(ownerType === 'marketing' ? '/marketing/scheduling' : '/creator/scheduling')}
                    id={`fp-edit-${post.id}`}
                  >
                    <MdEdit /> Edit Post
                  </button>
                  <button
                    className="fp-action-btn fp-action-btn--delete"
                    onClick={() => handleDelete(post.id)}
                    id={`fp-delete-${post.id}`}
                  >
                    <MdDelete /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </PageContainer>
  );
}
