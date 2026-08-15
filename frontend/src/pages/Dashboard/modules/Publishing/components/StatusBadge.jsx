/**
 * StatusBadge.jsx
 *
 * Reusable publishing status badge component.
 * Props: status (string), size ('sm'|'md'|'lg')
 */

import { POST_STATUSES } from '../../../shared/constants';
import './StatusBadge.css';

export default function StatusBadge({ status = 'draft', size = 'md' }) {
  const meta = POST_STATUSES[status] ?? POST_STATUSES.draft;
  return (
    <span
      className={`sp-status-badge sp-status-badge--${size}`}
      style={{ color: meta.color, background: meta.bg }}
    >
      <span className="sp-status-badge__dot" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}
