/**
 * PlaneModel.jsx
 *
 * Hero-only airplane animation driven by scroll.
 *
 * Progress is derived from the 200vh scroll wrapper (wrapperRef):
 *   progress 0  → hero section just entered, plane at bottom-left
 *   progress 1  → user has scrolled through the full hero pin, plane exits top-right
 *
 * worldX = (vx − 0.5) × viewport.width
 * worldY = (vy − 0.5) × viewport.height
 *
 * Start : vx 0.12, vy 0.15  (bottom-left, small)
 * End   : vx 0.88, vy 0.82  (upper-right, large, fully faded)
 *
 * Propeller animation runs continuously. Fade begins at progress 0.65.
 */

import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

const MODEL_URL = '/models/stylized_ww1_plane.glb';
const BASE_SCALE = 3.2;

useGLTF.preload(MODEL_URL);

export default function PlaneModel({ wrapperRef }) {
  const groupRef = useRef();
  const boundsRef = useRef(new THREE.Vector3(1, 1, 1));
  const { viewport } = useThree();

  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions, names } = useAnimations(animations, groupRef);

  // Play embedded propeller animation on loop
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

  // Centre model geometry; enable per-mesh transparency for the fade
  useEffect(() => {
    if (!scene) return;

    const box = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    box.getCenter(center);
    scene.position.sub(center);
    console.log(scene.position);

    // Compute and store unscaled dimensions
    const centeredBox = new THREE.Box3().setFromObject(scene);
    centeredBox.getSize(boundsRef.current);

    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.transparent = true;
        child.material.depthTest = true;
        child.material.depthWrite = true;
      }
    });
  }, [scene]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const t = clock.getElapsedTime();

    // ── Scroll progress ───────────────────────────────────────────────────
    // wrapperRef is the 200vh scroll container.
    // The hero section is sticky inside it, so as the user scrolls
    // through the extra 100vh, progress goes 0 → 1.
    let progress = 0;
    if (wrapperRef?.current) {
      const { top, height } = wrapperRef.current.getBoundingClientRect();
      const scrollRange = height - window.innerHeight; // 100vh
      if (scrollRange > 0) {
        progress = Math.max(0, Math.min(1, -top / scrollRange));
      }
    }

    // ── Position: bottom-left → upper-right ──────────────────────────────
    const startVx = 0.70;
    const startVy = 0.70;
    const endVx = 0.90;
    const endVy = 0.90;

    const vx = startVx + progress * (endVx - startVx);
    const vy = startVy + progress * (endVy - startVy);

    let worldX = (vx - 0.5) * viewport.width;
    let worldY = (vy - 0.5) * viewport.height;

    // ── Scale: starts small, exits dramatically larger ────────────────────
    const scale = (0.75 + progress * 0.45) * BASE_SCALE;
    groupRef.current.scale.setScalar(scale);

    // ── Clamping: Keep model inside viewport with 5% padding ──────────────
    // const marginX = viewport.width * 0.05;
    // const marginY = viewport.height * 0.05;

    // // Use separate radii for X and Y to avoid over-clamping.
    // // The plane is much longer/wider than it is tall.
    // const safeRadiusX = Math.max(boundsRef.current.x, boundsRef.current.z) * scale * 0.55;
    // const safeRadiusY = boundsRef.current.y * scale * 0.6; // slightly padded height

    // const minX = -viewport.width / 2 + marginX + safeRadiusX;
    // const maxX =  viewport.width / 2 - marginX - safeRadiusX;
    // const minY = -viewport.height / 2 + marginY + safeRadiusY;
    // const maxY =  viewport.height / 2 - marginY - safeRadiusY;

    // // Only apply clamping if the viewport is large enough to contain the model
    // if (maxX > minX) {
    //   worldX = Math.max(minX, Math.min(maxX, worldX));
    // }
    // if (maxY > minY) {
    //   worldY = Math.max(minY, Math.min(maxY, worldY));
    // }

    // ── Idle motion (keeps the plane alive while stationary) ─────────────
    const idleY = Math.sin(t * 0.45) * 0.05;
    const vibX = Math.sin(t * 22) * 0.003;

    groupRef.current.position.set(worldX, worldY, 0);

    console.log(groupRef.current.position);

    // ── Rotation: nose pointing upper-right throughout ────────────────────
    const idlePitch = Math.cos(t * 0.28) * 0.018;
    const idleRoll = Math.sin(t * 0.38) * 0.022;

    console.log(viewport.width, viewport.height);
    console.log(worldX, worldY);

    groupRef.current.rotation.set(
      0.22 + idlePitch,   // pitch up  (climbing)
      0.28,               // yaw right (facing right)
      -0.18 + idleRoll,   // bank into the climbing turn
    );

    // ── Opacity: solid 0→65 %, fades to transparent by 100 % ─────────────
    const opacity = progress < 0.65
      ? 1
      : Math.max(0, 1 - (progress - 0.65) / 0.35);

    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.opacity = opacity;
      }
    });
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}
