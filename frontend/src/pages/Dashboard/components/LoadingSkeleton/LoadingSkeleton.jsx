/**
 * components/LoadingSkeleton/LoadingSkeleton.jsx
 *
 * Generic shimmer skeleton. Compose for cards, tables, lists.
 * Props: type ('card'|'table'|'list'), rows, className
 */

import './LoadingSkeleton.css';

function SkeletonLine({ width = '100%', height = '14px' }) {
  return (
    <div className="sp-skeleton sp-skeleton--line" style={{ width, height }} />
  );
}

function SkeletonCard() {
  return (
    <div className="sp-skeleton-card">
      <SkeletonLine width="40%" height="12px" />
      <SkeletonLine width="60%" height="32px" />
      <SkeletonLine width="50%" height="12px" />
    </div>
  );
}

function SkeletonTableRow() {
  return (
    <div className="sp-skeleton-table-row">
      <SkeletonLine width="20%" />
      <SkeletonLine width="35%" />
      <SkeletonLine width="15%" />
      <SkeletonLine width="20%" />
    </div>
  );
}

function SkeletonListRow() {
  return (
    <div className="sp-skeleton-list-row">
      <div className="sp-skeleton sp-skeleton--circle" />
      <div className="sp-skeleton-list-text">
        <SkeletonLine width="60%" height="13px" />
        <SkeletonLine width="40%" height="11px" />
      </div>
    </div>
  );
}

export default function LoadingSkeleton({ type = 'card', rows = 4, className = '' }) {
  const items = Array.from({ length: rows }, (_, i) => i);

  if (type === 'table') {
    return (
      <div className={`sp-skeleton-table ${className}`}>
        {items.map((i) => <SkeletonTableRow key={i} />)}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className={`sp-skeleton-list ${className}`}>
        {items.map((i) => <SkeletonListRow key={i} />)}
      </div>
    );
  }

  // Default: grid of cards
  return (
    <div className={`sp-skeleton-cards ${className}`}>
      {items.map((i) => <SkeletonCard key={i} />)}
    </div>
  );
}
