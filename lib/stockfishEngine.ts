/**
 * StockfishEngine — Singleton service wrapping Stockfish WASM Web Worker
 * Communicates via UCI protocol (Universal Chess Interface).
 */

export interface CandidateMove {
  from: string;
  to: string;
  promotion?: string;
  scoreCp: number; // centipawns score
  mate: number | null; // mate in X, positive means we are mating, negative means we are being mated
  multipv: number;
}

type BestMoveCallback = (bestMove: { from: string; to: string; promotion?: string }, candidates: CandidateMove[]) => void;

export class StockfishEngine {
  private worker: Worker | null = null;
  private bestMoveCallback: BestMoveCallback | null = null;
  private isReady = false;
  private isConfiguring = false;
  private initPromise: Promise<void> | null = null;
  private currentCandidates: Map<number, CandidateMove> = new Map();

  /**
   * Initialize the Stockfish Web Worker.
   * Returns a promise that resolves when UCI handshake is complete.
   */
  init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise<void>((resolve, reject) => {
      try {
        this.worker = new Worker('/stockfish/stockfish-18-lite-single.js');

        this.worker.onmessage = (e: MessageEvent) => {
          const msg = typeof e.data === 'string' ? e.data : '';
          
          if (msg === 'uciok') {
            this.isReady = true;
            resolve();
          }

          // Parse multiPV info lines to gather candidates
          if (msg.startsWith('info') && msg.includes('multipv') && msg.includes(' pv ') && !msg.includes('lowerbound') && !msg.includes('upperbound')) {
            const multipvMatch = msg.match(/multipv (\d+)/);
            const pvMatch = msg.match(/ pv (\w+)/);
            
            if (multipvMatch && pvMatch) {
              const multipv = parseInt(multipvMatch[1], 10);
              const moveStr = pvMatch[1];
              
              let scoreCp = 0;
              let mate: number | null = null;
              
              const cpMatch = msg.match(/score cp (-?\d+)/);
              if (cpMatch) {
                scoreCp = parseInt(cpMatch[1], 10);
              }
              
              const mateMatch = msg.match(/score mate (-?\d+)/);
              if (mateMatch) {
                mate = parseInt(mateMatch[1], 10);
                // Assign an extreme cp score for sorting purposes
                scoreCp = mate > 0 ? 10000 - mate : -10000 - mate;
              }

              const parsedMove = this.parseMoveString(moveStr);
              
              this.currentCandidates.set(multipv, {
                ...parsedMove,
                scoreCp,
                mate,
                multipv
              });
            }
          }

          if (msg.startsWith('bestmove')) {
            const parts = msg.split(' ');
            const moveStr = parts[1]; // e.g. "e2e4", "e7e8q"
            if (moveStr && moveStr !== '(none)') {
              const parsed = this.parseMoveString(moveStr);
              
              // Convert Map to array and sort by multipv (1 is best)
              const candidates = Array.from(this.currentCandidates.values()).sort((a, b) => a.multipv - b.multipv);
              
              this.bestMoveCallback?.(parsed, candidates);
            }
          }
        };

        this.worker.onerror = (err) => {
          console.error('[StockfishEngine] Worker error:', err);
          reject(err);
        };

        // Start UCI handshake
        this.worker.postMessage('uci');
      } catch (err) {
        reject(err);
      }
    });

    return this.initPromise;
  }

  /**
   * Set the engine ELO strength using UCI_LimitStrength + UCI_Elo.
   * If ELO is below 1000, we also enable MultiPV=8 for humanized move selection.
   */
  async setElo(elo: number): Promise<void> {
    if (!this.worker || !this.isReady) {
      throw new Error('Engine not initialized. Call init() first.');
    }
    if (this.isConfiguring) {
      throw new Error('Engine is currently configuring ELO, please wait.');
    }
    this.isConfiguring = true;

    try {
      if (elo < 1000) {
        this.worker.postMessage('setoption name MultiPV value 8');
      } else {
        this.worker.postMessage('setoption name MultiPV value 1');
      }

      // Clamp ELO to Stockfish's supported range (1320-3190 for modern SF)
      if (elo < 1320) {
        // Map 100-1320 to Skill Level 0-10
        const skillLevel = Math.max(0, Math.min(10, Math.round((elo / 1320) * 10)));
        this.worker.postMessage(`setoption name Skill Level value ${skillLevel}`);
        this.worker.postMessage('setoption name UCI_LimitStrength value false');
      } else {
        this.worker.postMessage('setoption name UCI_LimitStrength value true');
        this.worker.postMessage(`setoption name UCI_Elo value ${Math.min(elo, 3190)}`);
      }

      this.worker.postMessage('ucinewgame');

      // Wait for readyok
      await new Promise<void>((resolve, reject) => {
        const originalHandler = this.worker!.onmessage;
        
        const timeout = setTimeout(() => {
          this.worker!.onmessage = originalHandler;
          reject(new Error('Engine readyok timeout after 5 seconds'));
        }, 5000);

        this.worker!.onmessage = (e: MessageEvent) => {
          const msg = typeof e.data === 'string' ? e.data : '';
          if (msg === 'readyok') {
            clearTimeout(timeout);
            this.worker!.onmessage = originalHandler;
            resolve();
          }
          // Still forward to original handler for bestmove etc.
          if (originalHandler && typeof originalHandler === 'function') {
            originalHandler.call(this.worker!, e);
          }
        };
        this.worker!.postMessage('isready');
      });
    } finally {
      this.isConfiguring = false;
    }
  }

  /**
   * Request the engine to find the best move for the given position.
   * The result is delivered via the onBestMove callback.
   */
  go(fen: string, depth?: number): void {
    if (!this.worker || !this.isReady) return;

    this.currentCandidates.clear();
    this.worker.postMessage(`position fen ${fen}`);
    this.worker.postMessage(`go depth ${depth ?? 10}`);
  }

  /**
   * Stop the current search.
   */
  stop(): void {
    this.worker?.postMessage('stop');
  }

  /**
   * Register a callback for when the engine finds a best move.
   */
  onBestMove(callback: BestMoveCallback): void {
    this.bestMoveCallback = callback;
  }

  /**
   * Terminate the worker and clean up resources.
   */
  terminate(): void {
    this.stop();
    this.worker?.terminate();
    this.worker = null;
    this.isReady = false;
    this.initPromise = null;
    this.bestMoveCallback = null;
    this.currentCandidates.clear();
  }

  /**
   * Parse a UCI move string like "e2e4" or "e7e8q" into components.
   */
  private parseMoveString(moveStr: string): { from: string; to: string; promotion?: string } {
    const from = moveStr.substring(0, 2);
    const to = moveStr.substring(2, 4);
    const promotion = moveStr.length > 4 ? moveStr.substring(4, 5) : undefined;
    return { from, to, promotion };
  }

  /**
   * Get recommended search depth based on ELO.
   * Lower ELO = shallower search for more natural weak play.
   */
  static getDepthForElo(elo: number): number {
    if (elo <= 300) return 2; // slightly higher depth so multipv has options to pick from
    if (elo <= 500) return 3;
    if (elo <= 800) return 4;
    if (elo <= 1100) return 6;
    if (elo <= 1500) return 8;
    if (elo <= 1900) return 11;
    if (elo <= 2200) return 13;
    return 15;
  }
}
