/**
 * HeroSection.jsx — Section 0
 *
 * The outer div (.sp-hero-scroll-container) is 200vh tall and provides
 * scroll "space" for the plane animation without the page advancing.
 *
 * The inner section (.sp-hero) is position:sticky so it stays pinned in
 * the viewport while the user scrolls through the extra 100vh — exactly
 * the duration of the plane's bottom-left → upper-right flight.
 *
 * Once the user has scrolled the full 200vh, the sticky section unsticks
 * naturally and the Features section scrolls into view.
 *
 * wrapperRef (the 200vh container) is passed to HeroPlane → PlaneModel
 * so progress can be computed from getBoundingClientRect() every frame.
 */

import { useRef, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroPlane from '../scene/HeroPlane';

export default function HeroSection() {
  const navigate   = useNavigate();
  const wrapperRef = useRef();

  return (
    <div ref={wrapperRef} className="sp-hero-scroll-container">

      {/* Sticky hero — stays in viewport for the full 100vh of extra scroll */}
      <section className="sp-section sp-hero">

        {/* 3D plane canvas — absolute fill, behind copy */}
        <Suspense fallback={null}>
          <HeroPlane wrapperRef={wrapperRef} />
        </Suspense>

        {/* Main copy */}
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
    </div>
  );
}
