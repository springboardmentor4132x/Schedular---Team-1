/**
 * BusinessPostsPage.jsx
 *
 * Read-Only monitoring portal for Business Users (Nike/Apple managers).
 * Displays scheduled or published content list with mock performance reach stats.
 */

import { useState, useMemo } from 'react';
import { MdArticle, MdSchedule, MdCheckCircle, MdSearch } from 'react-icons/md';
import PageContainer from '../../components/PageContainer/PageContainer';
import StatsCard from '../../components/StatsCard/StatsCard';
import EmptyState from '../../components/EmptyState/EmptyState';
import { campaignRepository } from '../Campaigns/campaignRepository';
import { contentRepository } from './contentRepository';
import PostDetailsModal from './PostDetailsModal';
import './BusinessPostsPage.css';

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

export default function BusinessPostsPage({ mode = 'scheduled', businessClientId = 'nike' }) {
  const [searchVal, setSearchVal] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('All');
  const [viewingPostId, setViewingPostId] = useState(null);

  // Campaigns list for campaigns labels resolving
  const campaigns = useMemo(() => {
    return campaignRepository.getCampaigns().filter((c) => c.clientId === businessClientId);
  }, [businessClientId]);

  // Load all client posts
  const posts = useMemo(() => {
    return contentRepository.getPosts({ clientId: businessClientId, status: mode });
  }, [businessClientId, mode]);

  // Statistics
  const stats = useMemo(() => {
    const today = posts.length; // simulated distributions
    const week = posts.length;
    const month = posts.length;
    
    return [
      { id: 'today', title: mode === 'scheduled' ? 'Scheduled Today' : 'Published Today', value: today.toString(), icon: mode === 'scheduled' ? <MdSchedule /> : <MdCheckCircle />, trend: 'neutral' },
      { id: 'week', title: 'This Week', value: week.toString(), icon: <MdArticle />, trend: 'up' },
      { id: 'month', title: 'This Month', value: month.toString(), icon: <MdArticle />, trend: 'up' },
      { id: 'total', title: mode === 'scheduled' ? 'Total Scheduled' : 'Total Published', value: posts.length.toString(), icon: <MdArticle />, trend: 'up' },
    ];
  }, [posts, mode]);

  // Filter list
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const matchesSearch = (p.caption || '').toLowerCase().includes(searchVal.toLowerCase());
      const matchesPlatform = filterPlatform === 'All' || p.platforms.includes(filterPlatform);
      return matchesSearch && matchesPlatform;
    });
  }, [posts, searchVal, filterPlatform]);

  const viewingPost = useMemo(() => posts.find((p) => p.id === viewingPostId), [posts, viewingPostId]);

  return (
    <PageContainer
      title={mode === 'scheduled' ? 'Scheduled Posts' : 'Published Posts'}
      description={
        mode === 'scheduled'
          ? 'Monitor content scheduled for future publication by your marketing agency.'
          : 'Review and audit content published by your marketing team.'
      }
      breadcrumb={['Business', mode === 'scheduled' ? 'Scheduled' : 'Published']}
    >
      {/* Stats row */}
      <div className="bp-stats-grid">
        {stats.map((s) => (
          <StatsCard key={s.id} {...s} />
        ))}
      </div>

      {/* Toolbar filter */}
      <div className="bp-toolbar">
        <div className="bp-toolbar__search">
          <MdSearch className="bp-toolbar__search-icon" />
          <input
            type="text"
            placeholder="Search captions..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="bp-toolbar__search-input"
          />
        </div>

        <div className="bp-toolbar__filters">
          <select
            className="bp-toolbar__select"
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
          >
            <option value="All">All Platforms</option>
            {Object.keys(PLATFORM_CHARS).map((p) => (
              <option key={p} value={p}>{p.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Posts listing */}
      {filteredPosts.length === 0 ? (
        <div className="bp-empty">
          <EmptyState
            illustration={mode === 'scheduled' ? <MdSchedule /> : <MdCheckCircle />}
            title={mode === 'scheduled' ? 'No scheduled posts' : 'No published posts'}
            description={
              searchVal
                ? 'Try matching your search query or platforms filters.'
                : mode === 'scheduled'
                ? 'Your marketing team has not scheduled any new content yet.'
                : 'No published content feeds found for your connected channels.'
            }
          />
        </div>
      ) : (
        <div className="bp-list">
          {filteredPosts.map((post) => (
            <div key={post.id} className="bp-card" onClick={() => setViewingPostId(post.id)}>
              <div className="bp-card__media">
                {post.media?.length > 0 ? (
                  <img src={post.media[0].previewUrl || 'https://via.placeholder.com/80'} alt="Thumb" />
                ) : (
                  <div className="bp-card__media-placeholder">ABC</div>
                )}
              </div>

              <div className="bp-card__body">
                <p className="bp-card__caption">{post.caption || 'No text caption entered'}</p>
                
                <div className="bp-card__meta">
                  <div className="bp-card__platforms">
                    {post.platforms.map((p) => (
                      <span
                        key={p}
                        className="bp-card__plat-badge"
                        style={{ background: PLATFORM_COLORS[p] }}
                      >
                        {PLATFORM_CHARS[p]}
                      </span>
                    ))}
                  </div>

                  {post.campaignId ? (
                    <span className="bp-card__campaign">
                      🏷️ {campaigns.find((c) => c.id === post.campaignId)?.name || 'Campaign'}
                    </span>
                  ) : (
                    <span className="bp-card__campaign bp-card__campaign--none">
                      No Campaign
                    </span>
                  )}

                  {post.scheduledAt && (
                    <span className="bp-card__time">
                      {mode === 'scheduled' ? 'Scheduled' : 'Published'} for: <strong>{new Date(post.scheduledAt).toLocaleString()}</strong>
                    </span>
                  )}
                </div>
              </div>

              <button className="bp-card__view-btn">
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Read-Only Details modal */}
      {viewingPostId && viewingPost && (
        <PostDetailsModal
          post={viewingPost}
          onClose={() => setViewingPostId(null)}
          readOnly={true} // ENFORCES READ-ONLY
        />
      )}
    </PageContainer>
  );
}
