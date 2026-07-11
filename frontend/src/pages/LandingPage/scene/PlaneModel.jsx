/**
 * PlaneModel.jsx
 *
 * Loads the existing GLB, plays the embedded propeller animation,
 * and applies scroll-driven + idle transforms every frame via useFrame.
 *
 * BASE_SCALE multiplies the keyframe scale so the plane becomes
 * the visual hero of the page without changing the GLB file.
 *
 * renderOrder is set on every mesh so the plane always renders
 * on top of the Three.js trail (renderOrder 1).
 */

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

const MODEL_URL = '/models/stylized_ww1_plane.glb';

// How much larger the plane is vs the keyframe scale of 1.0.
// Increase this number to make the plane bigger.
// V2: 4.5 was too small — bumped to 12 so the plane is the dominant
// visual element (~3× larger than before in viewport terms).
const BASE_SCALE = 12;

useGLTF.preload(MODEL_URL);

export default function PlaneModel({ planeState }) {
  const groupRef = useRef();

  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions, names } = useAnimations(animations, groupRef);

  // Play the embedded animation (Take 001: propeller + blur planes)
  useEffect(() => {
    names.forEach((name) => {
      const action = actions[name];
      if (action) {
        action.reset().play();
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.clampWhenFinished = false;
      }
    });
  }, [actions, names]);

  // Center the model and set renderOrder on every mesh so the plane
  // always draws on top of the smoke trail (renderOrder 1).
  useEffect(() => {
    if (!scene) return;

    const box = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    box.getCenter(center);
    scene.position.sub(center);

    scene.traverse((child) => {
      if (child.isMesh) {
        child.renderOrder = 2;
        // Keep the model's own depth writing intact
        if (child.material) {
          child.material.depthTest  = true;
          child.material.depthWrite = true;
        }
      }
    });
  }, [scene]);

  // Every frame: scroll keyframes + continuous idle animation
  useFrame(({ clock }) => {
    if (!groupRef.current || !planeState.current) return;

    const { position, rotation, scale } = planeState.current;
    const t = clock.getElapsedTime();

    // ── Idle animation (layered on top of scroll transforms) ──
    // Slow float up and down
    const idleY   = Math.sin(t * 0.45) * 0.18;
    // Gentle pitch (nose up/down)
    const idlePitch = Math.cos(t * 0.28) * 0.032;
    // Gentle roll (left/right bank)
    const idleRoll  = Math.sin(t * 0.38) * 0.042;
    // Subtle engine vibration on X
    const vibX    = Math.sin(t * 22) * 0.003;

    groupRef.current.position.set(
      (position?.[0] ?? 0) + vibX,
      (position?.[1] ?? 0) + idleY,
      (position?.[2] ?? 0),
    );
    groupRef.current.rotation.set(
      (rotation?.[0] ?? 0) + idlePitch,
      (rotation?.[1] ?? 0),
      (rotation?.[2] ?? 0) + idleRoll,
    );
    groupRef.current.scale.setScalar((scale ?? 1.0) * BASE_SCALE);
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}
