/**
 * HeroSection.jsx — Section 0
 *
 * Full viewport. The airplane (rendered by FixedScene above this layer)
 * is the visual centrepiece — the copy sits centre-left so the two
 * elements share the viewport without competing.
 *
 * The fixed navbar already displays the SocialPilot brand and auth
 * buttons, so NO duplicate branding is rendered here.
 */

import { useNavigate } from 'react-router-dom';

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="sp-section sp-hero">
      {/* Main copy — vertically centred, left-aligned */}
      <div className="sp-hero__copy">
        <p className="sp-hero__eyebrow">Social Media, Automated</p>
        <h1 className="sp-hero__headline">
          Your brand,<br />
          <span className="sp-accent">in full flight.</span>
        </h1>
        <p className="sp-hero__sub">
          Plan, schedule, publish and analyze across every platform —
          all from one cockpit.
        </p>
        <div className="sp-hero__actions">
          <button className="sp-btn sp-btn--primary" onClick={() => navigate('/register')}>
            Get Started Free
          </button>
          <button className="sp-btn sp-btn--ghost" onClick={() => navigate('/login')}>
            Sign In
          </button>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="sp-hero__scroll-hint">
        <span>Scroll to fly</span>
        <div className="sp-hero__scroll-arrow" />
      </div>
    </section>
  );
}
