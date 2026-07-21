/**
 * HeroPlane.jsx
 *
 * R3F canvas embedded inside the Hero section's sticky container.
 * Fills the sticky 100vh section (position:absolute, inset:0).
 * wrapperRef (the 200vh scroll container) is forwarded to PlaneModel
 * so it can compute scroll progress each frame.
 */

import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import SceneLights from './SceneLights';
import PlaneModel from './PlaneModel';

export default function HeroPlane({ wrapperRef }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <Canvas
        camera={{ fov: 50, near: 0.1, far: 300, position: [0, 1.5, 14] }}
        dpr={[1, 1.5]}
        frameloop="always"
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <SceneLights />
        <PlaneModel wrapperRef={wrapperRef} />
        <Preload all />
      </Canvas>
    </div>
  );
}
