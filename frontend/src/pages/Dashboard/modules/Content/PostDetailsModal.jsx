/**
 * PostDetailsModal.jsx
 *
 * Reusable modal popup to display comprehensive details of a post.
 * Includes media grid, platform chips, stats metrics for published items,
 * and context details.
 */

import { MdClose, MdEdit, MdDelete, MdLabel, MdRefresh } from 'react-icons/md';
import Avatar from '../../components/Avatar/Avatar';
import { campaignRepository } from '../Campaigns/campaignRepository';
import './PostDetailsModal.css';

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

export default function PostDetailsModal({
  post,
  onClose,
  onEdit,
  onDelete,
  onCancelSchedule,
  onAssignCampaign,
  readOnly,
}) {
  if (!post) return null;

  // Resolve Campaign Name
  const campaign = post.campaignId ? campaignRepository.getCampaign(post.campaignId) : null;

  // Simulated metrics for published posts
  const metrics = post.status === 'published' ? {
    reach: '4,520',
    likes: '342',
    comments: '28',
    engagement: '8.2%',
  } : null;

  return (
    <div className="cs-details-overlay">
      <div className="cs-details-modal">
        <div className="cs-details-modal__header">
          <div className="cs-details-modal__meta-info">
            <Avatar
              firstName={post.clientId ? post.clientId : 'Creator'}
              lastName=""
              size="sm"
            />
            <div>
              <h3 className="cs-details-modal__title">
                {post.clientId ? `${post.clientId.toUpperCase()} Workspace` : 'Creator Studio'}
              </h3>
              <span className="cs-details-modal__sub">Post ID: {post.id}</span>
            </div>
          </div>
          <button onClick={onClose} className="cs-details-modal__close-btn" aria-label="Close details">
            <MdClose />
          </button>
        </div>

        <div className="cs-details-modal__body">
          {/* Post Content */}
          <div className="cs-details-modal__content-section">
            <div className="cs-details-modal__caption-box">
              <p className="cs-details-modal__caption">{post.caption || 'No text caption entered'}</p>
            </div>

            {post.media?.length > 0 ? (
              <div className="cs-details-modal__media-grid">
                {post.media.map((file) => (
                  <div key={file.id} className="cs-details-modal__media-item">
                    {file.type === 'image' ? (
                      <img src={file.previewUrl || 'https://via.placeholder.com/300'} alt={file.name} />
                    ) : (
                      <video src={file.previewUrl} controls />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="cs-details-modal__no-media">
                <span>No media items attached</span>
              </div>
            )}
          </div>

          {/* Post Parameters */}
          <div className="cs-details-modal__info-section">
            
            {/* Status Badge */}
            <div className="cs-details-modal__row">
              <span className="cs-details-modal__label">Status</span>
              <span className={`cs-details-modal__status cs-status-badge--${post.status}`}>
                {post.status}
              </span>
            </div>

            {/* Platforms */}
            <div className="cs-details-modal__row">
              <span className="cs-details-modal__label">Publishing to</span>
              <div className="cs-details-modal__platforms">
                {post.platforms.map((p) => (
                  <span
                    key={p}
                    className="cs-details-modal__platform-chip"
                    style={{ background: PLATFORM_COLORS[p] }}
                    title={p}
                  >
                    {PLATFORM_CHARS[p]} {p.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>

            {/* Campaign */}
            <div className="cs-details-modal__row">
              <span className="cs-details-modal__label">Campaign</span>
              {campaign ? (
                <span className="cs-details-modal__campaign-tag">
                  🏷️ {campaign.name}
                </span>
              ) : (
                <span className="cs-details-modal__campaign-tag cs-details-modal__campaign-tag--none">
                  No Campaign
                </span>
              )}
            </div>

            {/* Date Details */}
            <div className="cs-details-modal__row">
              <span className="cs-details-modal__label">Timeline</span>
              <div className="cs-details-modal__timeline">
                <span className="cs-details-modal__time-item">
                  Created: <strong>{new Date(post.createdAt).toLocaleString()}</strong>
                </span>
                {post.scheduledAt && (
                  <span className="cs-details-modal__time-item">
                    {post.status === 'published' ? 'Published' : 'Scheduled'}: <strong>{new Date(post.scheduledAt).toLocaleString()}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Metrics Widget (Only for Published Posts) */}
            {metrics && (
              <div className="cs-details-modal__metrics-card">
                <h4 className="cs-details-modal__metrics-title">Performance Insights</h4>
                <div className="cs-details-modal__metrics-grid">
                  <div className="cs-details-modal__metric-item">
                    <span className="cs-details-modal__metric-val">{metrics.reach}</span>
                    <span className="cs-details-modal__metric-lbl">Reach</span>
                  </div>
                  <div className="cs-details-modal__metric-item">
                    <span className="cs-details-modal__metric-val">{metrics.likes}</span>
                    <span className="cs-details-modal__metric-lbl">Likes</span>
                  </div>
                  <div className="cs-details-modal__metric-item">
                    <span className="cs-details-modal__metric-val">{metrics.comments}</span>
                    <span className="cs-details-modal__metric-lbl">Comments</span>
                  </div>
                  <div className="cs-details-modal__metric-item">
                    <span className="cs-details-modal__metric-val">{metrics.engagement}</span>
                    <span className="cs-details-modal__metric-lbl">Eng. Rate</span>
                  </div>
                </div>
              </div>
            )}

            {/* Mock Error Widget for Failed posts */}
            {post.status === 'failed' && (
              <div className="cs-details-modal__error-box">
                <strong>⚠️ Publishing Failed:</strong>
                <p>Social token expired. Please reconnect the channel profiles settings and retry posting.</p>
              </div>
            )}

          </div>
        </div>

        {/* Footer controls based on permissions */}
        <div className="cs-details-modal__footer">
          <div className="cs-details-modal__left-actions">
            {!readOnly && (post.status === 'draft' || post.status === 'scheduled') && onDelete && (
              <button
                className="cs-details-btn cs-details-btn--danger"
                onClick={() => onDelete(post.id)}
              >
                <MdDelete /> Delete Post
              </button>
            )}
            {!readOnly && post.status === 'failed' && (
              <button
                className="cs-details-btn cs-details-btn--retry"
                onClick={() => alert('Future retry request sequence initialized.')}
              >
                <MdRefresh /> Retry Publication
              </button>
            )}
          </div>

          <div className="cs-details-modal__right-actions">
            <button className="cs-details-btn cs-details-btn--cancel" onClick={onClose}>
              Close
            </button>
            {!readOnly && (post.status === 'draft' || post.status === 'scheduled') && (
              <>
                {onCancelSchedule && post.status === 'scheduled' && (
                  <button
                    className="cs-details-btn cs-details-btn--secondary"
                    onClick={() => onCancelSchedule(post.id)}
                  >
                    Cancel Schedule
                  </button>
                )}
                {onAssignCampaign && (
                  <button
                    className="cs-details-btn cs-details-btn--campaign"
                    onClick={() => onAssignCampaign(post.id)}
                  >
                    <MdLabel /> Change Campaign
                  </button>
                )}
                {onEdit && (
                  <button
                    className="cs-details-btn cs-details-btn--submit"
                    onClick={() => onEdit(post.id)}
                  >
                    <MdEdit /> Edit Post
                  </button>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
