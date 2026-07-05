'use client';

import React, { useEffect } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

/**
 * GrassPlane — A vast 3D ground plane with realistic textured details.
 * It uses the high-resolution concrete texture maps present in the project,
 * but tints them green to simulate a premium grass turf/lawn texture.
 */
export function GrassPlane() {
  // Load textures using useTexture from @react-three/drei
  const [colorMap, normalMap, roughnessMap] = useTexture([
    '/textures/Grass007_1K-JPG_Color.jpg',
    '/textures/Grass007_1K-JPG_NormalGL.jpg',
    '/textures/Grass007_1K-JPG_Roughness.jpg',
  ]);

  // Set up texture repeating for a dense, high-frequency grass look
  useEffect(() => {
    [colorMap, normalMap, roughnessMap].forEach((texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      // High repeat count to make the concrete grain scale down into grass-like texture
      texture.repeat.set(50, 50);
      texture.needsUpdate = true;
    });
  }, [colorMap, normalMap, roughnessMap]);

  return (
    <mesh
      receiveShadow
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.02, 0]}
    >
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial
        map={colorMap}
        normalMap={normalMap}
        roughnessMap={roughnessMap}
        color="#49ce40" // Organic deep turf green tint
        roughness={1.0} // Manicured grass is completely matte
        metalness={0.0}
      />
    </mesh>
  );
}
