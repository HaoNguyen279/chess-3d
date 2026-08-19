'use client';

import { useEffect, useRef } from 'react';
import { useChessStore } from '@/store/useChessStore';
import { StockfishEngine, CandidateMove } from './stockfishEngine';
import { Square } from 'chess.js';

interface LowEloProfile {
  elo: number;
  multipv: number;
  maxEvalLoss: number;
  weights: number[];
  randomDelayMin: number;
  randomDelayMax: number;
}

interface GameStateSnapshot {
  isAI: boolean;
  turn: 'w' | 'b';
  aiColor: 'w' | 'b' | null;
  aiBotElo: number | null;
  gameStatus: string;
  fen: string;
  moveHistory: string[];
  matchResult: { winner: 'w' | 'b' | 'draw' | null };
  movePiece: (from: Square, to: Square) => boolean;
}

const LOW_ELO_PROFILES: LowEloProfile[] = [
  { elo: 100, multipv: 8, maxEvalLoss: 400, weights: [20, 20, 20, 20, 20], randomDelayMin: 300, randomDelayMax: 700 },
  { elo: 300, multipv: 8, maxEvalLoss: 300, weights: [40, 25, 15, 10, 10], randomDelayMin: 400, randomDelayMax: 900 },
  { elo: 500, multipv: 8, maxEvalLoss: 250, weights: [55, 20, 10, 10, 5], randomDelayMin: 500, randomDelayMax: 1200 },
  { elo: 700, multipv: 8, maxEvalLoss: 200, weights: [70, 15, 8, 5, 2], randomDelayMin: 600, randomDelayMax: 1400 },
  { elo: 900, multipv: 8, maxEvalLoss: 150, weights: [85, 8, 4, 2, 1], randomDelayMin: 700, randomDelayMax: 1500 },
];

function interpolateProfile(elo: number): LowEloProfile | null {
  if (elo >= 1000) return null;
  
  if (elo <= LOW_ELO_PROFILES[0].elo) return LOW_ELO_PROFILES[0];
  if (elo >= LOW_ELO_PROFILES[LOW_ELO_PROFILES.length - 1].elo) return LOW_ELO_PROFILES[LOW_ELO_PROFILES.length - 1];

  let p1 = LOW_ELO_PROFILES[0];
  let p2 = LOW_ELO_PROFILES[1];
  for (let i = 0; i < LOW_ELO_PROFILES.length - 1; i++) {
    if (elo >= LOW_ELO_PROFILES[i].elo && elo <= LOW_ELO_PROFILES[i + 1].elo) {
      p1 = LOW_ELO_PROFILES[i];
      p2 = LOW_ELO_PROFILES[i + 1];
      break;
    }
  }

  const t = (elo - p1.elo) / (p2.elo - p1.elo);
  const lerp = (a: number, b: number) => a + (b - a) * t;
  
  const maxLen = Math.max(p1.weights.length, p2.weights.length);
  const weights = [];
  for (let i = 0; i < maxLen; i++) {
    const w1 = p1.weights[i] || 0;
    const w2 = p2.weights[i] || 0;
    weights.push(lerp(w1, w2));
  }

  return {
    elo,
    multipv: 8,
    maxEvalLoss: lerp(p1.maxEvalLoss, p2.maxEvalLoss),
    randomDelayMin: lerp(p1.randomDelayMin, p2.randomDelayMin),
    randomDelayMax: lerp(p1.randomDelayMax, p2.randomDelayMax),
    weights
  };
}

function getGamePhase(fen: string): 'opening' | 'middlegame' | 'endgame' {
  const board = fen.split(' ')[0];
  let pieceCount = 0;
  for (let i = 0; i < board.length; i++) {
    const c = board[i];
    if (c !== '/' && isNaN(parseInt(c, 10))) {
      pieceCount++;
    }
  }
  if (pieceCount <= 12) return 'endgame';
  
  const parts = fen.split(' ');
  const fullMoves = parseInt(parts[5], 10) || 1;
  if (fullMoves <= 10 && pieceCount >= 28) return 'opening';

  return 'middlegame';
}

function selectHumanizedMove(
  bestMove: { from: string; to: string; promotion?: string },
  candidates: CandidateMove[],
  profile: LowEloProfile,
  state: GameStateSnapshot
): { from: string; to: string; promotion?: string } {
  if (candidates.length <= 1) return bestMove;
  if (state.gameStatus === 'check') return bestMove;
  
  const topCandidate = candidates[0];
  if (topCandidate.mate !== null && topCandidate.mate > 0) return bestMove;

  const phase = getGamePhase(state.fen);
  
  let effectiveMaxEvalLoss = profile.maxEvalLoss;
  if (phase === 'endgame') effectiveMaxEvalLoss *= 1.5;
  else if (phase === 'opening') effectiveMaxEvalLoss *= 0.7;

  const blunderChance = Math.max(0, 0.08 - ((profile.elo - 100) / 800) * 0.08) * (phase === 'endgame' ? 1.5 : 1);

  if (Math.random() < blunderChance) {
    const nonMateCandidates = candidates.filter(c => !(c.mate !== null && c.mate < 0));
    if (nonMateCandidates.length > 1) {
      const worst = nonMateCandidates[nonMateCandidates.length - 1];
      return { from: worst.from, to: worst.to, promotion: worst.promotion };
    }
  }

  let validCandidates = candidates.filter(c => {
    if (c.multipv === 1) return true;
    if (c.mate !== null && c.mate < 0 && (topCandidate.mate === null || topCandidate.mate > 0)) {
      return false;
    }
    if (topCandidate.mate === null && c.mate === null) {
      const evalLoss = topCandidate.scoreCp - c.scoreCp;
      if (evalLoss > effectiveMaxEvalLoss) return false;
    }
    return true;
  });

  validCandidates = validCandidates.slice(0, profile.weights.length);
  if (validCandidates.length === 1) return bestMove;

  const lastMoves = state.moveHistory.slice(-4);
  const activeWeights = validCandidates.map((c, i) => {
    let w = profile.weights[i] || 0;
    if (lastMoves.some((m) => m === `${c.from}${c.to}`)) {
      w *= 0.2;
    }
    return w;
  });

  const totalWeight = activeWeights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < validCandidates.length; i++) {
    random -= activeWeights[i];
    if (random <= 0) {
      return { from: validCandidates[i].from, to: validCandidates[i].to, promotion: validCandidates[i].promotion };
    }
  }

  return bestMove;
}

type AILifecycleState = 'idle' | 'initializing' | 'ready' | 'thinking' | 'error';

/**
 * React hook that manages the AI player lifecycle.
 * Uses a state-machine approach (idle → initializing → ready → thinking → ready)
 * to prevent race conditions between engine init and move requests.
 */
export function useAIPlayer() {
  const engineRef = useRef<StockfishEngine | null>(null);
  const lifecycleRef = useRef<AILifecycleState>('idle');
  const moveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAI = useChessStore((s) => s.isAI);
  const aiColor = useChessStore((s) => s.aiColor);
  const aiBotElo = useChessStore((s) => s.aiBotElo);
  const fen = useChessStore((s) => s.fen);
  const turn = useChessStore((s) => s.turn);
  const gameStatus = useChessStore((s) => s.gameStatus);

  function clearPendingMove() {
    if (moveTimerRef.current) {
      clearTimeout(moveTimerRef.current);
      moveTimerRef.current = null;
    }
  }

  // Initialize engine when AI game starts
  useEffect(() => {
    if (!isAI || !aiBotElo) {
      clearPendingMove();
      if (engineRef.current) {
        engineRef.current.terminate();
        engineRef.current = null;
      }
      lifecycleRef.current = 'idle';
      return;
    }

    // Avoid double-init when ELO changes mid-session
    if (lifecycleRef.current !== 'idle') return;

    lifecycleRef.current = 'initializing';
    const engine = new StockfishEngine();
    engineRef.current = engine;

    engine.onBestMove((bestMove, candidates) => {
      if (lifecycleRef.current !== 'thinking') return;

      const state = useChessStore.getState() as GameStateSnapshot;
      if (!state.isAI || state.turn !== state.aiColor || state.matchResult.winner) {
        lifecycleRef.current = 'ready';
        return;
      }

      const gameIsActive = state.gameStatus === 'active' || state.gameStatus === 'check';
      if (!gameIsActive) {
        lifecycleRef.current = 'ready';
        return;
      }

      const profile = interpolateProfile(state.aiBotElo ?? 1000);
      let selectedMove = bestMove;
      let delay = 100;
      
      if (profile && candidates.length > 0) {
        selectedMove = selectHumanizedMove(bestMove, candidates, profile, state);
        delay = profile.randomDelayMin + Math.random() * (profile.randomDelayMax - profile.randomDelayMin);
        if (candidates.length > 1) {
          const evalDiff = Math.abs(candidates[0].scoreCp - candidates[1].scoreCp);
          if (evalDiff > 300 || candidates[0].mate !== null) {
            delay *= 0.5;
          } else if (evalDiff < 50) {
            delay *= 1.5;
          }
        }
      } else {
        delay = 400 + Math.random() * 500;
      }

      moveTimerRef.current = setTimeout(() => {
        moveTimerRef.current = null;
        const currentState = useChessStore.getState() as GameStateSnapshot;
        if (!currentState.isAI || currentState.turn !== currentState.aiColor || currentState.matchResult.winner) {
          lifecycleRef.current = 'ready';
          return;
        }
        currentState.movePiece(selectedMove.from as Square, selectedMove.to as Square);
        lifecycleRef.current = 'ready';
      }, delay);
    });

    engine.init()
      .then(() => engine.setElo(aiBotElo))
      .then(() => {
        if (engineRef.current !== engine) return; // stale, already replaced
        lifecycleRef.current = 'ready';
        
        const state = useChessStore.getState() as GameStateSnapshot;
        if (state.turn === state.aiColor && (state.gameStatus === 'active' || state.gameStatus === 'check')) {
          lifecycleRef.current = 'thinking';
          engine.go(state.fen, StockfishEngine.getDepthForElo(aiBotElo));
        }
      })
      .catch((err) => {
        console.error('[useAIPlayer] Failed to initialize Stockfish:', err);
        lifecycleRef.current = 'error';
      });

    return () => {
      clearPendingMove();
      engine.terminate();
      if (engineRef.current === engine) {
        engineRef.current = null;
      }
      lifecycleRef.current = 'idle';
    };
  }, [isAI, aiBotElo]);

  // Trigger AI move when it's AI's turn
  useEffect(() => {
    if (!isAI || !aiColor) return;
    if (turn !== aiColor) return;
    if (gameStatus !== 'active' && gameStatus !== 'check') return;

    // Only dispatch a new move if engine is ready and not already thinking
    if (lifecycleRef.current !== 'ready') return;
    if (!engineRef.current) return;

    const engine = engineRef.current;

    // Small debounce to handle React StrictMode double-fire
    const timer = setTimeout(() => {
      const state = useChessStore.getState() as GameStateSnapshot;
      if (!state.isAI || state.turn !== state.aiColor || state.matchResult.winner) return;
      if (lifecycleRef.current !== 'ready') return;

      lifecycleRef.current = 'thinking';
      engine.go(state.fen, StockfishEngine.getDepthForElo(state.aiBotElo ?? 1000));
    }, 50);

    return () => {
      clearTimeout(timer);
      // If we cancel before the timer fires, stay in ready state
      if (lifecycleRef.current === 'thinking') {
        clearPendingMove();
        lifecycleRef.current = 'ready';
      }
    };
  }, [isAI, aiColor, turn, fen, gameStatus]);
}
