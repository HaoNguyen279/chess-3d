'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

interface ScatteredGrassProps {
  count?: number;
}

/**
 * ScatteredGrass — High-performance grass instancing using InstancedMesh.
 * Creates an X-shaped crossed-plane geometry for each clump and scatters them
 * outside the chessboard's safe zone (radius > 3.0).
 * Features a high-performance GPU vertex shader sway animation.
 */
export function ScatteredGrass({ count = 2000 }: ScatteredGrassProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<any>(null);
  const depthMaterialRef = useRef<any>(null);

  // Load the high-quality plant textures present in the workspace
  // plants_0002_color_1k.jpg (color) and plants_0002_opacity_1k.jpg (transparency)
  const [colorMap, alphaMap] = useTexture([
    '/textures/plants_0002_color_1k.jpg',
    '/textures/plants_0002_opacity_1k.jpg',
  ]);

  // Create custom crossed-plane geometry (X-shape)
  const crossedGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const w = 0.9; // Width of grass blade group
    const h = 0.5; // Height of grass blade group

    // 8 vertices for two crossed planes:
    // Plane 1 (facing Z): x from -w/2 to w/2, y from 0 to h, z = 0
    // Plane 2 (facing X): x = 0, y from 0 to h, z from -w/2 to w/2
    const vertices = new Float32Array([
      // Plane 1
      -w / 2, 0, 0,
      w / 2, 0, 0,
      -w / 2, h, 0,
      w / 2, h, 0,

      // Plane 2
      0, 0, -w / 2,
      0, 0, w / 2,
      0, h, -w / 2,
      0, h, w / 2,
    ]);

    // UV coordinates
    const uvs = new Float32Array([
      // Plane 1
      0, 0,
      1, 0,
      0, 1,
      1, 1,

      // Plane 2
      0, 0,
      1, 0,
      0, 1,
      1, 1,
    ]);

    // Triangle indices
    const indices = [
      // Plane 1
      0, 1, 2,
      2, 1, 3,
      // Plane 2
      4, 5, 6,
      6, 5, 7,
    ];

    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }, []);

  // Position instances on initialization
  useEffect(() => {
    if (!meshRef.current) return;

    const tempObject = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      let x = 0;
      let z = 0;
      let distance = 0;

      // Scatter between radius 3.0 (safe zone) and 15.0
      do {
        const angle = Math.random() * Math.PI * 2;
        const radius = 3.0 + Math.random() * 12.0;
        x = Math.cos(angle) * radius;
        z = Math.sin(angle) * radius;
        distance = Math.sqrt(x * x + z * z);
      } while (distance < 3.0);

      // Match GrassPlane Y level exactly to sit perfectly flat on the bottom plane
      const y = -0.15;

      // Tight height/width variation (0.9x to 1.1x) to keep them visually uniform on the plane
      const scaleX = 0.9 + Math.random() * 0.2;
      const scaleY = 0.9 + Math.random() * 0.2;
      const scaleZ = scaleX;

      // Random Y-rotation
      const rotationY = Math.random() * Math.PI * 2;

      tempObject.position.set(x, y, z);
      tempObject.rotation.set(0, rotationY, 0);
      tempObject.scale.set(scaleX, scaleY, scaleZ);
      tempObject.updateMatrix();

      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  // Create custom shader material to sway grass on GPU
  const customMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      map: colorMap,
      alphaMap: alphaMap,
      transparent: true,
      depthWrite: true,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
      roughness: 0.9,
      metalness: 0.1,
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };

      shader.vertexShader = `
        uniform float uTime;
      ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
          #include <begin_vertex>
          // Sway amount based on time and local X/Z positions
          // Multiplying by uv.y keeps the root of the grass (uv.y = 0) perfectly stationary on the ground
          float sway = sin(uTime * 1.8 + position.x * 4.0 + position.z * 4.0) * 0.05 * uv.y;
          transformed.x += sway;
          transformed.z += sway * 0.5;
        `
      );

      materialRef.current = shader;
    };

    return mat;
  }, [colorMap, alphaMap]);

  // Create custom depth material to cast correct transparent shadows that match the swaying
  const customDepthMaterial = useMemo(() => {
    const mat = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      map: colorMap,
      alphaMap: alphaMap,
      alphaTest: 0.5,
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 };

      shader.vertexShader = `
        uniform float uTime;
      ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
          #include <begin_vertex>
          float sway = sin(uTime * 1.8 + position.x * 4.0 + position.z * 4.0) * 0.05 * uv.y;
          transformed.x += sway;
          transformed.z += sway * 0.5;
        `
      );

      depthMaterialRef.current = shader;
    };

    return mat;
  }, [colorMap, alphaMap]);

  // Animate the uTime uniform on every frame for both standard and depth materials
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time;
    }
    if (depthMaterialRef.current) {
      depthMaterialRef.current.uniforms.uTime.value = time;
    }
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[crossedGeometry, null as any, count]}
      castShadow
      receiveShadow
      material={customMaterial}
      customDepthMaterial={customDepthMaterial}
    />
  );
}

// Preload textures
useTexture.preload('/textures/plants_0002_color_1k.jpg');
useTexture.preload('/textures/plants_0002_opacity_1k.jpg');
