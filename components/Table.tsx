'use client';

import React from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib';

type GLTFResult = GLTF & {
  nodes: {
    pCylinder6_blinn1_0: THREE.Mesh;
  };
  materials: {
    blinn1: THREE.MeshStandardMaterial;
  };
};

interface TableProps {
  position?: [number, number, number];
  scale?: number;
}

export function Table({ position = [0, 0, 0], scale = 1 }: TableProps) {
  const { nodes, materials } = useGLTF('/models/table.glb') as unknown as GLTFResult;

  return (
    <group position={position} scale={scale} dispose={null}>
      <mesh
        geometry={nodes.pCylinder6_blinn1_0.geometry}
        material={materials.blinn1}
        castShadow
        receiveShadow
      />
    </group>
  );
}

useGLTF.preload('/models/table.glb');
