'use client';

import React, { Suspense, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useChessStore } from '@/store/useChessStore';
import { ChessBoard } from './ChessBoard';
import { Table } from './Table';
import { GrassPlane } from './GrassPlane';
import { ScatteredGrass } from './ScatteredGrass';
import { Tree } from './Tree';
import { SearsiaLucida } from './SearsiaLucida';

/* ── Table geometry constants ──
 * The table.glb mesh spans Y ≈ -0.085 → 3.212 (surface height ≈ 3.21).
 * Scaled by TABLE_SCALE the surface sits at TABLE_SURFACE_Y.
 * The chess board group is lifted to that height so pieces rest on the table.
 */
const TABLE_SCALE = 7;
const TABLE_SURFACE_Y = 3.21 * TABLE_SCALE; // ≈ 7.06

function CameraController({ controlsRef }: { controlsRef: React.RefObject<any> }) {
  const { camera } = useThree();
  const online = useChessStore((state) => state.online);
  const cameraResetTrigger = useChessStore((state) => state.cameraResetTrigger);

  useEffect(() => {
    if (controlsRef.current) {
      // By default (offline), user plays from White's perspective (Z = 10)
      // If playing online as Black, camera should be on the opposite side (Z = -10)
      const isBlack = online.myColor === 'b';
      const zPos = isBlack ? 10 : -10;

      camera.position.set(0, TABLE_SURFACE_Y + 9, zPos);
      controlsRef.current.target.set(0, TABLE_SURFACE_Y, 0);
      controlsRef.current.update();
    }
  }, [online.roomId, online.myColor, cameraResetTrigger, camera, controlsRef]);

  return null;
}

export const Scene3D = React.memo(() => {
  const controlsRef = useRef<any>(null);

  return (
    <div className="relative w-full h-screen">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, TABLE_SURFACE_Y + 6, 14], fov: 50 }}
        gl={{
          antialias: true,
          alpha: false,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
      >
        {/* Sky / atmospheric exponential fog for natural horizon blending */}
        {/* <color attach="background" args={['#ababab']} /> */}
        {/* <fogExp2 attach="fog" args={['#87ceeb', 0.02]} /> */}

        {/* HDRI: environment map for rich specular and clearcoat reflections */}
        <Environment
          files="/cowboy_town_saloon_4k.hdr"
          environmentIntensity={1}
          background={true}
          backgroundRotation={[0, Math.PI / 4, 0]}
        />

        {/* Ambient Hemisphere Light: simulates blue skylight bounce + dark green ground bounce */}
        <hemisphereLight
          color="#e0f0ff"
          groundColor="#1a2510"
          intensity={0.6}
        />

        {/* Key Light (Sun): Warm, high-intensity shadow caster */}
        <directionalLight
          castShadow
          position={[10, TABLE_SURFACE_Y + 15, 10]}
          intensity={1}
          color="#fffaee"
          shadow-mapSize={[4096, 4096]}
          shadow-camera-left={-16}
          shadow-camera-right={16}
          shadow-camera-top={16}
          shadow-camera-bottom={-16}
          shadow-camera-near={0.5}
          shadow-camera-far={50}
          shadow-bias={-0.0001}
          shadow-radius={4}
        />

        {/* Rim Light: Cool blue back-light to carve out highlights and silhouettes */}
        <directionalLight
          position={[-10, TABLE_SURFACE_Y + 8, -10]}
          intensity={1}
          color="#d0e0ff"
        />

        <CameraController controlsRef={controlsRef} />

        <Suspense fallback={null}>
          {/* Table model — positioned at the origin, board sits on top */}
          <Table position={[0, 0, 0]} scale={TABLE_SCALE} />

          {/* Chess board raised to the table surface */}
          <group position={[0, TABLE_SURFACE_Y, 0]}>
            <ChessBoard />
          </group>

          {/* Trees placed around the chessboard to cast shade */}
          {/* <Tree position={[8, 0, 3]} scale={2} rotationY={0.4} swayOffset={0} />
          <Tree position={[3, 0, 8]} scale={2.6} rotationY={2.9} swayOffset={2.1} />
          <Tree position={[-5, 0, 7]} scale={2.8} rotationY={3.5} swayOffset={4.5} /> */}

          {/* Searsia Lucida shrubs clustered around the trees and board */}
          {/* <SearsiaLucida position={[8.5, 0, 6.5]} scale={1.4} rotationY={1.0} swayOffset={0.5} />
          <SearsiaLucida position={[4.0, 0, 6.8]} scale={1.0} rotationY={2.5} swayOffset={1.8} />
          <SearsiaLucida position={[-4.0, 0, 10]} scale={1.3} rotationY={0.5} swayOffset={3.2} />
          <SearsiaLucida position={[-6.0, 0, -5.5]} scale={1.5} rotationY={4.2} swayOffset={2.5} />
          <SearsiaLucida position={[5.0, 0, -8.5]} scale={1.3} rotationY={3.1} swayOffset={1.2} /> */}
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minPolarAngle={Math.PI / 6}
          minDistance={6}
          maxDistance={25}
          target={[0, TABLE_SURFACE_Y, 0]}
        />
      </Canvas>
    </div>
  );
});

Scene3D.displayName = 'Scene3D';
