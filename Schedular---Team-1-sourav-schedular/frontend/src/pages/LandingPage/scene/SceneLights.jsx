/**
 * SceneLights.jsx
 *
 * Lighting rig for the stylized WW1 plane.
 * The model uses lambert/toon shading, so we keep it simple:
 * ambient fill + warm directional sun + subtle hemisphere.
 */

/**
 * SceneLights.jsx
 *
 * Bright daytime sky lighting rig.
 * The model uses lambert/toon shading — no shadows needed.
 * Tuned for a bright blue sky environment.
 */
export default function SceneLights() {
  return (
    <>
      {/* Strong daylight ambient — fills all surfaces evenly */}
      <ambientLight intensity={1.1} />

      {/* Main sun — high and right, crisp warm white */}
      <directionalLight
        position={[6, 12, 8]}
        intensity={1.8}
        color="#fffaf0"
      />

      {/* Sky bounce — soft blue from above */}
      <directionalLight
        position={[0, 8, -4]}
        intensity={0.5}
        color="#b8deff"
      />

      {/* Ground bounce — very subtle warm fill from below */}
      <directionalLight
        position={[-3, -4, 2]}
        intensity={0.2}
        color="#ffd6a0"
      />

      {/* Hemisphere: sky blue overhead, warm sand below */}
      <hemisphereLight
        skyColor="#87ceeb"
        groundColor="#e8d5a3"
        intensity={0.6}
      />
    </>
  );
}
