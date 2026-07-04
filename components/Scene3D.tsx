'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { ChessBoard } from './ChessBoard';

export const Scene3D = React.memo(() => {
  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [0, 10, 10], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={['#1a1a1a']} />
      
      <Environment preset="city" />
      
      <directionalLight
        castShadow
        position={[5, 10, 5]}
        intensity={1.5}
        shadow-mapSize={[2048, 2048]}
      />
      
      <ambientLight intensity={0.3} />
      
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        maxPolarAngle={Math.PI / 2.2}
        minPolarAngle={Math.PI / 6}
        minDistance={8}
        maxDistance={20}
        target={[0, 0, 0]}
      />
      
      <ChessBoard />
    </Canvas>
  );
});

Scene3D.displayName = 'Scene3D';
