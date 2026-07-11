/**
 * flightPath.js
 *
 * Keyframes for the airplane's journey across the landing page.
 * Each keyframe fires at a given scroll progress (0.0 → 1.0).
 *
 * position: [x, y, z]  — world-space offset from scene origin
 * rotation: [x, y, z]  — Euler angles in radians (pitch, yaw, roll)
 * scale:    number      — uniform scale
 *
 * ── Design principle ─────────────────────────────────────────────
 * Camera: fov 50, position z=14  →  visible half-width at z=0 ≈ 6.5 units.
 * X is kept within ±2.5 (≈12-15% margin) so the plane never clips the viewport edge at
 * BASE_SCALE = 12.  Y range ±1.8 gives good vertical drama.
 *
 * Section-by-section intent:
 *   Hero      → center-right, large, visual focus
 *   Features  → upper-left  (plane banks left, content is right-aligned)
 *   Platforms → lower-center (plane dips below content midline)
 *   Timeline  → right side   (content is right-aligned; plane is far right)
 *   Pricing   → upper-left   (plane returns left, content centred)
 *   CTA       → center       (plane approaches — largest apparent size)
 *   Footer    → exits bottom-right
 *
 * Rotation convention (Three.js Euler XYZ):
 *   rotation[0] = pitch  (+ = nose down)
 *   rotation[1] = yaw    (+ = nose left / CCW from above)
 *   rotation[2] = roll   (+ = right wing down / left bank)
 *   Banking left  → yaw +, roll −
 *   Banking right → yaw −, roll +
 */

export const FLIGHT_PATH = [
  // ── 0: Hero ──────────────────────────────────────────────────
  // Right side — open sky to the right of the centered hero text.
  {
    progress: 0.0,
    position: [1.8, 0.4, 0],
    rotation: [0.04, -0.06, 0.05],
    scale: 1.0,
  },

  // ── 0→1 transition: banking left ─────────────────────────────
  {
    progress: 0.08,
    position: [0.0, 0.6, 0],
    rotation: [0.09, 0.22, -0.18],
    scale: 1.0,
  },

  // ── 1: Features — left ───────────────────────────────────────
  // Cards live on the right; open sky is on the left.
  {
    progress: 0.17,
    position: [-1.8, 0.3, 0],
    rotation: [0.08, 0.3, -0.22],
    scale: 1.0,
  },

  // ── 1→2 transition: sweeping right ───────────────────────────
  {
    progress: 0.26,
    position: [0.3, 0.0, 0],
    rotation: [-0.03, -0.1, 0.08],
    scale: 1.0,
  },

  // ── 2: Platforms — right ─────────────────────────────────────
  // Content + icons on left; right sky is open.
  {
    progress: 0.36,
    position: [1.8, -0.2, 0],
    rotation: [-0.06, -0.1, 0.07],
    scale: 1.0,
  },

  // ── 2→3 transition: crossing to left ─────────────────────────
  {
    progress: 0.44,
    position: [-0.2, 0.1, 0],
    rotation: [-0.04, 0.18, -0.12],
    scale: 1.0,
  },

  // ── 3: Timeline — left ───────────────────────────────────────
  // Timeline steps on the right; open left sky.
  {
    progress: 0.53,
    position: [-1.8, 0.3, 0],
    rotation: [-0.05, 0.28, -0.18],
    scale: 1.0,
  },

  // ── 3→4 transition: sweeping to right and up ─────────────────
  {
    progress: 0.61,
    position: [0.6, 0.5, 0],
    rotation: [0.05, -0.15, 0.1],
    scale: 1.0,
  },

  // ── 4: Pricing — right, smaller (pushed back) ────────────────
  // Pricing cards fill the width; plane is right, smaller, farther.
  {
    progress: 0.69,
    position: [1.6, 0.5, -1.5],
    rotation: [0.08, -0.25, 0.16],
    scale: 0.8,
  },

  // ── 4→5 transition: approaching centre ───────────────────────
  {
    progress: 0.78,
    position: [0.3, 0.3, 0],
    rotation: [0.03, 0.05, -0.03],
    scale: 1.0,
  },

  // ── 5: CTA — centre, visible above the card ──────────────────
  {
    progress: 0.86,
    position: [0.0, 0.6, 0],
    rotation: [0.03, 0.0, 0.0],
    scale: 1.0,
  },

  // ── 6: Footer — exits bottom-right ───────────────────────────
  {
    progress: 1.0,
    position: [1.8, -0.6, -1.5],
    rotation: [0.1, -0.34, 0.2],
    scale: 0.7,
  },
];

/**
 * interpolateFlightPath
 *
 * Given a scroll progress value (0–1), returns the interpolated
 * { position, rotation, scale } for the plane at that point.
 * Smooth-step easing gives a more cinematic feel within each segment.
 * The function is a pure mapping: same input → same output, so reverse
 * scrolling retraces the exact same path.
 */
export function interpolateFlightPath(progress) {
  const path = FLIGHT_PATH;

  // Clamp to [0, 1]
  const p = Math.max(0, Math.min(1, progress));

  // Find the two surrounding keyframes
  let fromIdx = 0;
  for (let i = 0; i < path.length - 1; i++) {
    if (p >= path[i].progress && p <= path[i + 1].progress) {
      fromIdx = i;
      break;
    }
  }

  const from = path[fromIdx];
  const to   = path[Math.min(fromIdx + 1, path.length - 1)];

  // Normalised t within this segment
  const range = to.progress - from.progress;
  const t = range === 0 ? 0 : (p - from.progress) / range;

  // Smooth-step ease: t² (3 − 2t)
  const ease = t * t * (3 - 2 * t);

  return {
    position: from.position.map((v, i) => v + (to.position[i] - v) * ease),
    rotation: from.rotation.map((v, i) => v + (to.rotation[i] - v) * ease),
    scale:    from.scale + (to.scale - from.scale) * ease,
  };
}
