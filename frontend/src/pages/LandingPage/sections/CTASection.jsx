/**
 * CTASection.jsx — Section 5
 * Plane approaching center-large. Strong single CTA.
 */

import { useNavigate } from 'react-router-dom';

export default function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="sp-section sp-cta">
      <div className="sp-cta__content">
        <h2 className="sp-cta__title">Ready for takeoff?</h2>
        <p className="sp-cta__sub">
          Join thousands of creators and teams who trust SocialPilot
          to keep their social presence flying.
        </p>
        <button
          className="sp-btn sp-btn--primary sp-btn--large"
          onClick={() => navigate('/register')}
        >
          Start Flying Free
        </button>
      </div>
    </section>
  );
}
