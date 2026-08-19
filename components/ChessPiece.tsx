'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { animated, useSpring } from '@react-spring/three';
import * as THREE from 'three';
import { useChessStore } from '@/store/useChessStore';
import { get3DPosition, PIECE_SCALE, BOARD_Y } from '@/lib/chess-constants';

const JUMP_HEIGHT = 2.0;

interface ChessPieceProps {
  piece: { id: string; type: string; color: string; square: string };
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
}

export function ChessPiece({ piece, geometry, material }: ChessPieceProps) {
  const selectSquare = useChessStore((state) => state.selectSquare);

  const targetPos = useMemo(() => get3DPosition(piece.square), [piece.square]);
  const fromPosRef = useRef(targetPos);
  const toPosRef = useRef(targetPos);
  const prevTargetRef = useRef(targetPos);

  const [spring, api] = useSpring(() => ({
    progress: 1,
    config: { tension: 250, friction: 35 },
  }));

  useEffect(() => {
    if (prevTargetRef.current[0] !== targetPos[0] || prevTargetRef.current[2] !== targetPos[2]) {
      fromPosRef.current = prevTargetRef.current;
      toPosRef.current = targetPos;
      prevTargetRef.current = targetPos;
      api.start({ from: { progress: 0 }, to: { progress: 1 } });
    }
  }, [targetPos, api]);

  // Accessing refs in spring animation callback is necessary for react-spring
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const animatedPosition = spring.progress.to((progress) => {
    const from = fromPosRef.current;
    const to = toPosRef.current;
    return [
      from[0] + (to[0] - from[0]) * progress,
      BOARD_Y + Math.sin(progress * Math.PI) * JUMP_HEIGHT,
      from[2] + (to[2] - from[2]) * progress,
    ] as [number, number, number];
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    selectSquare(piece.square);
  };

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
