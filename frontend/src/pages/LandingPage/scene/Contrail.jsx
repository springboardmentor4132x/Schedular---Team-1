/**
 * Contrail.jsx
 *
 * A fixed SVG contrail that follows the plane's position across the page.
 * Version 1: simple curved white line that renders as a smooth polyline
 * tracking the plane's historical screen positions.
 *
 * We store the last N positions of the plane (in viewport %) and
 * render them as a smooth SVG path with a fading gradient.
 */

import { useEffect, useRef, useState } from 'react';

const TRAIL_LENGTH = 48;   // number of historical points kept
const SAMPLE_INTERVAL = 60; // ms between position samples

/**
 * Convert the plane's 3D world position to approximate screen %
 * using a simplified projection matching the camera setup:
 *   camera fov=45, position=[0,2,14], looking at origin
 *
 * This is a rough approximation good enough for V1.
 */
function worldToScreen(pos, scale) {
  // Camera is at z=14, looking at z=0
  // Simplified perspective: divide by (z_cam - z_obj)
  const zCam = 14;
  const zObj = pos[2] || 0;
  const depth = zCam - zObj;
  const fovFactor = Math.tan((45 / 2) * (Math.PI / 180));

  const sx = 50 + ((pos[0] / (depth * fovFactor)) * 50);
  // Camera Y offset is 2 units up, so subtract 2 from worldY before projecting
  const sy = 50 - (((pos[1] - 2) / (depth * fovFactor * 0.5625)) * 50);

  return { x: Math.max(0, Math.min(100, sx)), y: Math.max(0, Math.min(100, sy)) };
}

export default function Contrail({ planeState }) {
  const [points, setPoints] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (!planeState.current) return;
      const { position, scale } = planeState.current;
      if (!position) return;

      const pt = worldToScreen(position, scale);

      setPoints((prev) => {
        const next = [...prev, pt];
        return next.slice(-TRAIL_LENGTH);
      });
    }, SAMPLE_INTERVAL);

    return () => clearInterval(intervalRef.current);
  }, [planeState]);

  if (points.length < 2) return null;

  // Build a smooth SVG path from the points
  const d = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = points[i - 1];
    // Quadratic bezier control point midway
    const cx = (prev.x + pt.x) / 2;
    const cy = (prev.y + pt.y) / 2;
    return `${acc} Q ${prev.x} ${prev.y} ${cx} ${cy}`;
  }, '');

  const gradientId = 'contrail-gradient';

  return (
    <svg
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 1,
        pointerEvents: 'none',
        overflow: 'visible',
      }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%"
          gradientUnits="userSpaceOnUse"
          x1={points[0]?.x} y1={points[0]?.y}
          x2={points[points.length - 1]?.x} y2={points[points.length - 1]?.y}
        >
          <stop offset="0%"   stopColor="white" stopOpacity="0" />
          <stop offset="60%"  stopColor="white" stopOpacity="0.35" />
          <stop offset="100%" stopColor="white" stopOpacity="0.7" />
        </linearGradient>
      </defs>

      <path
        d={d}
        stroke={`url(#${gradientId})`}
        strokeWidth="0.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
