'use client';

import React, { useMemo, useEffect, useRef } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { animated, useSpring } from '@react-spring/three';
import * as THREE from 'three';
import { useChessStore, ChessPiece as ChessPieceType } from '@/store/useChessStore';
import { get3DPosition, PIECE_SCALE, BOARD_Y } from '@/lib/chess-constants';

const JUMP_HEIGHT = 2.0;

interface ChessPieceProps {
  piece: ChessPieceType;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
}

export function ChessPiece({ piece, geometry, material }: ChessPieceProps) {
  const selectSquare = useChessStore((state) => state.selectSquare);

  const targetPos = useMemo(() => get3DPosition(piece.square), [piece.square]);
  const prevTargetRef = useRef(targetPos);
  const fromPosRef = useRef(targetPos);
  const toPosRef = useRef(targetPos);
  const initializedRef = useRef(false);

  const [spring, api] = useSpring(() => ({
    progress: 1,
    config: { tension: 250, friction: 35 },
  }));

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      prevTargetRef.current = targetPos;
      fromPosRef.current = targetPos;
      toPosRef.current = targetPos;
      return;
    }

    if (prevTargetRef.current !== targetPos) {
      fromPosRef.current = prevTargetRef.current;
      toPosRef.current = targetPos;
      prevTargetRef.current = targetPos;
      api.set({ progress: 0 });
      api.start({ progress: 1 });
    }
  }, [targetPos, api]);

  const animatedPosition = spring.progress.to((progress) => {
    const from = fromPosRef.current;
    const to = toPosRef.current;
    return [
      from[0] + (to[0] - from[0]) * progress,
      BOARD_Y + Math.sin(progress * Math.PI) * JUMP_HEIGHT,
      from[2] + (to[2] - from[2]) * progress,
    ];
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    selectSquare(piece.square);
  };

  return (
    <animated.mesh
      geometry={geometry}
      material={material}
      position={animatedPosition as any}
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
