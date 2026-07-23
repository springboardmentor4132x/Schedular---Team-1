/**
 * components/ComingSoon/ComingSoon.jsx
 *
 * Placeholder for pages not yet built.
 * Shows the page name and a "coming soon" message.
 */

import './ComingSoon.css';

export default function ComingSoon({ pageName }) {
  return (
    <div className="sp-coming-soon">
      <div className="sp-coming-soon__icon">🚀</div>
      <h2 className="sp-coming-soon__title">{pageName ?? 'Coming Soon'}</h2>
      <p className="sp-coming-soon__desc">
        This section is under construction. Check back soon!
      </p>
    </div>
  );
}
