/**
 * PricingSection.jsx — Section 4
 * Plane is top-center. Pricing cards below.
 */

const PLANS = [
  {
    name:    'Starter',
    price:   '$0',
    period:  'forever',
    desc:    'Perfect for individuals getting started.',
    features: ['3 social accounts', '30 scheduled posts/mo', 'Basic analytics'],
    cta:     'Start Free',
    highlight: false,
  },
  {
    name:    'Pro',
    price:   '$19',
    period:  '/month',
    desc:    'For creators and small teams.',
    features: ['10 social accounts', 'Unlimited scheduling', 'AI captions', 'Advanced analytics'],
    cta:     'Start Pro Trial',
    highlight: true,
  },
  {
    name:    'Agency',
    price:   '$49',
    period:  '/month',
    desc:    'Built for agencies managing multiple clients.',
    features: ['Unlimited accounts', 'Team collaboration', 'Client dashboards', 'White-label reports'],
    cta:     'Contact Sales',
    highlight: false,
  },
];

export default function PricingSection() {
  return (
    <section className="sp-section sp-pricing">
      <div className="sp-pricing__content">
        <p className="sp-eyebrow">PRICING</p>
        <h2 className="sp-section-title">Peak altitude,<br />clear pricing</h2>
        <p className="sp-section-sub">No hidden fees. No surprises. Cancel any time.</p>

        <div className="sp-pricing__grid">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`sp-pricing-card${plan.highlight ? ' sp-pricing-card--highlight' : ''}`}
            >
              <h3 className="sp-pricing-card__name">{plan.name}</h3>
              <div className="sp-pricing-card__price">
                {plan.price}
                <span className="sp-pricing-card__period">{plan.period}</span>
              </div>
              <p className="sp-pricing-card__desc">{plan.desc}</p>
              <ul className="sp-pricing-card__features">
                {plan.features.map((f) => (
                  <li key={f}>✓ {f}</li>
                ))}
              </ul>
              <button className={`sp-btn${plan.highlight ? ' sp-btn--primary' : ' sp-btn--outline'}`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
