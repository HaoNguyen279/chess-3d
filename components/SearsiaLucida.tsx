'use client';

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

interface SearsiaLucidaProps {
  position: [number, number, number];
  scale?: number | [number, number, number];
  rotationY?: number;
  /** Unique seed offset so shrubs sway out of phase */
  swayOffset?: number;
}

/**
 * SearsiaLucida — Loads and renders a Searsia Lucida (shrub/bush) GLTF model.
 * Features a subtle wind sway rotation and full shadow casting/receiving.
 */
export function SearsiaLucida({
  position,
  scale = 1.5,
  rotationY = 0,
  swayOffset = 0,
}: SearsiaLucidaProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/searsia_lucida/searsia_lucida_1k.gltf');

  // Clone the scene to ensure independent instances
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Leaf / branch alpha settings
        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((material) => {
            if (material instanceof THREE.MeshStandardMaterial) {
              // Standard Three.js PBR setup
              material.roughness = Math.max(material.roughness, 0.6); // keep foliage matte
              if (material.transparent || material.alphaMap) {
                material.alphaTest = 0.4;
                material.depthWrite = true;
                material.side = THREE.DoubleSide;
              }
            }
          });
        }
      }
    });

    return clone;
  }, [scene]);

  // Subtle wind-sway animation using useFrame
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.getElapsedTime();
      // Shrub sway is slightly faster but smaller amplitude than the trees
      groupRef.current.rotation.z = Math.sin(time * 1.2 + swayOffset) * 0.012;
      groupRef.current.rotation.x = Math.cos(time * 0.9 + swayOffset * 1.5) * 0.006;
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

useGLTF.preload('/models/searsia_lucida/searsia_lucida_1k.gltf');
