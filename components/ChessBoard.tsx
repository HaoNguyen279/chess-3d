'use client';

import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { GLTF } from 'three-stdlib';
import { useChessStore, ChessPiece as ChessPieceType } from '@/store/useChessStore';
import { ChessPiece } from './ChessPiece';
import { ChessSquare } from './ChessSquare';
import { PIECE_SCALE } from '@/lib/chess-constants';

type GLTFResult = GLTF & {
  nodes: {
    piece_rook_white_01: THREE.Mesh;
    piece_pawn_white_01: THREE.Mesh;
    Cylinder003: THREE.Mesh;
    piece_queen_white: THREE.Mesh;
    piece_king_white: THREE.Mesh;
    piece_knight_white_01: THREE.Mesh;
    board: THREE.Mesh;
    piece_rook_white_02: THREE.Mesh;
    Cylinder001: THREE.Mesh;
    piece_pawn_white_02: THREE.Mesh;
    piece_pawn_white_03: THREE.Mesh;
    piece_pawn_white_04: THREE.Mesh;
    piece_pawn_white_05: THREE.Mesh;
    piece_pawn_white_06: THREE.Mesh;
    piece_pawn_white_07: THREE.Mesh;
    piece_pawn_white_08: THREE.Mesh;
    piece_rook_black_01: THREE.Mesh;
    piece_pawn_black_01: THREE.Mesh;
    Cylinder022: THREE.Mesh;
    piece_queen_black: THREE.Mesh;
    piece_king_black: THREE.Mesh;
    piece_knight_black_01: THREE.Mesh;
    piece_knight_black_02: THREE.Mesh;
    piece_rook_black_02: THREE.Mesh;
    Cylinder025: THREE.Mesh;
    piece_pawn_black_02: THREE.Mesh;
    piece_pawn_black_03: THREE.Mesh;
    piece_pawn_black_04: THREE.Mesh;
    piece_pawn_black_05: THREE.Mesh;
    piece_pawn_black_06: THREE.Mesh;
    piece_pawn_black_07: THREE.Mesh;
    piece_pawn_black_08: THREE.Mesh;
  };
  materials: {
    chess_set_pieces_white: THREE.MeshStandardMaterial;
    chess_set_board: THREE.MeshStandardMaterial;
    chess_set_pieces_black: THREE.MeshStandardMaterial;
  };
};

export function ChessBoard() {
  const { nodes, materials } = useGLTF('/models/source/chess_set_4k.gltf') as unknown as GLTFResult;
  const pieces = useChessStore((state) => state.pieces);

  // Upgrade standard materials to physical materials to enable high-quality clearcoat lacquer reflections
  const physicalMaterials = useMemo(() => {
    if (!materials) return null;

    const whiteMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#fcfaf2'), // polished warm ivory
      map: materials.chess_set_pieces_white.map,
      normalMap: materials.chess_set_pieces_white.normalMap,
      roughnessMap: materials.chess_set_pieces_white.roughnessMap,
      roughness: 0.18,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
    });

    const blackMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#3737cc'), // rich obsidian charcoal black
      map: materials.chess_set_pieces_black.map,
      normalMap: materials.chess_set_pieces_black.normalMap,
      roughnessMap: materials.chess_set_pieces_black.roughnessMap,
      roughness: 0.14,
      metalness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
    });

    const boardMat = new THREE.MeshPhysicalMaterial({
      map: materials.chess_set_board.map,
      normalMap: materials.chess_set_board.normalMap,
      roughnessMap: materials.chess_set_board.roughnessMap,
      roughness: 0.25,
      metalness: 0.0,
      clearcoat: 0.8,
      clearcoatRoughness: 0.12,
    });

    return {
      white: whiteMat,
      black: blackMat,
      board: boardMat,
    };
  }, [materials]);

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
    <group>
      <mesh
        geometry={nodes.board.geometry}
        material={physicalMaterials ? physicalMaterials.board : materials.chess_set_board}
        scale={PIECE_SCALE}
        rotation={[0, -Math.PI / 2, 0]}
        receiveShadow
      />
      
      {Array.from({ length: 8 }, (_, rank) =>
        Array.from({ length: 8 }, (_, file) => (
          <ChessSquare key={`${file}-${rank}`} file={file} rank={rank} />
        ))
      )}
      
      {pieces.map((piece) => (
        <ChessPiece
          key={piece.id}
          piece={piece}
          geometry={geometries[piece.color][piece.type]}
          material={
            physicalMaterials
              ? piece.color === 'w'
                ? physicalMaterials.white
                : physicalMaterials.black
              : materials[`chess_set_pieces_${piece.color === 'w' ? 'white' : 'black'}`]
          }
        />
      ))}
    </group>
  );
}

useGLTF.preload('/models/source/chess_set_4k.gltf');
