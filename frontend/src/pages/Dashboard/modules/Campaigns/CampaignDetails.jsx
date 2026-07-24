/**
 * CampaignDetails.jsx
 *
 * Campaign Details View. Shows statistics, progress bars, timeline, and assigned posts lists.
 * Restricts operational mutations for readOnly users.
 */

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  MdArrowBack, MdFlag, MdTimeline, MdAssignment,
  MdAdd, MdCheckCircle, MdSchedule, MdEditNote, MdDelete
} from 'react-icons/md';
import { campaignRepository } from './campaignRepository';
import { contentRepository } from '../Content/contentRepository';
import './CampaignDetails.css';

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

export default function CampaignDetails({ campaignId, onBack, readOnly }) {
  const { campaignId: paramCampaignId } = useParams();
  const activeId = campaignId || paramCampaignId;
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddPostModal, setShowAddPostModal] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    campaignRepository.getCampaign(activeId)
      .then((data) => {
        setCampaign(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load campaign:', err);
        setLoading(false);
      });
  }, [activeId, revision]);

  const assignedPosts = useMemo(() => {
    if (!campaign) return [];
    return campaign.posts || [];
  }, [campaign]);

  if (loading) {
    return (
      <div className="cd-details-empty">
        <h3>Loading Campaign Details...</h3>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="cd-details-empty">
        <h3>Campaign not found</h3>
        <button onClick={onBack} className="cd-details-back-btn">
          <MdArrowBack /> Back to list
        </button>
      </div>
    );
  }

  const handleRemovePost = async (postId) => {
    if (readOnly) return;
    const confirm = window.confirm('Are you sure you want to remove this post from the campaign?');
    if (!confirm) return;

    try {
      await contentRepository.removeCampaign(postId);
      setRevision((prev) => prev + 1);
    } catch {
      alert('Failed to remove post from campaign.');
    }
  };

  // Determine timeline milestone states
  const now = new Date();
  const startDate = new Date(campaign.startDate);
  const endDate = new Date(campaign.endDate);

  const timelineMilestones = [
    { label: 'Campaign Created', desc: 'Campaign entry added to workspace logs', status: 'completed' },
    { label: 'Content Planning', desc: 'Drafts and scheduling pipelines initiated', status: campaign.draftPosts > 0 || campaign.scheduledPosts > 0 ? 'completed' : 'upcoming' },
    { label: 'First Post Scheduled', desc: 'Automated post scheduling sequence approved', status: campaign.scheduledPosts > 0 || campaign.publishedPosts > 0 ? 'completed' : 'upcoming' },
    { label: 'Campaign Launch', desc: 'Publishing sequence goes live', status: now >= startDate ? 'completed' : 'current' },
    { label: 'Mid-Campaign Review', desc: 'Review performance insights and reach goals', status: campaign.progress >= 50 ? 'completed' : 'upcoming' },
    { label: 'Campaign End', desc: 'Final campaign analytics reporting', status: now >= endDate ? 'completed' : 'upcoming' },
  ];

  return (
    <div className="cm-details-view">
      {/* Back button */}
      <button onClick={onBack} className="cm-details-back-btn">
        <MdArrowBack /> Back to list
      </button>

      <div className="cm-details-header">
        <div className="cm-details-header__main">
          <h2 className="cm-details-header__title">{campaign.name}</h2>
          <span className={`cm-details-header__status cm-status-badge--${campaign.status}`}>
            {campaign.status}
          </span>
        </div>
        <p className="cm-details-header__desc">{campaign.description}</p>
        <div className="cm-details-header__meta">
          <span>📅 Dates: <strong>{campaign.startDate}</strong> to <strong>{campaign.endDate}</strong></span>
          <span>Platforms:
            <span className="cm-details-header__platform-list">
              {campaign.platforms.map((p) => (
                <span
                  key={p}
                  className="cm-details-header__platform-badge"
                  style={{ background: PLATFORM_COLORS[p] }}
                >
                  {PLATFORM_CHARS[p]}
                </span>
              ))}
            </span>
          </span>
        </div>
      </div>

      <div className="cm-details-grid">
        {/* Left Column (Timeline / Posts) */}
        <div className="cm-details-grid__left">
          
          {/* Timeline Section */}
          <div className="cm-details-card">
            <h3 className="cm-details-card__title">
              <MdTimeline /> Campaign Timeline
            </h3>
            <div className="cm-timeline-list">
              {timelineMilestones.map((ms, idx) => (
                <div key={idx} className={`cm-timeline-item cm-timeline-item--${ms.status}`}>
                  <div className="cm-timeline-item__dot" />
                  <div className="cm-timeline-item__content">
                    <span className="cm-timeline-item__label">{ms.label}</span>
                    <span className="cm-timeline-item__desc">{ms.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned Posts Section */}
          <div className="cm-details-card">
            <div className="cm-details-card__header">
              <h3 className="cm-details-card__title">
                <MdAssignment /> Assigned Posts ({assignedPosts.length})
              </h3>
              {!readOnly && (
                <button
                  className="cm-details-card__add-btn"
                  onClick={() => setShowAddPostModal(true)}
                >
                  <MdAdd /> Add Existing Post
                </button>
              )}
            </div>
            
            {assignedPosts.length === 0 ? (
              <div className="cm-details-card__empty-state">
                <p>No posts currently assigned to this campaign.</p>
                <p style={{ fontSize: '11px', color: '#94a3b8' }}>
                  Posts can be attached to campaigns during scheduling or from the details window.
                </p>
              </div>
            ) : (
              <div className="cm-assigned-posts-list">
                {assignedPosts.map((post) => (
                  <div key={post.id} className="cm-assigned-post-row">
                    <span
                      className="cm-assigned-post-row__platform"
                      style={{ background: PLATFORM_COLORS[post.platform] }}
                    >
                      {PLATFORM_CHARS[post.platform]}
                    </span>
                    <div className="cm-assigned-post-row__info">
                      <p className="cm-assigned-post-row__caption">{post.caption}</p>
                      {post.scheduledTime && (
                        <span className="cm-assigned-post-row__time">
                          {post.status === 'published' ? 'Published' : 'Scheduled'} for {post.scheduledTime}
                        </span>
                      )}
                    </div>
                    <span className={`cm-assigned-post-row__status cm-post-status--${post.status}`}>
                      {post.status}
                    </span>
                    {!readOnly && (
                      <button
                        onClick={() => handleRemovePost(post.id)}
                        className="cm-assigned-post-row__remove-btn"
                        title="Remove post from campaign"
                      >
                        <MdDelete />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Metrics & Goals) */}
        <div className="cm-details-grid__right">
          
          {/* Progress Snapshot Card */}
          <div className="cm-details-card">
            <h3 className="cm-details-card__title">
              <MdFlag /> Overall Progress
            </h3>
            <div className="cm-details-progress">
              <div className="cm-details-progress__dial">
                <span className="cm-details-progress__val">{campaign.progress}%</span>
                <span className="cm-details-progress__lbl">Completed</span>
              </div>
              <div className="cm-details-progress__track">
                <div
                  className="cm-details-progress__fill"
                  style={{ width: `${campaign.progress}%` }}
                />
              </div>
            </div>
            
            <div className="cm-details-stats-list">
              <div className="cm-details-stat-row">
                <span>Total Posts</span>
                <strong>{campaign.totalPosts}</strong>
              </div>
              <div className="cm-details-stat-row">
                <span><MdEditNote style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Drafts</span>
                <strong>{campaign.draftPosts}</strong>
              </div>
              <div className="cm-details-stat-row">
                <span><MdSchedule style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Scheduled</span>
                <strong>{campaign.scheduledPosts}</strong>
              </div>
              <div className="cm-details-stat-row">
                <span><MdCheckCircle style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Published</span>
                <strong>{campaign.publishedPosts}</strong>
              </div>
            </div>
          </div>

          {/* Campaign Goals */}
          <div className="cm-details-card">
            <h3 className="cm-details-card__title">Campaign Goals</h3>
            <div className="cm-details-goals">
              {campaign.goals.length === 0 ? (
                <span className="cm-details-goal-tag">General Awareness</span>
              ) : (
                campaign.goals.map((goal) => (
                  <span key={goal} className="cm-details-goal-tag">
                    {goal}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Post Placeholder Modal */}
      {showAddPostModal && (
        <div className="cm-modal-overlay">
          <div className="cm-modal" style={{ maxWidth: '400px' }}>
            <h3 className="cm-modal__title">Assign Existing Post</h3>
            <p className="cm-modal__text">
              Content Scheduling and queue lists management features are scheduled to be implemented in **Phase 7**.
              Once completed, you will be able to search and link your existing scheduled content directly here.
            </p>
            <div className="cm-form__actions">
              <button
                className="cm-form__btn cm-form__btn--submit"
                onClick={() => setShowAddPostModal(false)}
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
