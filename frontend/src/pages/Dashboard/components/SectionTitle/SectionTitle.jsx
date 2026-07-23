/**
 * components/SectionTitle/SectionTitle.jsx
 *
 * Reusable section heading with optional description.
 */

import './SectionTitle.css';

export default function SectionTitle({ title, description, action }) {
  return (
    <div className="sp-section-title">
      <div className="sp-section-title__text">
        <h2 className="sp-section-title__heading">{title}</h2>
        {description && <p className="sp-section-title__desc">{description}</p>}
      </div>
      {action && <div className="sp-section-title__action">{action}</div>}
    </div>
  );
}
