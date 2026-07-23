/**
 * CampaignCard.jsx
 *
 * Reusable Campaign Card item display.
 */

import { MdLaunch, MdEdit } from 'react-icons/md';
import './CampaignCard.css';

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

export default function CampaignCard({ campaign, onOpen, onEdit, readOnly }) {
  return (
    <div className="cm-card-item">
      <div className="cm-card-item__top">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
          <h4 className="cm-card-item__name">{campaign.name}</h4>
          {campaign.clientId && (
            <span style={{
              fontSize: '9px',
              fontWeight: 700,
              background: '#f1f5f9',
              color: '#475569',
              padding: '2px 6px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              flexShrink: 0
            }}>
              {campaign.clientId}
            </span>
          )}
        </div>
        <span className={`cm-card-item__status cm-status-badge--${campaign.status}`}>
          {campaign.status}
        </span>
      </div>

      <p className="cm-card-item__desc">{campaign.description}</p>

      {/* Progress track */}
      <div className="cm-card-item__progress-wrap">
        <div className="cm-card-item__progress-bar">
          <div
            className="cm-card-item__progress-fill"
            style={{ width: `${campaign.progress}%` }}
          />
        </div>
        <span className="cm-card-item__progress-pct">{campaign.progress}%</span>
      </div>

      {/* Dates & posts count */}
      <div className="cm-card-item__meta">
        <span className="cm-card-item__date">
          {campaign.startDate} to {campaign.endDate}
        </span>
        <span className="cm-card-item__posts">
          {campaign.totalPosts} posts ({campaign.scheduledPosts} scheduled)
        </span>
      </div>

      <div className="cm-card-item__footer">
        {/* Platforms display */}
        <div className="cm-card-item__platforms">
          {campaign.platforms.map((p) => (
            <span
              key={p}
              className="cm-card-item__platform"
              style={{ background: PLATFORM_COLORS[p] }}
              title={p}
            >
              {PLATFORM_CHARS[p]}
            </span>
          ))}
        </div>

        {/* Action buttons */}
        <div className="cm-card-item__actions">
          <button className="cm-card-item__btn" onClick={() => onOpen(campaign.id)}>
            <MdLaunch /> View
          </button>
          {!readOnly && onEdit && (
            <button
              className="cm-card-item__btn cm-card-item__btn--primary"
              onClick={() => onEdit(campaign.id)}
            >
              <MdEdit /> Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
