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
      camera={{ position: [0, 6, 8], fov: 50 }}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={['#1a1a1a']} />
      
      <Environment preset="city" />
      
      <directionalLight
        castShadow
        position={[5, 8, 5]}
        intensity={2.0}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-camera-near={0.5}
        shadow-camera-far={50}
        shadow-bias={-0.0001}
      />
      
      <ambientLight intensity={0.4} />
      
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        maxPolarAngle={Math.PI / 2 - 0.05}
        minPolarAngle={Math.PI / 6}
        minDistance={6}
        maxDistance={20}
        target={[0, 0, 0]}
      />
      
      <ChessBoard />
    </Canvas>
  );
});

Scene3D.displayName = 'Scene3D';
