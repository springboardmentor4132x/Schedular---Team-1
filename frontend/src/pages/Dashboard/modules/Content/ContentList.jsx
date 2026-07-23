/**
 * ContentList.jsx
 *
 * Primary Content Scheduling dashboard. Renders post stats summaries,
 * draft logs, scheduled timeline rows, and launches the PostComposer editor.
 */

import { useState, useMemo } from 'react';
import {
  MdAdd, MdDrafts, MdSchedule, MdCheckCircle,
  MdEdit, MdDelete, MdLabel, MdFolderOpen
} from 'react-icons/md';
import StatsCard from '../../components/StatsCard/StatsCard';
import SectionTitle from '../../components/SectionTitle/SectionTitle';
import EmptyState from '../../components/EmptyState/EmptyState';
import { campaignRepository } from '../Campaigns/campaignRepository';
import { contentRepository } from './contentRepository';
import PostComposer from './PostComposer';
import PostDetailsModal from './PostDetailsModal';
import './ContentList.css';

const PLATFORM_CHARS = {
  facebook: 'f',
  instagram: '📷',
  linkedin: 'in',
  youtube: '▶',
  x: '✕',
  pinterest: 'P',
};

const PLATFORM_COLORS = {
  facebook: '#1877F2',
  instagram: '#E1306C',
  linkedin: '#0A66C2',
  youtube: '#FF0000',
  x: '#0f172a',
  pinterest: '#E60023',
};

export default function ContentList({
  clientId,
  ownerId,
  clientName,
  ownerType = 'marketing',
}) {
  const [listRevision, setListRevision] = useState(0);
  const [showComposer, setShowComposer] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [viewingPostId, setViewingPostId] = useState(null);
  
  // Assign Campaign modal/dropdown helper states
  const [campaignAssigningPostId, setCampaignAssigningPostId] = useState(null);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('All');

  // Retrieve campaigns for the inline quick assign selector
  const campaigns = useMemo(() => {
    const all = campaignRepository.getCampaigns();
    if (ownerType === 'marketing') {
      const activeClientId = clientId || (selectedClientId !== 'All' ? selectedClientId : null);
      if (activeClientId) {
        return all.filter((c) => c.clientId === activeClientId);
      }
      return all;
    }
    return all.filter((c) => c.ownerId === ownerId);
  }, [clientId, selectedClientId, ownerId, ownerType]);

  // Load all posts
  const posts = useMemo(() => {
    listRevision;
    let filter = {};
    if (ownerType === 'marketing') {
      if (clientId) {
        filter = { clientId };
      } else if (selectedClientId !== 'All') {
        filter = { clientId: selectedClientId };
      }
    } else {
      filter = { ownerType, ownerId };
    }
    return contentRepository.getPosts(filter);
  }, [clientId, selectedClientId, ownerId, ownerType, listRevision]);

  const viewingPost = useMemo(() => posts.find((p) => p.id === viewingPostId), [posts, viewingPostId]);

  // Compute stat card numbers
  const stats = useMemo(() => {
    const draft = posts.filter((p) => p.status === 'draft').length;
    const scheduled = posts.filter((p) => p.status === 'scheduled').length;
    const publishing = posts.filter((p) => p.status === 'publishing').length;
    const published = posts.filter((p) => p.status === 'published').length;

    return [
      { title: 'Drafts', value: draft.toString(), icon: <MdDrafts />, trend: 'neutral' },
      { title: 'Scheduled', value: scheduled.toString(), icon: <MdSchedule />, trend: 'up' },
      { title: 'Publishing', value: publishing.toString(), icon: <MdFolderOpen />, trend: 'neutral' },
      { title: 'Published', value: published.toString(), icon: <MdCheckCircle />, trend: 'up' },
    ];
  }, [posts]);

  const drafts = useMemo(() => posts.filter((p) => p.status === 'draft'), [posts]);
  const scheduledPosts = useMemo(() => posts.filter((p) => p.status === 'scheduled'), [posts]);

  const handleEdit = (postId) => {
    setEditingPostId(postId);
    setShowComposer(true);
  };

  const handleCreate = () => {
    setEditingPostId(null);
    setShowComposer(true);
  };

  const handleDelete = (postId) => {
    const confirm = window.confirm('Are you sure you want to delete this post entry?');
    if (confirm) {
      contentRepository.deletePost(postId);
      setListRevision((prev) => prev + 1);
    }
  };

  const handleAssignCampaignShortcut = (postId, campaignId) => {
    if (campaignId) {
      contentRepository.assignCampaign(postId, campaignId);
    } else {
      contentRepository.removeCampaign(postId);
    }
    setListRevision((prev) => prev + 1);
    setCampaignAssigningPostId(null);
    setShowAssignDropdown(false);
  };

  return (
    <div className="cs-list-view">
      {/* S1: Header */}
      <SectionTitle
        title="Content Scheduling"
        description={
          clientName
            ? `Create, queue, and schedule social publications for ${clientName}.`
            : 'Create, queue, and schedule your social media channel publications.'
        }
      />

      {/* S2: KPI Summary Cards */}
      <div className="cs-stats-grid">
        {stats.map((s) => (
          <StatsCard key={s.title} {...s} />
        ))}
      </div>

      {/* S3: Main actions bar */}
      <div className="cs-actions-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h3 className="cs-actions-toolbar__title" style={{ margin: 0 }}>Content Pipeline</h3>
          {!clientId && ownerType === 'marketing' && (
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                background: '#fff',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              <option value="All">All Clients</option>
              <option value="nike">Nike</option>
              <option value="puma">Puma</option>
              <option value="tesla">Tesla</option>
              <option value="spotify">Spotify</option>
            </select>
          )}
        </div>
        <button className="cs-actions-toolbar__btn" onClick={handleCreate}>
          <MdAdd /> Create New Post
        </button>
      </div>

      {/* S4: Drafts Row */}
      <div className="cs-section">
        <h4 className="cs-section__title">Recent Drafts</h4>
        {drafts.length === 0 ? (
          <div className="cs-empty-box">
            <EmptyState
              illustration={<MdDrafts />}
              title="No drafts yet"
              description="Write concepts and save drafts before scheduling social media publications."
              actionLabel="+ New Draft"
              onAction={handleCreate}
            />
          </div>
        ) : (
          <div className="cs-posts-grid">
            {drafts.map((post) => (
              <div key={post.id} className="cs-post-card">
                <div className="cs-post-card__media-area">
                  {post.media?.length > 0 ? (
                    <img
                      src={post.media[0].previewUrl || 'https://via.placeholder.com/80'}
                      alt="Thumbnail"
                      className="cs-post-card__thumb"
                    />
                  ) : (
                    <div className="cs-post-card__thumb-placeholder">Abc</div>
                  )}
                </div>

                <div className="cs-post-card__body" onClick={() => setViewingPostId(post.id)} style={{ cursor: 'pointer' }}>
                  <p className="cs-post-card__caption">{post.caption || 'No text caption entered'}</p>
                  
                  <div className="cs-post-card__meta">
                    <div className="cs-post-card__platforms">
                      {post.platforms.map((p) => (
                        <span
                          key={p}
                          className="cs-post-card__plat"
                          style={{ background: PLATFORM_COLORS[p] }}
                          title={p}
                        >
                          {PLATFORM_CHARS[p]}
                        </span>
                      ))}
                    </div>

                    {post.campaignId ? (
                      <span className="cs-post-card__campaign-tag">
                        🏷️ {campaigns.find((c) => c.id === post.campaignId)?.name || 'Campaign'}
                      </span>
                    ) : (
                      <span className="cs-post-card__campaign-tag cs-post-card__campaign-tag--none">
                        No Campaign
                      </span>
                    )}
                  </div>
                </div>

                <div className="cs-post-card__actions">
                  <button className="cs-post-action-btn" onClick={() => handleEdit(post.id)} title="Edit Draft">
                    <MdEdit />
                  </button>
                  <button className="cs-post-action-btn cs-post-action-btn--delete" onClick={() => handleDelete(post.id)} title="Delete Draft">
                    <MdDelete />
                  </button>
                  <button
                    className="cs-post-action-btn cs-post-action-btn--campaign"
                    onClick={() => {
                      setCampaignAssigningPostId(post.id);
                      setShowAssignDropdown(true);
                    }}
                    title="Assign Campaign"
                  >
                    <MdLabel />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* S5: Upcoming Scheduled Posts */}
      <div className="cs-section">
        <h4 className="cs-section__title">Upcoming Scheduled Posts</h4>
        {scheduledPosts.length === 0 ? (
          <div className="cs-empty-box">
            <EmptyState
              illustration={<MdSchedule />}
              title="No upcoming scheduled posts"
              description="Plan your editorial pipeline by scheduling content for future publication."
              actionLabel="Schedule Post"
              onAction={handleCreate}
            />
          </div>
        ) : (
          <div className="cs-posts-grid">
            {scheduledPosts.map((post) => (
              <div key={post.id} className="cs-post-card cs-post-card--scheduled">
                <div className="cs-post-card__media-area">
                  {post.media?.length > 0 ? (
                    <img
                      src={post.media[0].previewUrl || 'https://via.placeholder.com/80'}
                      alt="Thumbnail"
                      className="cs-post-card__thumb"
                    />
                  ) : (
                    <div className="cs-post-card__thumb-placeholder">Abc</div>
                  )}
                </div>

                <div className="cs-post-card__body" onClick={() => setViewingPostId(post.id)} style={{ cursor: 'pointer' }}>
                  <p className="cs-post-card__caption">{post.caption || 'No text caption entered'}</p>
                  
                  <div className="cs-post-card__meta">
                    <div className="cs-post-card__platforms">
                      {post.platforms.map((p) => (
                        <span
                          key={p}
                          className="cs-post-card__plat"
                          style={{ background: PLATFORM_COLORS[p] }}
                          title={p}
                        >
                          {PLATFORM_CHARS[p]}
                        </span>
                      ))}
                    </div>

                    {post.campaignId ? (
                      <span className="cs-post-card__campaign-tag">
                        🏷️ {campaigns.find((c) => c.id === post.campaignId)?.name || 'Campaign'}
                      </span>
                    ) : (
                      <span className="cs-post-card__campaign-tag cs-post-card__campaign-tag--none">
                        No Campaign
                      </span>
                    )}

                    <span className="cs-post-card__time">
                      ⏰ {new Date(post.scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>

                <div className="cs-post-card__actions">
                  <button className="cs-post-action-btn" onClick={() => handleEdit(post.id)} title="Edit Scheduled Post">
                    <MdEdit />
                  </button>
                  <button className="cs-post-action-btn cs-post-action-btn--delete" onClick={() => handleDelete(post.id)} title="Cancel Schedule">
                    <MdDelete />
                  </button>
                  <button
                    className="cs-post-action-btn cs-post-action-btn--campaign"
                    onClick={() => {
                      setCampaignAssigningPostId(post.id);
                      setShowAssignDropdown(true);
                    }}
                    title="Assign Campaign"
                  >
                    <MdLabel />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* S6: Composer Overlay */}
      {showComposer && (
        <div className="cs-composer-overlay">
          <div className="cs-composer-modal">
            <PostComposer
              postId={editingPostId}
              clientId={clientId || (selectedClientId !== 'All' ? selectedClientId : undefined)}
              ownerId={ownerId}
              ownerType={ownerType}
              onClose={() => setShowComposer(false)}
              onSave={() => {
                setShowComposer(false);
                setListRevision((prev) => prev + 1);
              }}
            />
          </div>
        </div>
      )}

      {/* S7: Quick Assign Campaign Modal Selector */}
      {showAssignDropdown && campaignAssigningPostId && (
        <div className="cs-composer-overlay">
          <div className="cs-assign-modal">
            <h3 className="cs-assign-modal__title">Assign Campaign</h3>
            <p className="cs-assign-modal__desc">Change or link campaign folders without affecting scheduled calendar date/times.</p>
            
            <div className="cs-assign-list">
              <button
                className="cs-assign-option"
                onClick={() => handleAssignCampaignShortcut(campaignAssigningPostId, null)}
              >
                No Campaign
              </button>
              {campaigns.map((c) => (
                <button
                  key={c.id}
                  className="cs-assign-option"
                  onClick={() => handleAssignCampaignShortcut(campaignAssigningPostId, c.id)}
                >
                  🏷️ {c.name}
                </button>
              ))}
            </div>

            <div className="cs-assign-modal__footer">
              <button
                className="cs-composer__btn cs-composer__btn--cancel"
                onClick={() => {
                  setCampaignAssigningPostId(null);
                  setShowAssignDropdown(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* S8: Details Overlay */}
      {viewingPostId && viewingPost && (
        <PostDetailsModal
          post={viewingPost}
          onClose={() => setViewingPostId(null)}
          onEdit={(id) => {
            setViewingPostId(null);
            handleEdit(id);
          }}
          onDelete={(id) => {
            setViewingPostId(null);
            handleDelete(id);
          }}
          onCancelSchedule={(id) => {
            const confirm = window.confirm('Are you sure you want to cancel publication scheduling for this post?');
            if (confirm) {
              contentRepository.updatePost(id, { status: 'draft', scheduledAt: null });
              setListRevision((prev) => prev + 1);
              setViewingPostId(null);
            }
          }}
          onAssignCampaign={(id) => {
            setViewingPostId(null);
            setCampaignAssigningPostId(id);
            setShowAssignDropdown(true);
          }}
          readOnly={false}
        />
      )}
    </div>
  );
}
