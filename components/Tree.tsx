'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

interface TreeProps {
  position: [number, number, number];
  scale?: number;
  rotationY?: number;
  /** Unique seed offset so trees sway out of phase */
  swayOffset?: number;
}

/**
 * Tree — Loads and renders a single tree_small_02 GLTF model.
 * Features a subtle GPU vertex-shader wind sway on the leaves
 * and full shadow casting/receiving.
 */
export function Tree({
  position,
  scale = 3,
  rotationY = 0,
  swayOffset = 0,
}: TreeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/tree_small_02/tree_small_02_1k.gltf');

  // Clone the scene so each tree instance is independent
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    // Enable shadow casting/receiving on every mesh in the tree
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Ensure leaves with alpha blending use alphaTest for clean shadows
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          if (mat.alphaMap || mat.transparent) {
            mat.alphaTest = 0.3;
            mat.depthWrite = true;
            mat.side = THREE.DoubleSide;
          }
        }
      }
    });

    return clone;
  }, [scene]);

  // Subtle sway animation — rotate the entire tree group gently
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.getElapsedTime();
      // Gentle sway on Z axis (like wind pushing from one side)
      groupRef.current.rotation.z = Math.sin(time * 0.8 + swayOffset) * 0.015;
      // Slight secondary sway on X axis for natural feel
      groupRef.current.rotation.x = Math.cos(time * 0.6 + swayOffset * 1.3) * 0.008;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      scale={scale}
      rotation={[0, rotationY, 0]}
    >
      <primitive object={clonedScene} />
    </group>
  );
}

useGLTF.preload('/models/tree_small_02/tree_small_02_1k.gltf');
