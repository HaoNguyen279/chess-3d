'use client';

import React, { useMemo } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useChessStore } from '@/store/useChessStore';
import { get3DPosition, TARGET_SQUARE_SIZE, Square } from '@/lib/chess-constants';

const SQUARE_GEOMETRY = new THREE.PlaneGeometry(TARGET_SQUARE_SIZE * 0.99, TARGET_SQUARE_SIZE * 0.99);
const INVISIBLE_MATERIAL = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });

interface ChessSquareProps {
  file: number;
  rank: number;
}

export function ChessSquare({ file, rank }: ChessSquareProps) {
  const selectSquare = useChessStore((state) => state.selectSquare);
  
  const square = useMemo(() => {
    const files = 'abcdefgh';
    return `${files[file]}${rank + 1}` as Square;
  }, [file, rank]);
  
  const position = useMemo(() => get3DPosition(square), [square]);
  
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    selectSquare(square);
  };
  
  return (
    <mesh
      geometry={SQUARE_GEOMETRY}
      material={INVISIBLE_MATERIAL}
      position={position}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    />
  );
}
