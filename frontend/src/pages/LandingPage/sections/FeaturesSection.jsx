/**
 * FeaturesSection.jsx — Section 1
 * Plane is upper-left. Content appears on the right.
 */

const FEATURES = [
  { icon: '📅', title: 'Smart Scheduling', desc: 'Queue posts for any platform at the perfect time.' },
  { icon: '📊', title: 'Deep Analytics', desc: 'Track reach, engagement and growth in real time.' },
  { icon: '🤖', title: 'AI Captions', desc: 'Generate on-brand copy in seconds with AI.' },
  { icon: '👥', title: 'Team Workspace', desc: 'Collaborate, review and approve content together.' },
  { icon: '🔗', title: 'All Platforms', desc: 'Instagram, X, LinkedIn, Facebook and more.' },
  { icon: '📈', title: 'Growth Reports', desc: 'Monthly summaries that tell you what actually worked.' },
];

export default function FeaturesSection() {
  return (
    <section className="sp-section sp-features">
      <div className="sp-features__content">
        <p className="sp-eyebrow">FEATURES</p>
        <h2 className="sp-section-title">Your cockpit<br />in the cloud</h2>
        <p className="sp-section-sub">
          Everything a social media team needs, in one focused dashboard.
        </p>

        <div className="sp-features__grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="sp-feature-card">
              <span className="sp-feature-card__icon">{f.icon}</span>
              <h3 className="sp-feature-card__title">{f.title}</h3>
              <p className="sp-feature-card__desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
