/**
 * components/StatsCard/StatsCard.jsx
 *
 * Reusable KPI stats card.
 * Props: title, value, icon, change (number), trend ('up'|'down'|'neutral'), loading
 */

import './StatsCard.css';

function TrendArrow({ trend }) {
  if (trend === 'up')      return <span className="sp-stats-card__trend sp-stats-card__trend--up">↑</span>;
  if (trend === 'down')    return <span className="sp-stats-card__trend sp-stats-card__trend--down">↓</span>;
  return <span className="sp-stats-card__trend sp-stats-card__trend--neutral">–</span>;
}

export default function StatsCard({ title, value, icon, change, trend = 'neutral', loading = false }) {
  if (loading) {
    return (
      <div className="sp-stats-card sp-stats-card--loading">
        <div className="sp-skeleton sp-skeleton--line sp-skeleton--short" />
        <div className="sp-skeleton sp-skeleton--line sp-skeleton--tall" />
        <div className="sp-skeleton sp-skeleton--line sp-skeleton--medium" />
      </div>
    );
  }

  return (
    <div className="sp-stats-card">
      <div className="sp-stats-card__header">
        <span className="sp-stats-card__title">{title}</span>
        {icon && <span className="sp-stats-card__icon">{icon}</span>}
      </div>
      <div className="sp-stats-card__value">{value ?? '—'}</div>
      {change != null && (
        <div className="sp-stats-card__footer">
          <TrendArrow trend={trend} />
          <span className="sp-stats-card__change">{change > 0 ? `+${change}` : change}% vs last period</span>
        </div>
      )}
    </div>
  );
}
