'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { ConfettiSystem } from '@/lib/ConfettiSystem';
import { useChessStore } from '@/store/useChessStore';

export const ConfettiRenderer: React.FC = () => {
  const { scene } = useThree();
  
  // Create the ConfettiSystem once and memoize it
  const confetti = useMemo(() => new ConfettiSystem(scene), [scene]);
  
  // Extract state to listen for end-game triggers
  const gameStatus = useChessStore((state) => state.gameStatus);
  const matchResult = useChessStore((state) => state.matchResult);
  const puzzleState = useChessStore((state) => state.puzzleState);

  // Use a ref to prevent multiple triggers for the same event
  const hasTriggered = useRef(false);

  useEffect(() => {
    let shouldTrigger = false;

    // Check conditions based on the requirements
    if (gameStatus === 'checkmate') {
      shouldTrigger = true;
    } else if (matchResult.winner !== null && matchResult.winner !== 'draw') {
      // Assuming we only want confetti if there's a winner, not a draw
      shouldTrigger = true;
    } else if ((puzzleState as string) === 'solved') {
      shouldTrigger = true;
    } else if (gameStatus === 'active' && (puzzleState as string) !== 'solved' && !matchResult.winner) {
      // Reset trigger if game restarts
      hasTriggered.current = false;
    }

    if (shouldTrigger && !hasTriggered.current) {
      confetti.play();
      hasTriggered.current = true;
    }
  }, [gameStatus, matchResult.winner, puzzleState, confetti]);

  // Update loop
  useFrame((_, delta) => {
    confetti.update(delta);
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      confetti.dispose();
    };
  }, [confetti]);

  return null;
};
