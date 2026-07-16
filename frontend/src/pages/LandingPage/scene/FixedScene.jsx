/**
 * FixedScene.jsx
 *
 * Full-viewport fixed canvas that stays mounted for the entire page.
 *
 * z-index: 50 — sits ABOVE all HTML section content (z-index: 10)
 * so the plane is ALWAYS visually in front of headings and cards.
 * pointer-events: none — clicks still reach the HTML sections below.
 *
 * The canvas background is fully transparent (alpha: true).
 * Only actual 3D geometry (plane + trail) is opaque.
 * The sky gradient and CSS clouds below show through.
 */

import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import SceneLights from './SceneLights';
import PlaneModel from './PlaneModel';
import SmokeTrail from './SmokeTrail';

export default function FixedScene({ planeState }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 50,          // ABOVE sections (z:10), BELOW navbar (z:100)
        pointerEvents: 'none',
      }}
    >
      <Canvas
        camera={{
          fov: 50,              // wider FOV fits the larger plane comfortably
          near: 0.1,
          far: 300,
          position: [0, 1.5, 14], // pulled back slightly so plane never clips edges
        }}
        dpr={[1, 1.5]}          // cap DPR for mobile performance
        frameloop="always"
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <SceneLights />
        {/* Trail renders first (renderOrder 1), plane on top (renderOrder 2) */}
        <SmokeTrail planeState={planeState} />
        <PlaneModel planeState={planeState} />
        <Preload all />
      </Canvas>
    </div>
  );
}
