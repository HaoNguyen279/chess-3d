'use client';

import React, { useMemo } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { animated, useSpring } from '@react-spring/three';
import * as THREE from 'three';
import { useChessStore, ChessPiece as ChessPieceType } from '@/store/useChessStore';
import { get3DPosition, PIECE_SCALE } from '@/lib/chess-constants';

interface ChessPieceProps {
  piece: ChessPieceType;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
}

export function ChessPiece({ piece, geometry, material }: ChessPieceProps) {
  const selectedSquare = useChessStore((state) => state.selectedSquare);
  const selectSquare = useChessStore((state) => state.selectSquare);
  
  const position = useMemo(() => get3DPosition(piece.square), [piece.square]);
  
  const isSelected = selectedSquare === piece.square;
  
  const { pos, yOffset } = useSpring({
    pos: position,
    yOffset: isSelected ? 0.5 : 0,
    config: { tension: 300, friction: 30 },
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    selectSquare(piece.square);
  };

  const animatedPosition = pos.to((x, y, z) => [x, y + yOffset.get(), z]) as any;

  return (
    <animated.mesh
      geometry={geometry}
      material={material}
      position={animatedPosition}
      scale={PIECE_SCALE}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
      castShadow
      receiveShadow
    />
  );
}
