'use client';

import { useEffect, useRef } from 'react';
import { useChessStore } from '@/store/useChessStore';

export function useChessSounds() {
  const audioRefs = useRef<{
    move: HTMLAudioElement | null;
    capture: HTMLAudioElement | null;
    check: HTMLAudioElement | null;
    gameEnd: HTMLAudioElement | null;
  }>({
    move: null,
    capture: null,
    check: null,
    gameEnd: null,
  });

  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // Initialize Audio elements only on the client side (safeguards against SSR errors)
    if (typeof window !== 'undefined') {
      audioRefs.current = {
        move: new Audio('/sounds/move-self.mp3'),
        capture: new Audio('/sounds/capture.mp3'),
        check: new Audio('/sounds/move-check.mp3'),
        gameEnd: new Audio('/sounds/game-end.mp3'),
      };

      // Preload the audio files for zero-latency playback
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) {
          audio.preload = 'auto';
        }
      });
    }

    return () => {
      // Clear any pending sound delays on unmount
      timeoutsRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  /**
   * Plays a specific sound after a delay. Uses cloneNode to support polyphony
   * (overlapping sounds without cutting each other off).
   */
  const playSound = (type: 'move' | 'capture' | 'check' | 'gameEnd', delayMs = 300) => {
    const original = audioRefs.current[type];
    if (!original) return;

    const timeoutId = setTimeout(() => {
      try {
        // Clone the node to allow overlapping playback of the same sound
        const clone = original.cloneNode(true) as HTMLAudioElement;
        clone.volume = 1.0;
        clone.play().catch((err) => {
          // Modern browsers block autoplay until the user interacts with the page
          console.warn(`[useChessSounds] Playback blocked or failed for "${type}":`, err);
        });
      } catch (err) {
        console.error(`[useChessSounds] Error playing sound "${type}":`, err);
      }

      // Clean up the timeout ref once fired
      timeoutsRef.current = timeoutsRef.current.filter(t => t !== timeoutId);
    }, delayMs);

    timeoutsRef.current.push(timeoutId);
  };

  const playMove = (delay = 300) => playSound('move', delay);
  const playCapture = (delay = 300) => playSound('capture', delay);
  const playCheck = (delay = 300) => playSound('check', delay);
  const playGameEnd = (delay = 300) => playSound('gameEnd', delay);

  // --- AUTOMATIC INTEGRATION (RECOMMENDED) ---
  // Subscribes to store updates and plays the correct sound automatically
  const moveHistoryLength = useChessStore((state) => state.moveHistory.length);
  const gameStatus = useChessStore((state) => state.gameStatus);
  const game = useChessStore((state) => state.game);
  const prevLengthRef = useRef(moveHistoryLength);

  useEffect(() => {
    // Only play sound if a move was actually added (not on undo or reset)
    if (moveHistoryLength > prevLengthRef.current) {
      const history = game.history({ verbose: true });
      const lastMove = history[history.length - 1];

      if (lastMove) {
        if (
          gameStatus === 'checkmate' ||
          gameStatus === 'draw' ||
          gameStatus === 'stalemate'
        ) {
          playGameEnd();
        } else if (gameStatus === 'check') {
          playCheck();
        } else if (lastMove.captured) {
          playCapture();
        } else {
          playMove();
        }
      }
    }
    prevLengthRef.current = moveHistoryLength;
  }, [moveHistoryLength, gameStatus, game]);

  return {
    playMove,
    playCapture,
    playCheck,
    playGameEnd,
  };
}
