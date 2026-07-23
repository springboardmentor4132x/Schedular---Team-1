/**
 * components/EmptyState/EmptyState.jsx
 *
 * Reusable empty-state component.
 * Props: illustration (ReactNode), title, description, actionLabel, onAction
 */

import './EmptyState.css';

export default function EmptyState({ illustration, title, description, actionLabel, onAction }) {
  return (
    <div className="sp-empty-state">
      {illustration && (
        <div className="sp-empty-state__illustration">{illustration}</div>
      )}
      <h3 className="sp-empty-state__title">{title ?? 'Nothing here yet'}</h3>
      {description && (
        <p className="sp-empty-state__desc">{description}</p>
      )}
      {actionLabel && onAction && (
        <button className="sp-empty-state__btn" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
