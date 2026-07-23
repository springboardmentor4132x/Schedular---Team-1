/**
 * MyPostsPage.jsx
 *
 * Content Creator personal Posts Library.
 * Displays total drafts, scheduled posts, and performance metrics,
 * and launches PostComposer/PostDetailsModal overlays.
 */

import { useState, useMemo } from 'react';
import {
  MdAdd, MdArticle, MdDrafts, MdSchedule, MdCheckCircle,
  MdLabel, MdDelete, MdEdit, MdSearch
} from 'react-icons/md';
import PageContainer from '../../components/PageContainer/PageContainer';
import StatsCard from '../../components/StatsCard/StatsCard';
import EmptyState from '../../components/EmptyState/EmptyState';
import { campaignRepository } from '../Campaigns/campaignRepository';
import { contentRepository } from './contentRepository';
import PostComposer from './PostComposer';
import PostDetailsModal from './PostDetailsModal';
import './MyPostsPage.css';

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

export default function MyPostsPage({
  clientId,
  ownerId,
  ownerType = 'creator',
  clientName,
}) {
  const [listRevision, setListRevision] = useState(0);
  const [searchVal, setSearchVal] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('All');
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Drafts' | 'Scheduled' | 'Published'

  // Overlays
  const [showComposer, setShowComposer] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [viewingPostId, setViewingPostId] = useState(null);
  const [campaignAssigningPostId, setCampaignAssigningPostId] = useState(null);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);

  // Retrieve campaigns for campaigns mapping/dropdown
  const campaigns = useMemo(() => {
    const all = campaignRepository.getCampaigns();
    if (ownerType === 'marketing') {
      return all.filter((c) => c.clientId === clientId);
    }
    return all.filter((c) => c.ownerId === ownerId);
  }, [clientId, ownerId, ownerType]);

  // Load all posts
  const posts = useMemo(() => {
    listRevision;
    const filter = ownerType === 'marketing' ? { clientId } : { ownerType, ownerId };
    return contentRepository.getPosts(filter);
  }, [clientId, ownerId, ownerType, listRevision]);

  // Stats Card Calculations
  const stats = useMemo(() => {
    const total = posts.length;
    const drafts = posts.filter((p) => p.status === 'draft').length;
    const scheduled = posts.filter((p) => p.status === 'scheduled').length;
    const published = posts.filter((p) => p.status === 'published').length;

    return [
      { id: 'total', title: 'Total Posts', value: total.toString(), icon: <MdArticle />, trend: 'neutral' },
      { id: 'drafts', title: 'Drafts', value: drafts.toString(), icon: <MdDrafts />, trend: 'neutral' },
      { id: 'scheduled', title: 'Scheduled', value: scheduled.toString(), icon: <MdSchedule />, trend: 'up' },
      { id: 'published', title: 'Published', value: published.toString(), icon: <MdCheckCircle />, trend: 'up' },
    ];
  }, [posts]);

  // Apply filters client-side
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      // 1. Search filter
      const matchesSearch = (p.caption || '').toLowerCase().includes(searchVal.toLowerCase());
      if (!matchesSearch) return false;

      // 2. Platform filter
      if (filterPlatform !== 'All' && !p.platforms.includes(filterPlatform)) return false;

      // 3. Tab filter
      if (activeTab === 'Drafts' && p.status !== 'draft') return false;
      if (activeTab === 'Scheduled' && p.status !== 'scheduled') return false;
      if (activeTab === 'Published' && p.status !== 'published') return false;

      return true;
    });
  }, [posts, searchVal, filterPlatform, activeTab]);

  const viewingPost = useMemo(() => posts.find((p) => p.id === viewingPostId), [posts, viewingPostId]);

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
    <PageContainer
      title={clientName ? `${clientName} Posts Library` : 'My Posts'}
      description={
        clientName
          ? `View, organize, and monitor content queue files for ${clientName}.`
          : 'View and manage your drafts, scheduled, and published social content.'
      }
      breadcrumb={clientName ? ['Marketing', clientName, 'Posts'] : ['Creator', 'My Posts']}
    >
      {/* S1: Overview Stats */}
      <div className="mp-stats-grid">
        {stats.map((s) => (
          <StatsCard key={s.id} {...s} />
        ))}
      </div>

      {/* S2: Filters toolbar */}
      <div className="mp-toolbar">
        <div className="mp-toolbar__search">
          <MdSearch className="mp-toolbar__search-icon" />
          <input
            type="text"
            placeholder="Search captions..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="mp-toolbar__search-input"
          />
        </div>

        <div className="mp-toolbar__filters">
          <select
            className="mp-toolbar__select"
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
          >
            <option value="All">All Platforms</option>
            {Object.keys(PLATFORM_CHARS).map((p) => (
              <option key={p} value={p}>{p.toUpperCase()}</option>
            ))}
          </select>

          <button className="mp-toolbar__create-btn" onClick={handleCreate}>
            <MdAdd /> Create Post
          </button>
        </div>
      </div>

      {/* S3: Tabs navigation */}
      <div className="mp-tabs">
        {['All', 'Drafts', 'Scheduled', 'Published'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`mp-tab-btn${activeTab === tab ? ' mp-tab-btn--active' : ''}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* S4: Grid library posts items */}
      {filteredPosts.length === 0 ? (
        <div className="mp-empty">
          <EmptyState
            illustration={<MdArticle />}
            title="No posts found"
            description="No post entries found matching the selected filters and search query."
          />
        </div>
      ) : (
        <div className="mp-list">
          {filteredPosts.map((post) => (
            <div key={post.id} className={`mp-card mp-card--${post.status}`}>
              <div className="mp-card__media" onClick={() => setViewingPostId(post.id)}>
                {post.media?.length > 0 ? (
                  <img src={post.media[0].previewUrl || 'https://via.placeholder.com/80'} alt="Thumb" />
                ) : (
                  <div className="mp-card__media-placeholder">ABC</div>
                )}
              </div>

              <div className="mp-card__body" onClick={() => setViewingPostId(post.id)}>
                <p className="mp-card__caption">{post.caption || 'No caption text added'}</p>
                <div className="mp-card__meta">
                  <div className="mp-card__platforms">
                    {post.platforms.map((p) => (
                      <span
                        key={p}
                        className="mp-card__plat-badge"
                        style={{ background: PLATFORM_COLORS[p] }}
                      >
                        {PLATFORM_CHARS[p]}
                      </span>
                    ))}
                  </div>

                  {post.campaignId ? (
                    <span className="mp-card__campaign">
                      🏷️ {campaigns.find((c) => c.id === post.campaignId)?.name || 'Campaign'}
                    </span>
                  ) : (
                    <span className="mp-card__campaign mp-card__campaign--none">
                      No Campaign
                    </span>
                  )}

                  {post.scheduledAt && (
                    <span className="mp-card__time">
                      {post.status === 'published' ? 'Published' : 'Scheduled'}: <strong>{new Date(post.scheduledAt).toLocaleDateString()}</strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="mp-card__actions">
                <span className={`mp-card__status mp-status-badge--${post.status}`}>
                  {post.status}
                </span>

                <div className="mp-card__buttons">
                  <button className="mp-action-btn" onClick={() => setViewingPostId(post.id)} title="View Details">
                    View
                  </button>
                  
                  {/* Operations available for draft/scheduled posts */}
                  {(post.status === 'draft' || post.status === 'scheduled') && (
                    <>
                      <button className="mp-action-btn" onClick={() => handleEdit(post.id)} title="Edit Post">
                        <MdEdit />
                      </button>
                      <button className="mp-action-btn mp-action-btn--delete" onClick={() => handleDelete(post.id)} title="Delete Post">
                        <MdDelete />
                      </button>
                      <button
                        className="mp-action-btn"
                        onClick={() => {
                          setCampaignAssigningPostId(post.id);
                          setShowAssignDropdown(true);
                        }}
                        title="Assign Campaign"
                      >
                        <MdLabel />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* S5: PostComposer Overlay */}
      {showComposer && (
        <div className="cs-composer-overlay">
          <div className="cs-composer-modal">
            <PostComposer
              postId={editingPostId}
              clientId={clientId}
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

      {/* S6: PostDetailsModal Overlay */}
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
            const confirm = window.confirm('Cancel publication schedule?');
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

      {/* S7: Quick Assign Campaign dropdown */}
      {showAssignDropdown && campaignAssigningPostId && (
        <div className="cs-composer-overlay">
          <div className="cs-assign-modal">
            <h3 className="cs-assign-modal__title">Assign Campaign</h3>
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
    </PageContainer>
  );
}
