/**
 * LandingPage.jsx  —  V2 Scroll-Driven Cinematic Landing Page
 *
 * Layer stack (back to front):
 *   CSS sky gradient  (html/body background)
 *   CloudLayer        position:fixed, z-index: 2  — CSS clouds
 *   .sp-section       z-index: 10                 — HTML content
 *   HeroPlane canvas  position:absolute (inside hero, z-index: 0)
 *   .sp-navbar        position:fixed, z-index: 100
 *
 * The airplane only exists inside the Hero section. Lenis provides
 * smooth scrolling for the entire page.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Lenis from 'lenis';

import './LandingPage.css';

import HeroSection     from './sections/HeroSection';
import FeaturesSection from './sections/FeaturesSection';
import PlatformsSection from './sections/PlatformsSection';
import TimelineSection from './sections/TimelineSection';
import PricingSection  from './sections/PricingSection';
import CTASection      from './sections/CTASection';
import FooterSection   from './sections/FooterSection';

import logo from '../../assets/logo.jpeg';

// ── CSS Cloud Layer ──────────────────────────────────────────────
const CLOUDS = [
  // ── Background (far) — blurred & slow ────────────────────────
  { id: 1,  layer: 'bg',  top: '6%',   left: '-5%',  w: 280, spd: '110s', delay: '0s',    op: 0.6  },
  { id: 2,  layer: 'bg',  top: '30%',  left: '55%',  w: 220, spd: '120s', delay: '-40s',  op: 0.55 },
  { id: 3,  layer: 'bg',  top: '62%',  left: '10%',  w: 260, spd: '130s', delay: '-70s',  op: 0.5  },

  // ── Mid — standard depth ──────────────────────────────────────
  { id: 4,  layer: 'mid', top: '18%',  left: '68%',  w: 260, spd: '82s',  delay: '-18s',  op: 0.75 },
  { id: 5,  layer: 'mid', top: '42%',  left: '-8%',  w: 200, spd: '70s',  delay: '-32s',  op: 0.65 },
  { id: 6,  layer: 'mid', top: '55%',  left: '74%',  w: 310, spd: '85s',  delay: '-10s',  op: 0.72 },
  { id: 7,  layer: 'mid', top: '78%',  left: '48%',  w: 250, spd: '75s',  delay: '-22s',  op: 0.68 },

  // ── Foreground (near) — sharp & slightly faster ───────────────
  { id: 8,  layer: 'fg',  top: '10%',  left: '28%',  w: 170, spd: '58s',  delay: '-14s',  op: 0.82 },
  { id: 9,  layer: 'fg',  top: '48%',  left: '86%',  w: 230, spd: '60s',  delay: '-8s',   op: 0.78 },
  { id: 10, layer: 'fg',  top: '88%',  left: '4%',   w: 300, spd: '65s',  delay: '-38s',  op: 0.8  },
];

function CloudLayer() {
  return (
    <div className="sp-cloud-layer">
      {CLOUDS.map((c) => (
        <div
          key={c.id}
          className={`sp-cloud${c.layer === 'bg' ? ' sp-cloud--bg' : c.layer === 'fg' ? ' sp-cloud--fg' : ''}`}
          style={{
            top:               c.top,
            left:              c.left,
            width:             `${c.w}px`,
            opacity:           c.op,
            animationDuration: c.spd,
            animationDelay:    c.delay,
          }}
        />
      ))}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();

  // Smooth scrolling for the entire page
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="sp-landing">

      {/* ── Layer 2: CSS Cloud Layer ──────────────────────────── */}
      <CloudLayer />

      {/* ── Layer 100: Fixed Navbar ──────────────────────────── */}
      <nav className="sp-navbar">
        <div className="sp-navbar__brand">
          <img src={logo} alt="SocialPilot" className="sp-navbar__logo" />
          <span className="sp-navbar__name">SocialPilot</span>
        </div>
        <div className="sp-navbar__actions">
          <button className="sp-btn sp-btn--ghost" onClick={() => navigate('/login')}>
            Sign In
          </button>
          <button className="sp-btn sp-btn--primary" onClick={() => navigate('/register')}>
            Get Started
          </button>
        </div>
      </nav>

      {/* ── Scrollable Story ─────────────────────────────────── */}
      <HeroSection />
      <FeaturesSection />
      <PlatformsSection />
      <TimelineSection />
      <PricingSection />
      <CTASection />
      <FooterSection />

    </div>
  );
}
