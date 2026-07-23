/**
 * AnalyticsPage.jsx
 *
 * Reusable, role-aware dashboard for performance analytics.
 * Renders stats grids, SVG trend line charts, platform performance graphs,
 * campaign metrics, and lists top-performing content derived from contentRepository.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdTimeline, MdTrendingUp, MdPeople, MdCheckCircle
} from 'react-icons/md';
import PageContainer from '../../components/PageContainer/PageContainer';
import StatsCard from '../../components/StatsCard/StatsCard';
import SectionTitle from '../../components/SectionTitle/SectionTitle';
import { campaignRepository } from '../Campaigns/campaignRepository';
import { contentRepository } from '../Content/contentRepository';
import './AnalyticsPage.css';

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

const PLATFORM_NAMES = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  x: 'X (Twitter)',
  pinterest: 'Pinterest',
};

export default function AnalyticsPage({
  clientId,
  ownerId,
  ownerType = 'marketing',
  clientName,
  readOnly = false,
}) {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('30'); // '7' | '30' | '90'
  const [activeMetric, setActiveMetric] = useState('reach'); // 'reach' | 'engagement'
  const [filterClientId, setFilterClientId] = useState('All');

  // Retrieve campaigns
  const campaigns = useMemo(() => {
    const all = campaignRepository.getCampaigns();
    if (ownerType === 'marketing' || ownerType === 'business') {
      const activeClientId = clientId || (filterClientId !== 'All' ? filterClientId : null);
      if (activeClientId) {
        return all.filter((c) => c.clientId === activeClientId);
      }
      return all;
    }
    return all.filter((c) => c.ownerId === ownerId);
  }, [clientId, filterClientId, ownerId, ownerType]);

  // Load all posts
  const posts = useMemo(() => {
    let filter = {};
    if (ownerType === 'marketing' || ownerType === 'business') {
      if (clientId) {
        filter = { clientId };
      } else if (filterClientId !== 'All') {
        filter = { clientId: filterClientId };
      }
    } else {
      filter = { ownerType, ownerId };
    }
    return contentRepository.getPosts(filter);
  }, [clientId, filterClientId, ownerId, ownerType]);

  // Derive metrics from published posts
  const performanceData = useMemo(() => {
    const published = posts.filter((p) => p.status === 'published');
    const scheduled = posts.filter((p) => p.status === 'scheduled');
    const failed = posts.filter((p) => p.status === 'failed');

    let totalReach = 0;
    let totalLikes = 0;
    let totalComments = 0;

    // Build platform performance
    const platformBreakdown = {
      facebook: { posts: 0, reach: 0, engagement: 0 },
      instagram: { posts: 0, reach: 0, engagement: 0 },
      linkedin: { posts: 0, reach: 0, engagement: 0 },
      youtube: { posts: 0, reach: 0, engagement: 0 },
      x: { posts: 0, reach: 0, engagement: 0 },
      pinterest: { posts: 0, reach: 0, engagement: 0 },
    };

    // Build campaign performance aggregation
    const campaignStats = {};
    campaigns.forEach((c) => {
      campaignStats[c.id] = { postsCount: 0, reach: 0, engagement: 0 };
    });

    published.forEach((post) => {
      // Seed deterministic metrics per post based on post ID length/characters
      const seed = post.id.charCodeAt(post.id.length - 1) || 10;
      const baseReach = 1200 + (seed * 45);
      const multiplyFactor = dateRange === '7' ? 0.25 : dateRange === '90' ? 2.8 : 1.0;
      
      const postReach = Math.round(baseReach * multiplyFactor);
      const postLikes = Math.round(postReach * 0.08);
      const postComments = Math.round(postLikes * 0.12);

      totalReach += postReach;
      totalLikes += postLikes;
      totalComments += postComments;

      post.platforms.forEach((p) => {
        if (platformBreakdown[p]) {
          platformBreakdown[p].posts += 1;
          platformBreakdown[p].reach += postReach;
          platformBreakdown[p].engagement += (postLikes + postComments);
        }
      });

      if (post.campaignId && campaignStats[post.campaignId]) {
        campaignStats[post.campaignId].postsCount += 1;
        campaignStats[post.campaignId].reach += postReach;
        campaignStats[post.campaignId].engagement += (postLikes + postComments);
      }
    });

    const totalEngagement = totalLikes + totalComments;
    const engagementRate = totalReach > 0 ? ((totalEngagement / totalReach) * 100).toFixed(1) : '0.0';

    return {
      publishedCount: published.length,
      scheduledCount: scheduled.length,
      failedCount: failed.length,
      reach: totalReach,
      engagement: totalEngagement,
      engagementRate,
      likes: totalLikes,
      comments: totalComments,
      platformBreakdown,
      campaignStats,
      topPosts: published
        .map((p) => {
          const seed = p.id.charCodeAt(p.id.length - 1) || 10;
          const postReach = Math.round((1200 + (seed * 45)) * (dateRange === '7' ? 0.25 : dateRange === '90' ? 2.8 : 1.0));
          const postLikes = Math.round(postReach * 0.08);
          const postComments = Math.round(postLikes * 0.12);
          const eng = postLikes + postComments;
          return { ...p, reach: postReach, engagement: eng, likes: postLikes, comments: postComments };
        })
        .sort((a, b) => b.reach - a.reach)
        .slice(0, 4),
    };
  }, [posts, campaigns, dateRange]);

  // Generate SVG trend coordinates
  const trendPoints = useMemo(() => {
    const pointsCount = dateRange === '7' ? 7 : dateRange === '90' ? 12 : 10;
    const baseMetricValue = activeMetric === 'reach' ? performanceData.reach : performanceData.engagement;
    
    if (pointsCount === 0 || baseMetricValue === 0) return [];

    const coordinates = [];
    const stepX = 100 / (pointsCount - 1);
    
    for (let i = 0; i < pointsCount; i++) {
      // generate smooth wavy lines relative to total value
      const valSeed = Math.sin(i * 1.2) * 0.2 + 0.8;
      const pointVal = Math.round((baseMetricValue / pointsCount) * valSeed);
      const x = i * stepX;
      // invert Y coordinate because SVG origin is top-left
      const y = 80 - (valSeed * 50);
      coordinates.push({ x, y, value: pointVal });
    }
    return coordinates;
  }, [dateRange, activeMetric, performanceData]);

  // Format statistics numbers for easy readability
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const overviewStats = [
    { title: 'Total Reach', value: formatNumber(performanceData.reach), icon: <MdPeople />, trend: 'up' },
    { title: 'Engagement', value: formatNumber(performanceData.engagement), icon: <MdTrendingUp />, trend: 'up' },
    { title: 'Avg. Engagement Rate', value: `${performanceData.engagementRate}%`, icon: <MdTimeline />, trend: 'neutral' },
    { title: 'Published Posts', value: performanceData.publishedCount.toString(), icon: <MdCheckCircle />, trend: 'up' },
  ];

  return (
    <PageContainer
      title={clientName ? `${clientName} Analytics` : 'Analytics Overview'}
      description={
        clientName
          ? `Monitor campaign performances and publishing consistency insights for ${clientName}.`
          : 'Detailed reporting dashboard mapping reach, engagements, and channels growth.'
      }
      breadcrumb={clientName ? ['Marketing', clientName, 'Analytics'] : ['Creator', 'Analytics']}
    >
      {/* Filters & Actions bar */}
      <div className="an-toolbar">
        <div className="an-toolbar__left">
          <SectionTitle
            title="Performance Dashboard"
            description="Derive reach trends and track multi-channel growth."
          />
        </div>

        <div className="an-toolbar__filters" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {!clientId && ownerType === 'marketing' && (
            <select
              value={filterClientId}
              onChange={(e) => setFilterClientId(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                background: '#fff',
                color: '#334155',
                cursor: 'pointer',
                fontWeight: 500
              }}
            >
              <option value="All">All Clients</option>
              <option value="nike">Nike</option>
              <option value="puma">Puma</option>
              <option value="tesla">Tesla</option>
              <option value="spotify">Spotify</option>
            </select>
          )}
          <button
            className={`an-time-btn${dateRange === '7' ? ' an-time-btn--active' : ''}`}
            onClick={() => setDateRange('7')}
          >
            Last 7 Days
          </button>
          <button
            className={`an-time-btn${dateRange === '30' ? ' an-time-btn--active' : ''}`}
            onClick={() => setDateRange('30')}
          >
            Last 30 Days
          </button>
          <button
            className={`an-time-btn${dateRange === '90' ? ' an-time-btn--active' : ''}`}
            onClick={() => setDateRange('90')}
          >
            Last 90 Days
          </button>
        </div>
      </div>

      {/* Overview stats cards grid */}
      <div className="an-stats-grid">
        {overviewStats.map((s, idx) => (
          <StatsCard key={idx} {...s} />
        ))}
      </div>

      {/* SVG Trend chart section */}
      <div className="an-chart-card">
        <div className="an-chart-card__header">
          <h4 className="an-chart-card__title">Performance Trend</h4>
          <div className="an-chart-card__selectors">
            <button
              className={`an-metric-selector${activeMetric === 'reach' ? ' an-metric-selector--active' : ''}`}
              onClick={() => setActiveMetric('reach')}
            >
              Reach
            </button>
            <button
              className={`an-metric-selector${activeMetric === 'engagement' ? ' an-metric-selector--active' : ''}`}
              onClick={() => setActiveMetric('engagement')}
            >
              Engagement
            </button>
          </div>
        </div>

        <div className="an-chart-container">
          {trendPoints.length === 0 ? (
            <div className="an-chart-empty">No performance data in this period.</div>
          ) : (
            <svg viewBox="0 0 100 80" className="an-svg-chart">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Gridlines */}
              <line x1="0" y1="20" x2="100" y2="20" stroke="#f1f5f9" strokeWidth="0.5" />
              <line x1="0" y1="40" x2="100" y2="40" stroke="#f1f5f9" strokeWidth="0.5" />
              <line x1="0" y1="60" x2="100" y2="60" stroke="#f1f5f9" strokeWidth="0.5" />

              {/* Area path */}
              <path
                d={`M 0 80 
                    ${trendPoints.map((p) => `L ${p.x} ${p.y}`).join(' ')} 
                    L 100 80 Z`}
                fill="url(#gradient)"
              />

              {/* Line path */}
              <path
                d={trendPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
                fill="none"
                stroke="#4f46e5"
                strokeWidth="1.5"
                strokeLinecap="round"
              />

              {/* Dots */}
              {trendPoints.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r="1.2"
                  fill="#ffffff"
                  stroke="#4f46e5"
                  strokeWidth="0.8"
                />
              ))}
            </svg>
          )}
        </div>
      </div>

      <div className="an-split-grid">
        {/* Platform breakdown performance */}
        <div className="an-panel">
          <h4 className="an-panel__title">Platform Breakdown</h4>
          <div className="an-platform-list">
            {Object.entries(performanceData.platformBreakdown).map(([platform, stats]) => {
              if (stats.posts === 0) return null;
              const percent = Math.min(100, Math.max(5, Math.round((stats.reach / (performanceData.reach || 1)) * 100)));
              return (
                <div key={platform} className="an-platform-row">
                  <div className="an-platform-row__header">
                    <span className="an-platform-row__name" style={{ color: PLATFORM_COLORS[platform] }}>
                      {PLATFORM_NAMES[platform]}
                    </span>
                    <span className="an-platform-row__val">
                      {formatNumber(stats.reach)} Reach ({stats.posts} posts)
                    </span>
                  </div>
                  <div className="an-platform-progress">
                    <div
                      className="an-platform-progress__fill"
                      style={{ width: `${percent}%`, background: PLATFORM_COLORS[platform] }}
                    />
                  </div>
                </div>
              );
            })}
            {Object.values(performanceData.platformBreakdown).every((s) => s.posts === 0) && (
              <div className="an-platform-empty">No active publications in this timeframe.</div>
            )}
          </div>
        </div>

        {/* Publishing consistency ratios */}
        <div className="an-panel">
          <h4 className="an-panel__title">Publishing Consistency</h4>
          <div className="an-metrics-summary">
            <div className="an-metrics-row">
              <span>Successfully Published</span>
              <span className="an-metrics-badge an-metrics-badge--success">
                {performanceData.publishedCount} Posts
              </span>
            </div>
            <div className="an-metrics-row">
              <span>Scheduled Pipeline</span>
              <span className="an-metrics-badge an-metrics-badge--info">
                {performanceData.scheduledCount} Posts
              </span>
            </div>
            <div className="an-metrics-row">
              <span>Failed Publications</span>
              <span className="an-metrics-badge an-metrics-badge--danger">
                {performanceData.failedCount} Posts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns performance progression cards */}
      <div className="an-panel an-campaign-panel">
        <h4 className="an-panel__title">Campaign Performance</h4>
        
        {campaigns.length === 0 ? (
          <div className="an-campaign-empty">No active campaign logs found.</div>
        ) : (
          <div className="an-campaign-table-wrap">
            <table className="an-campaign-table">
              <thead>
                <tr>
                  <th>Campaign Name</th>
                  <th>Status</th>
                  <th>Posts</th>
                  <th>Total Reach</th>
                  <th>Engagement</th>
                  {!readOnly && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const stat = performanceData.campaignStats[c.id] || { postsCount: 0, reach: 0, engagement: 0 };
                  return (
                    <tr key={c.id}>
                      <td className="an-camp-name">🏷️ {c.name}</td>
                      <td>
                        <span className={`an-camp-status an-camp-status--${c.status}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>{stat.postsCount}</td>
                      <td>{formatNumber(stat.reach)}</td>
                      <td>{formatNumber(stat.engagement)}</td>
                      {!readOnly && (
                        <td>
                          <button
                            className="an-camp-btn"
                            onClick={() => {
                              if (ownerType === 'marketing') {
                                navigate(`/marketing/clients/${clientId}/campaigns/${c.id}`);
                              } else {
                                navigate(`/creator/campaigns/${c.id}`);
                              }
                            }}
                          >
                            View
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top content entries list */}
      <div className="an-panel">
        <h4 className="an-panel__title">Top Performing Content</h4>
        {performanceData.topPosts.length === 0 ? (
          <div className="an-posts-empty">No published content entries found to analyze.</div>
        ) : (
          <div className="an-top-posts">
            {performanceData.topPosts.map((post) => (
              <div key={post.id} className="an-post-card">
                <div className="an-post-card__media">
                  {post.media?.length > 0 ? (
                    <img src={post.media[0].previewUrl || 'https://via.placeholder.com/60'} alt="Post preview" />
                  ) : (
                    <div className="an-post-card__placeholder">ABC</div>
                  )}
                </div>
                <div className="an-post-card__info">
                  <p className="an-post-card__caption">{post.caption || 'No caption'}</p>
                  <div className="an-post-card__channels">
                    {post.platforms.map((p) => (
                      <span
                        key={p}
                        className="an-post-card__channel-badge"
                        style={{ background: PLATFORM_COLORS[p] }}
                      >
                        {PLATFORM_CHARS[p]}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="an-post-card__metrics">
                  <div className="an-post-card__metric">
                    <span className="an-post-card__metric-val">{formatNumber(post.reach)}</span>
                    <span className="an-post-card__metric-lbl">Reach</span>
                  </div>
                  <div className="an-post-card__metric">
                    <span className="an-post-card__metric-val">{formatNumber(post.engagement)}</span>
                    <span className="an-post-card__metric-lbl">Eng.</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
