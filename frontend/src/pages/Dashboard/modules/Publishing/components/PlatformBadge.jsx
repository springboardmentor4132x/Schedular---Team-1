/**
 * PlatformBadge.jsx
 *
 * Reusable social platform badge/chip.
 * Props: platform (string), size ('sm'|'md'), showLabel (bool)
 */

import { PLATFORM_META } from '../../../shared/constants';
import './PlatformBadge.css';

export default function PlatformBadge({ platform, size = 'sm', showLabel = true }) {
  const meta = PLATFORM_META[platform] ?? { label: platform, color: '#6b7280', bgColor: '#f1f5f9', icon: '?' };
  return (
    <span
      className={`sp-platform-badge sp-platform-badge--${size}`}
      style={{ color: meta.color, background: meta.bgColor, borderColor: `${meta.color}30` }}
      title={meta.label}
    >
      <span className="sp-platform-badge__icon">{meta.icon}</span>
      {showLabel && <span className="sp-platform-badge__label">{meta.label}</span>}
    </span>
  );
}
