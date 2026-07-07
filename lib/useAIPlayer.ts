'use client';

import { useEffect, useRef } from 'react';
import { useChessStore } from '@/store/useChessStore';
import { StockfishEngine, CandidateMove } from './stockfishEngine';

interface LowEloProfile {
  elo: number;
  multipv: number;
  maxEvalLoss: number; // centipawns limit
  weights: number[]; // % probability for top N moves
  randomDelayMin: number;
  randomDelayMax: number;
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

function selectHumanizedMove(bestMove: {from: string, to: string, promotion?: string}, candidates: CandidateMove[], profile: LowEloProfile, state: any) {
  if (candidates.length <= 1) return bestMove;
  if (state.gameStatus === 'check') return bestMove;
  
  const topCandidate = candidates[0];
  if (topCandidate.mate !== null && topCandidate.mate > 0) return bestMove;

  const phase = getGamePhase(state.fen);
  
  let effectiveMaxEvalLoss = profile.maxEvalLoss;
  if (phase === 'endgame') effectiveMaxEvalLoss *= 1.5;
  else if (phase === 'opening') effectiveMaxEvalLoss *= 0.7;

  // Blunder chance (e.g. 8% at 100, tapering down)
  let blunderChance = Math.max(0, 0.08 - ((profile.elo - 100) / 800) * 0.08);
  if (phase === 'endgame') blunderChance *= 1.5;

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
    if (lastMoves.some((m: any) => m.from === c.from && m.to === c.to)) {
      w *= 0.2; // Severely deprioritize exact repetitions
    }
    return w;
  });

  let totalWeight = activeWeights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < validCandidates.length; i++) {
    random -= activeWeights[i];
    if (random <= 0) {
      return { from: validCandidates[i].from, to: validCandidates[i].to, promotion: validCandidates[i].promotion };
    }
  }

  return bestMove;
}

/**
 * React hook that manages the AI player lifecycle.
 * When AI mode is active and it's the AI's turn, this hook:
 * 1. Initializes the Stockfish engine
 * 2. Configures it to the bot's ELO
 * 3. Requests best moves and applies them to the board
 */
export function useAIPlayer() {
  const engineRef = useRef<StockfishEngine | null>(null);
  const isInitializedRef = useRef(false);
  const pendingMoveRef = useRef(false);

  const isAI = useChessStore((s) => s.isAI);
  const aiColor = useChessStore((s) => s.aiColor);
  const aiBotElo = useChessStore((s) => s.aiBotElo);
  const fen = useChessStore((s) => s.fen);
  const turn = useChessStore((s) => s.turn);
  const gameStatus = useChessStore((s) => s.gameStatus);

  // Initialize engine when AI game starts
  useEffect(() => {
    if (!isAI || !aiBotElo) {
      // Clean up if AI mode is deactivated
      if (engineRef.current) {
        engineRef.current.terminate();
        engineRef.current = null;
        isInitializedRef.current = false;
      }
      return;
    }

    const engine = new StockfishEngine();
    engineRef.current = engine;

    // Set up the best move callback
    engine.onBestMove((bestMove, candidates) => {
      // Small guard: only apply if it's still AI's turn
      const state = useChessStore.getState();
      if (!state.isAI || state.turn !== state.aiColor) {
        pendingMoveRef.current = false;
        return;
      }

      const gameIsActive = state.gameStatus === 'active' || state.gameStatus === 'check';
      if (!gameIsActive) {
        pendingMoveRef.current = false;
        return;
      }

      // Humanized low ELO move selection
      const profile = interpolateProfile(state.aiBotElo ?? 1000);
      let selectedMove = bestMove;
      let delay = 100; // default tiny delay
      
      if (profile && candidates.length > 0) {
        selectedMove = selectHumanizedMove(bestMove, candidates, profile, state);
        
        // Reactive thinking time
        delay = profile.randomDelayMin + Math.random() * (profile.randomDelayMax - profile.randomDelayMin);
        if (candidates.length > 1) {
          const evalDiff = Math.abs(candidates[0].scoreCp - candidates[1].scoreCp);
          if (evalDiff > 300 || candidates[0].mate !== null) {
            // Obvious move -> faster
            delay *= 0.5;
          } else if (evalDiff < 50) {
            // Hard choice -> slower
            delay *= 1.5;
          }
        }
      } else {
        // High ELO: static random delay for realism
        delay = 400 + Math.random() * 500;
      }

      // Schedule the move application
      setTimeout(() => {
        // Final state check before applying
        const currentState = useChessStore.getState();
        if (!currentState.isAI || currentState.turn !== currentState.aiColor || currentState.matchResult.winner) {
          pendingMoveRef.current = false;
          return;
        }

        const from = selectedMove.from as Parameters<typeof state.movePiece>[0];
        const to = selectedMove.to as Parameters<typeof state.movePiece>[0];
        
        currentState.movePiece(from, to);
        pendingMoveRef.current = false;
      }, delay);
    });

    // Initialize and configure
    engine.init()
      .then(() => engine.setElo(aiBotElo))
      .then(() => {
        isInitializedRef.current = true;
        
        // If it's already AI's turn (shouldn't happen at start, but just in case)
        const state = useChessStore.getState();
        if (state.turn === state.aiColor && (state.gameStatus === 'active' || state.gameStatus === 'check')) {
          requestAIMove(engine, state.fen, aiBotElo);
        }
      })
      .catch((err) => {
        console.error('[useAIPlayer] Failed to initialize Stockfish:', err);
      });

    return () => {
      engine.terminate();
      engineRef.current = null;
      isInitializedRef.current = false;
      pendingMoveRef.current = false;
    };
  // Only re-run when AI mode or ELO changes (not on every fen/turn change)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAI, aiBotElo]);

  // Trigger AI move when it's AI's turn
  useEffect(() => {
    // If cleanup was triggered (e.g. by undo or reset), we clear pending move
    pendingMoveRef.current = false;
    
    if (!isAI || !aiColor || !engineRef.current || !isInitializedRef.current) {
      return;
    }

    if (turn !== aiColor) return;
    if (gameStatus !== 'active' && gameStatus !== 'check') return;

    // Use latest state to avoid stale closures
    const state = useChessStore.getState();
    const elo = state.aiBotElo ?? 1000;
    
    // We don't delay the engine.go() call anymore, the delay is applied in onBestMove
    // This allows reactive delay based on candidates.
    pendingMoveRef.current = true;
    
    // If we call requestAIMove immediately but engine isn't ready, stockfishEngine might drop it
    // Wait for next tick to ensure we don't hit race conditions with engine startup
    const timer = setTimeout(() => {
      const latestEngine = engineRef.current;
      if (!latestEngine) {
        pendingMoveRef.current = false;
        return;
      }
      
      const latestState = useChessStore.getState();
      if (!latestState.isAI || latestState.turn !== latestState.aiColor || latestState.matchResult.winner) {
        pendingMoveRef.current = false;
        return;
      }

      requestAIMove(latestEngine, latestState.fen, elo);
    }, 50);

    return () => {
      clearTimeout(timer);
      // Unmount / turn change / reset cleans up pending state
      pendingMoveRef.current = false;
    };
  }, [isAI, aiColor, turn, fen, gameStatus]);
}

function requestAIMove(engine: StockfishEngine, fen: string, elo: number): void {
  const depth = StockfishEngine.getDepthForElo(elo);
  engine.go(fen, depth);
}
