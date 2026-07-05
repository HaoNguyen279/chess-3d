'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { ChessBoard } from './ChessBoard';
import { GrassPlane } from './GrassPlane';
import { ScatteredGrass } from './ScatteredGrass';
import { Tree } from './Tree';
import { SearsiaLucida } from './SearsiaLucida';

export const Scene3D = React.memo(() => {
  return (
    <div className="relative w-full h-screen">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 5, 7], fov: 50 }}
        gl={{
          antialias: true,
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
      >
        {/* Sky / atmospheric exponential fog for natural horizon blending */}
        <color attach="background" args={['#87ceeb']} />
        <fogExp2 attach="fog" args={['#87ceeb', 0.02]} />

        {/* HDRI: environment map for rich specular and clearcoat reflections */}
        {/* <Environment
          files="/poly_environment.hdr"
          environmentIntensity={0.5}
        /> */}

        {/* Ambient Hemisphere Light: simulates blue skylight bounce + dark green ground bounce */}
        <hemisphereLight
          color="#e0f0ff"
          groundColor="#1a2510"
          intensity={0.6}
        />

        {/* Key Light (Sun): Warm, high-intensity shadow caster */}
        <directionalLight
          castShadow
          position={[10, 15, 10]}
          intensity={2.5}
          color="#fffaee"
          shadow-mapSize={[4096, 4096]}
          shadow-camera-left={-16}
          shadow-camera-right={16}
          shadow-camera-top={16}
          shadow-camera-bottom={-16}
          shadow-camera-near={0.5}
          shadow-camera-far={40}
          shadow-bias={-0.0001}
          shadow-radius={4}
        />

        {/* Rim Light: Cool blue back-light to carve out highlights and silhouettes */}
        <directionalLight
          position={[-10, 8, -10]}
          intensity={1.0}
          color="#d0e0ff"
        />

        <Suspense fallback={null}>
          <GrassPlane />
          <ScatteredGrass />
          <ChessBoard />

          {/* Trees placed around the chessboard to cast shade */}
          <Tree position={[8, 0, 3]} scale={2} rotationY={0.4} swayOffset={0} />
          <Tree position={[3, 0, 8]} scale={2.6} rotationY={2.9} swayOffset={2.1} />
          <Tree position={[-5, 0, 7]} scale={2.8} rotationY={3.5} swayOffset={4.5} />

          {/* Searsia Lucida shrubs clustered around the trees and board */}
          <SearsiaLucida position={[8.5, 0, 6.5]} scale={1.4} rotationY={1.0} swayOffset={0.5} />
          <SearsiaLucida position={[4.0, 0, 6.8]} scale={1.0} rotationY={2.5} swayOffset={1.8} />
          <SearsiaLucida position={[-4.0, 0, 10]} scale={1.3} rotationY={0.5} swayOffset={3.2} />
          <SearsiaLucida position={[-6.0, 0, -5.5]} scale={1.5} rotationY={4.2} swayOffset={2.5} />
          <SearsiaLucida position={[5.0, 0, -8.5]} scale={1.3} rotationY={3.1} swayOffset={1.2} />
        </Suspense>

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minPolarAngle={Math.PI / 6}
          minDistance={6}
          maxDistance={20}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
});

Scene3D.displayName = 'Scene3D';
