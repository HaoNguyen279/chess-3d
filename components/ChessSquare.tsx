'use client';

import React, { useMemo } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useChessStore } from '@/store/useChessStore';
import { get3DPosition, TARGET_SQUARE_SIZE, BOARD_Y, Square } from '@/lib/chess-constants';

const SQUARE_GEOMETRY = new THREE.PlaneGeometry(TARGET_SQUARE_SIZE * 0.95, TARGET_SQUARE_SIZE * 0.95);
const INVISIBLE_MATERIAL = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
const HIGHLIGHT_MATERIAL = new THREE.MeshBasicMaterial({
  color: '#2ecc71',
  transparent: true,
  opacity: 0.5,
  depthWrite: false,
  side: THREE.DoubleSide,
});
const CAPTURE_MATERIAL = new THREE.MeshBasicMaterial({
  color: '#e74c3c',
  transparent: true,
  opacity: 0.6,
  depthWrite: false,
  side: THREE.DoubleSide,
});
const SELECTED_MATERIAL = new THREE.MeshBasicMaterial({
  color: '#f1c40f',
  transparent: true,
  opacity: 0.6,
  depthWrite: false,
  side: THREE.DoubleSide,
});
const LAST_MOVE_MATERIAL = new THREE.MeshBasicMaterial({
  color: '#a0ffff', // light cyan
  transparent: true,
  opacity: 0.4,
  depthWrite: false,
  side: THREE.DoubleSide,
});
const CHECKMATE_WINNER_MATERIAL = new THREE.MeshBasicMaterial({
  color: '#2ecc71', // bright green
  transparent: true,
  opacity: 0.6,
  depthWrite: false,
  side: THREE.DoubleSide,
});
const CHECKMATE_LOSER_MATERIAL = new THREE.MeshBasicMaterial({
  color: '#e74c3c', // bright red
  transparent: true,
  opacity: 0.8,
  depthWrite: false,
  side: THREE.DoubleSide,
});

interface ChessSquareProps {
  file: number;
  rank: number;
  isLastMove?: boolean;
  isWinnerKing?: boolean;
  isLoserKing?: boolean;
}

export function ChessSquare({ file, rank, isLastMove, isWinnerKing, isLoserKing }: ChessSquareProps) {
  const selectSquare = useChessStore((state) => state.selectSquare);
  const selectedSquare = useChessStore((state) => state.selectedSquare);
  const legalMoves = useChessStore((state) => state.legalMoves);
  const captureMoves = useChessStore((state) => state.captureMoves);

  const square = useMemo(() => {
    const files = 'abcdefgh';
    return `${files[file]}${rank + 1}` as Square;
  }, [file, rank]);

  const position = useMemo(() => {
    const pos = get3DPosition(square);
    pos[1] = BOARD_Y + 0.005;
    return pos;
  }, [square]);

  const isSelected = square === selectedSquare;
  const isCaptureMove = captureMoves.includes(square);
  const isLegalMove = legalMoves.includes(square);

  const material = isLoserKing
    ? CHECKMATE_LOSER_MATERIAL
    : isWinnerKing
    ? CHECKMATE_WINNER_MATERIAL
    : isSelected 
    ? SELECTED_MATERIAL 
    : isCaptureMove 
    ? CAPTURE_MATERIAL 
    : isLegalMove 
    ? HIGHLIGHT_MATERIAL 
    : isLastMove
    ? LAST_MOVE_MATERIAL
    : INVISIBLE_MATERIAL;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    selectSquare(square);
  };

  return (
    <mesh
      geometry={SQUARE_GEOMETRY}
      material={material}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
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
