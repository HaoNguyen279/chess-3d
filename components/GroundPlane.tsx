'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * GroundPlane — A vast, flat surface beneath the chessboard.
 *
 * Styled as dark polished stone / concrete to complement the premium
 * chess-set aesthetic.  Receives shadows from the directional light
 * so pieces and board cast realistic contact shadows onto it.
 */
export function GroundPlane() {
  // Slightly below Y=0 so it doesn't z-fight with the board bottom
  const Y_OFFSET = -0.02;

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#1a1f25'),   // dark slate stone
      roughness: 0.92,
      metalness: 0.05,
    });
    return mat;
  }, []);

  return (
    <mesh
      receiveShadow
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, Y_OFFSET, 0]}
      material={material}
    >
      <planeGeometry args={[200, 200]} />
    </mesh>
  );
}
