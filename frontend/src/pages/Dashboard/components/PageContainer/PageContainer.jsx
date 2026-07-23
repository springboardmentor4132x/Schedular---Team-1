/**
 * components/PageContainer/PageContainer.jsx
 *
 * Standard page wrapper: title, breadcrumb, description, content area.
 * Every dashboard page should use this as its root element.
 */

import './PageContainer.css';

export default function PageContainer({ title, breadcrumb, description, children }) {
  return (
    <div className="sp-page-container">
      <div className="sp-page-header">
        {breadcrumb && (
          <nav className="sp-page-breadcrumb" aria-label="breadcrumb">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="sp-page-breadcrumb__item">
                {i > 0 && <span className="sp-page-breadcrumb__sep">/</span>}
                <span className={i === breadcrumb.length - 1 ? 'sp-page-breadcrumb__current' : 'sp-page-breadcrumb__link'}>
                  {crumb}
                </span>
              </span>
            ))}
          </nav>
        )}
        <h1 className="sp-page-title">{title}</h1>
        {description && <p className="sp-page-desc">{description}</p>}
      </div>
      <div className="sp-page-body">{children}</div>
    </div>
  );
}
