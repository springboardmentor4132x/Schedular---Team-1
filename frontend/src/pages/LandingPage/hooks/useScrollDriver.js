/**
 * useScrollDriver.js
 *
 * Sets up Lenis smooth scroll + GSAP ScrollTrigger.
 * On every scroll tick, interpolates the flight path and writes
 * the result directly into planeState.current — no React re-renders.
 *
 * Also tracks a screenProgress ref for contrail/section use.
 */

import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { interpolateFlightPath } from '../data/flightPath';

gsap.registerPlugin(ScrollTrigger);

/**
 * @param {React.MutableRefObject} planeState
 *   Shared ref: { position, rotation, scale, progress }
 *   Written here, read inside R3F useFrame.
 */
export function useScrollDriver(planeState) {
  useEffect(() => {
    // ── 1. Lenis smooth scroll ────────────────────────────────
    const lenis = new Lenis({
      lerp: 0.08,          // inertia factor — lower = smoother but slower
      smoothWheel: true,
    });

    // Connect Lenis RAF to GSAP ticker so ScrollTrigger stays in sync
    lenis.on('scroll', ScrollTrigger.update);

    const gsapTicker = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(gsapTicker);
    gsap.ticker.lagSmoothing(0);

    // ── 2. ScrollTrigger ──────────────────────────────────────
    const trigger = ScrollTrigger.create({
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        const kf = interpolateFlightPath(self.progress);
        planeState.current.position = kf.position;
        planeState.current.rotation = kf.rotation;
        planeState.current.scale    = kf.scale;
        planeState.current.progress = self.progress;
      },
    });

    // ── 3. Seed initial state so plane appears on first paint ─
    const initial = interpolateFlightPath(0);
    planeState.current.position = initial.position;
    planeState.current.rotation = initial.rotation;
    planeState.current.scale    = initial.scale;
    planeState.current.progress = 0;

    return () => {
      trigger.kill();
      gsap.ticker.remove(gsapTicker);
      lenis.destroy();
    };
  }, [planeState]);
}
