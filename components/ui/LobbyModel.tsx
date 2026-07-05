'use client';

import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Environment, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { get3DPosition, PIECE_SCALE } from '@/lib/chess-constants';

interface PieceInfo {
  type: 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
  color: 'w' | 'b';
  square: string;
}

const STARTING_PIECES: PieceInfo[] = [
  // White pieces
  { type: 'r', color: 'w', square: 'a1' },
  { type: 'n', color: 'w', square: 'b1' },
  { type: 'b', color: 'w', square: 'c1' },
  { type: 'q', color: 'w', square: 'd1' },
  { type: 'k', color: 'w', square: 'e1' },
  { type: 'b', color: 'w', square: 'f1' },
  { type: 'n', color: 'w', square: 'g1' },
  { type: 'r', color: 'w', square: 'h1' },
  ...Array.from({ length: 8 }, (_, i) => ({ type: 'p' as const, color: 'w' as const, square: `${'abcdefgh'[i]}2` })),

  // Black pieces
  { type: 'r', color: 'b', square: 'a8' },
  { type: 'n', color: 'b', square: 'b8' },
  { type: 'b', color: 'b', square: 'c8' },
  { type: 'q', color: 'b', square: 'd8' },
  { type: 'k', color: 'b', square: 'e8' },
  { type: 'b', color: 'b', square: 'f8' },
  { type: 'n', color: 'b', square: 'g8' },
  { type: 'r', color: 'b', square: 'h8' },
  ...Array.from({ length: 8 }, (_, i) => ({ type: 'p' as const, color: 'b' as const, square: `${'abcdefgh'[i]}7` })),
];

function ChessSetShowcase() {
  const { nodes, materials } = useGLTF('/models/source/chess_set_4k.gltf') as any;

  const geometries = useMemo(() => ({
    w: {
      p: nodes.piece_pawn_white_01.geometry,
      n: nodes.piece_knight_white_01.geometry,
      b: nodes.Cylinder003.geometry,
      r: nodes.piece_rook_white_01.geometry,
      q: nodes.piece_queen_white.geometry,
      k: nodes.piece_king_white.geometry,
    },
    b: {
      p: nodes.piece_pawn_black_01.geometry,
      n: nodes.piece_knight_black_01.geometry,
      b: nodes.Cylinder022.geometry,
      r: nodes.piece_rook_black_01.geometry,
      q: nodes.piece_queen_black.geometry,
      k: nodes.piece_king_black.geometry,
    },
  }), [nodes]);

  return (
    <group position={[0, -0.6, 0]}>
      {/* Chessboard mesh */}
      <mesh
        geometry={nodes.board.geometry}
        material={materials.chess_set_board}
        scale={PIECE_SCALE}
        rotation={[0, -Math.PI / 2, 0]}
        receiveShadow
        castShadow
      />
      
      {/* 3D Pieces */}
      {STARTING_PIECES.map((piece, index) => {
        const position = get3DPosition(piece.square);
        const geometry = geometries[piece.color][piece.type];
        const material = materials[`chess_set_pieces_${piece.color === 'w' ? 'white' : 'black'}`];
        return (
          <mesh
            key={`${piece.square}-${index}`}
            geometry={geometry}
            material={material}
            position={position}
            scale={PIECE_SCALE}
            castShadow
            receiveShadow
          />
        );
      })}
    </group>
  );
}

export function LobbyModel() {
  return (
    <div className="w-full h-full relative select-none">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 15, 18], fov: 42 }}
        gl={{
          antialias: true,
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
      >
        <Suspense fallback={null}>
          <Environment
            files="/poly_environment.hdr"
            environmentIntensity={0.6}
          />
          <ambientLight intensity={0.25} />
          
          <directionalLight
            castShadow
            position={[5, 10, 5]}
            intensity={1.6}
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0003}
          />
          
          <spotLight
            position={[0, 8, 0]}
            intensity={2}
            angle={Math.PI / 4}
            penumbra={0.5}
            castShadow
          />
          
          <ChessSetShowcase />
          
          <OrbitControls 
            enableDamping
            dampingFactor={0.05}
            enablePan={false}
            enableZoom={true}
            minDistance={6}
            maxDistance={20}
            maxPolarAngle={Math.PI / 2 - 0.05}
            minPolarAngle={Math.PI / 6}
            autoRotate={true}
            autoRotateSpeed={0.5} // 1/3 of previous Y-rotation speed
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

useGLTF.preload('/models/source/chess_set_4k.gltf');
