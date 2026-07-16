/**
 * SmokeTrail.jsx
 *
 * A Three.js line-based contrail that lives INSIDE the R3F canvas.
 * Because it's in the canvas, it shares the same coordinate system
 * as the plane — the trail is always perfectly aligned.
 *
 * Technique:
 *   • A fixed-length Float32Array buffer stores the last TRAIL_POINTS
 *     world positions of the plane (sampled every frame).
 *   • Vertex colors fade from white (at the plane) to the sky horizon
 *     color (at the tail) — creating a natural "fades into the sky" look
 *     without needing per-vertex transparency.
 *   • THREE TrailLines at small Y offsets give a soft, thick contrail.
 *     The offset is applied via <group position> — NOT by mutating the
 *     shared position buffer (which would cause infinite drift).
 *   • renderOrder: 1 — always drawn before the plane (renderOrder 2).
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Longer buffer = smoother, more realistic contrail
const TRAIL_POINTS = 140;

// Tail color matches the bright sky horizon so the trail "fades into sky"
const TAIL_R = 0.78;  // #C7E4F5
const TAIL_G = 0.89;
const TAIL_B = 0.96;

function buildGeometry(posBuffer, colorBuffer) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(posBuffer, 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colorBuffer, 3));
  return geo;
}

// TrailLine renders the shared position buffer as a line.
// Offset is applied by the parent <group> — do NOT mutate the buffer here.
function TrailLine({ positionsRef, colorsRef }) {
  const lineRef = useRef();

  const geo = useMemo(
    () => buildGeometry(positionsRef.current, colorsRef.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Mark both attributes as needing GPU upload every frame
  useFrame(() => {
    if (!lineRef.current) return;
    const g = lineRef.current.geometry;
    g.attributes.position.needsUpdate = true;
    g.attributes.color.needsUpdate    = true;
  });

  return (
    <line ref={lineRef} geometry={geo} renderOrder={1}>
      <lineBasicMaterial
        vertexColors
        transparent
        opacity={0.62}
        depthWrite={false}
      />
    </line>
  );
}

export default function SmokeTrail({ planeState }) {
  const positionsRef   = useRef(new Float32Array(TRAIL_POINTS * 3));
  const colorsRef      = useRef(new Float32Array(TRAIL_POINTS * 3));
  const initializedRef = useRef(false);

  // Build vertex color array once (fade from white → sky horizon)
  useEffect(() => {
    const c = colorsRef.current;
    for (let i = 0; i < TRAIL_POINTS; i++) {
      const t = i / (TRAIL_POINTS - 1); // 0 = newest, 1 = oldest
      c[i * 3 + 0] = 1.0   * (1 - t) + TAIL_R * t;
      c[i * 3 + 1] = 1.0   * (1 - t) + TAIL_G * t;
      c[i * 3 + 2] = 1.0   * (1 - t) + TAIL_B * t;
    }
  }, []);

  // Sample the plane position every frame and shift the buffer
  useFrame(() => {
    const { position } = planeState.current;
    if (!position) return;

    // On first valid position, flood the entire buffer so there's
    // no "line from origin" artifact on load.
    if (!initializedRef.current) {
      for (let i = 0; i < TRAIL_POINTS; i++) {
        positionsRef.current[i * 3 + 0] = position[0];
        positionsRef.current[i * 3 + 1] = position[1];
        positionsRef.current[i * 3 + 2] = position[2];
      }
      initializedRef.current = true;
      return;
    }

    // Shift: move every point one slot toward the tail
    const p = positionsRef.current;
    for (let i = TRAIL_POINTS - 1; i > 0; i--) {
      p[i * 3 + 0] = p[(i - 1) * 3 + 0];
      p[i * 3 + 1] = p[(i - 1) * 3 + 1];
      p[i * 3 + 2] = p[(i - 1) * 3 + 2];
    }

    // Insert newest sample at head
    p[0] = position[0];
    p[1] = position[1];
    p[2] = position[2];
  });

  return (
    <group>
      {/*
        Three offset lines give a thick, soft contrail.
        Offsets are applied via group.position — NOT by mutating positionsRef,
        which would cause cumulative drift across frames.
      */}
      <group position={[0, -0.07, 0]}>
        <TrailLine positionsRef={positionsRef} colorsRef={colorsRef} />
      </group>
      <TrailLine positionsRef={positionsRef} colorsRef={colorsRef} />
      <group position={[0, 0.07, 0]}>
        <TrailLine positionsRef={positionsRef} colorsRef={colorsRef} />
      </group>
    </group>
  );
}
