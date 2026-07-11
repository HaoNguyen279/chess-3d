import { Chess, Square, Move } from 'chess.js';
import { create } from 'zustand';
import { database } from '@/lib/firebase';
import { ref, onValue, update, Unsubscribe, get as firebaseGet, onDisconnect, remove } from 'firebase/database';

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export interface ChessPiece {
  id: string;
  type: PieceType;
  color: PieceColor;
  square: Square;
}

export type GameStatus = 'active' | 'check' | 'checkmate' | 'draw' | 'stalemate' | 'timeout';

let firebaseUnsubscribe: Unsubscribe | null = null;
let statusUnsubscribe: Unsubscribe | null = null;

interface ChessState {
  game: Chess;
  fen: string;
  turn: PieceColor;
  pieces: ChessPiece[];
  selectedSquare: Square | null;
  legalMoves: Square[];
  captureMoves: Square[];
  gameStatus: GameStatus;
  moveHistory: string[];
  capturedPieces: { white: PieceType[]; black: PieceType[] };
  isOffline: boolean;
  isAI: boolean;
  aiColor: 'w' | 'b' | null;
  aiBotId: string | null;
  aiBotElo: number | null;
  online: {
    roomId: string | null;
    myColor: 'w' | 'b' | null;
  };
  matchResult: {
    winner: 'w' | 'b' | 'draw' | null;
    reason: string | null;
  };
  isReviewing: boolean;
  isPuzzleMode: boolean;
  puzzleData: any | null;
  puzzleSolution: Move[];
  puzzleMoveIndex: number;
  puzzleState: 'loading' | 'playing' | 'wrong' | 'solved' | null;
  roomStatus: 'waiting' | 'playing' | 'disconnected' | 'finished' | null;
  playerCount: number;
  players: { white?: string; black?: string } | null;
  timeControl: string | null;
  clocks: { white: number; black: number; lastMoveTime: number } | null;
  
  selectSquare: (square: Square) => void;
  movePiece: (from: Square, to: Square, isRemote?: boolean) => boolean;
  reset: () => void;
  undo: () => void;
  connectRoom: (roomId: string, myColor: 'w' | 'b') => void;
  disconnectRoom: () => void;
  startOfflineGame: (timeControl?: string) => void;
  startAIGame: (botId: string, botElo: number) => void;
  quitToHub: () => void;
  startReview: () => void;
  startRandomPuzzle: () => Promise<void>;
  retryPuzzleMove: () => void;
  quitPuzzle: () => void;
  cameraResetTrigger: number;
  triggerCameraReset: () => void;
}

export function parseTimeControl(control: string): { time: number; increment: number } {
  const clean = control.replace(/\s+/g, '');
  if (clean.includes('|')) {
    const parts = clean.split('|');
    const timeMins = parseFloat(parts[0]);
    const incSecs = parseFloat(parts[1]);
    return {
      time: timeMins * 60 * 1000,
      increment: incSecs * 1000,
    };
  } else if (clean.includes('min')) {
    const timeMins = parseFloat(clean.replace('min', ''));
    return {
      time: timeMins * 60 * 1000,
      increment: 0,
    };
  }
  return {
    time: 10 * 60 * 1000,
    increment: 0,
  };
}

function initializePieces(game: Chess): ChessPiece[] {
  const pieces: ChessPiece[] = [];
  
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const square = `${'abcdefgh'[file]}${rank + 1}` as Square;
      const piece = game.get(square);
      
      if (piece) {
        pieces.push({
          id: `${piece.color}-${piece.type}-${square}`,
          type: piece.type,
          color: piece.color,
          square: square,
        });
      }
    }
  }
  
  return pieces;
}

const initialGame = new Chess();

export const useChessStore = create<ChessState>((set, get) => ({
  game: initialGame,
  fen: initialGame.fen(),
  turn: 'w',
  pieces: initializePieces(initialGame),
  selectedSquare: null,
  legalMoves: [],
  captureMoves: [],
  gameStatus: 'active',
  moveHistory: [],
  capturedPieces: { white: [], black: [] },
  online: {
    roomId: null,
    myColor: null,
  },
  matchResult: {
    winner: null,
    reason: null,
  },
  isReviewing: false,
  isPuzzleMode: false,
  puzzleData: null,
  puzzleSolution: [],
  puzzleMoveIndex: 0,
  puzzleState: null,
  isOffline: false,
  isAI: false,
  aiColor: null,
  aiBotId: null,
  aiBotElo: null,
  roomStatus: null,
  playerCount: 0,
  players: null,
  timeControl: null,
  clocks: null,
  cameraResetTrigger: 0,
  
  triggerCameraReset: () => set((state) => ({ cameraResetTrigger: state.cameraResetTrigger + 1 })),
  
  selectSquare: (square: Square) => {
    const { game, selectedSquare, online, isOffline, isAI, aiColor, roomStatus, matchResult, isPuzzleMode, puzzleState } = get();
    const currentTurn = game.turn();
    
    // Block selection if puzzle is in a state that doesn't allow interaction
    if (isPuzzleMode && (puzzleState === 'wrong' || puzzleState === 'solved' || puzzleState === 'loading')) {
      return;
    }
    
    // Block selection if game is over
    if (matchResult.winner) {
      return;
    }

    // Block selection during AI's turn
    if (isAI && currentTurn === aiColor) {
      return;
    }
    
    if (!isOffline && !isAI && online.roomId && roomStatus !== 'playing') {
      return;
    }
    
    if (!isOffline && !isAI && online.roomId && online.myColor !== currentTurn) {
      return;
    }
    
    if (!selectedSquare) {
      const piece = game.get(square);
      if (piece && piece.color === currentTurn) {
        const moves = game.moves({ square, verbose: true });
        const legalSquares = moves.map((m) => m.to as Square);
        const captureSquares = moves.filter((m) => m.captured).map((m) => m.to as Square);
        set({ selectedSquare: square, legalMoves: legalSquares, captureMoves: captureSquares });
      }
      return;
    }
    
    if (selectedSquare === square) {
      set({ selectedSquare: null, legalMoves: [], captureMoves: [] });
      return;
    }
    
    const moveSucceeded = get().movePiece(selectedSquare, square);
    
    if (!moveSucceeded) {
      const clickedPiece = game.get(square);
      if (clickedPiece && clickedPiece.color === currentTurn) {
        const moves = game.moves({ square, verbose: true });
        const legalSquares = moves.map((m) => m.to as Square);
        const captureSquares = moves.filter((m) => m.captured).map((m) => m.to as Square);
        set({ selectedSquare: square, legalMoves: legalSquares, captureMoves: captureSquares });
      } else {
        set({ selectedSquare: null, legalMoves: [], captureMoves: [] });
      }
    }
  },
  
  movePiece: (from: Square, to: Square, isRemote: boolean = false) => {
    const { game, pieces, capturedPieces, moveHistory, isOffline, online, roomStatus, clocks: currentClocks, timeControl } = get();
    
    if (!isRemote && !isOffline && online.roomId && roomStatus !== 'playing') {
      return false;
    }
    
    try {
      const move = game.move({ from, to, promotion: 'q' });
      
      if (move) {
        let nextPieces = [...pieces];
        
        // Compute clocks deduction and transition
        let nextClocks = currentClocks ? { ...currentClocks } : null;
        if (nextClocks && timeControl) {
          const config = parseTimeControl(timeControl);
          const isFirstMove = moveHistory.length === 0;
          const elapsed = isFirstMove ? 0 : (Date.now() - nextClocks.lastMoveTime);
          
          if (move.color === 'w') {
            nextClocks.white = Math.max(0, nextClocks.white - elapsed + config.increment);
          } else {
            nextClocks.black = Math.max(0, nextClocks.black - elapsed + config.increment);
          }
          nextClocks.lastMoveTime = Date.now();
        }
        
        // STEP 1: Remove captured piece FIRST
        if (move.captured) {
          let captureSquare: Square = to;
          if (move.flags.includes('e')) {
            // En passant: captured pawn is on same rank as attacking pawn
            const file = to[0];
            const rank = from[1];
            captureSquare = `${file}${rank}` as Square;
          }
          nextPieces = nextPieces.filter(p => p.square !== captureSquare);
        }
        
        // STEP 2: Update moving piece
        const movingPieceIndex = nextPieces.findIndex(p => p.square === from);
        if (movingPieceIndex !== -1) {
          nextPieces[movingPieceIndex] = {
            ...nextPieces[movingPieceIndex],
            square: to,
            type: move.promotion ? (move.promotion as PieceType) : nextPieces[movingPieceIndex].type,
          };
        }
        
        // STEP 3: Handle castling - move the rook
        if (move.flags.includes('k')) {
          const rank = move.color === 'w' ? '1' : '8';
          const rookFrom = `h${rank}` as Square;
          const rookTo = `f${rank}` as Square;
          const rookIndex = nextPieces.findIndex(p => p.square === rookFrom);
          if (rookIndex !== -1) {
            nextPieces[rookIndex] = { ...nextPieces[rookIndex], square: rookTo };
          }
        }
        if (move.flags.includes('q')) {
          const rank = move.color === 'w' ? '1' : '8';
          const rookFrom = `a${rank}` as Square;
          const rookTo = `d${rank}` as Square;
          const rookIndex = nextPieces.findIndex(p => p.square === rookFrom);
          if (rookIndex !== -1) {
            nextPieces[rookIndex] = { ...nextPieces[rookIndex], square: rookTo };
          }
        }
        
        const newCaptured = { ...capturedPieces };
        if (move.captured) {
          const capturedType = move.captured as PieceType;
          if (move.color === 'w') {
            newCaptured.white.push(capturedType);
          } else {
            newCaptured.black.push(capturedType);
          }
        }
        
        let status: GameStatus = 'active';
        if (game.isCheckmate()) {
          status = 'checkmate';
        } else if (game.isDraw()) {
          status = 'draw';
        } else if (game.isStalemate()) {
          status = 'stalemate';
        } else if (game.isCheck()) {
          status = 'check';
        }
        
        // Build the state update
        const stateUpdate: Partial<ChessState> = {
          pieces: nextPieces,
          fen: game.fen(),
          turn: game.turn(),
          selectedSquare: null,
          legalMoves: [],
          captureMoves: [],
          gameStatus: status,
          moveHistory: [...moveHistory, move.san],
          capturedPieces: newCaptured,
          clocks: nextClocks,
        };
        
        // Set matchResult for AI and offline modes when game ends
        const { isAI: currentIsAI, isOffline: currentIsOffline } = get();
        if ((currentIsAI || currentIsOffline) && (status === 'checkmate' || status === 'draw' || status === 'stalemate')) {
          if (status === 'checkmate') {
            stateUpdate.matchResult = { winner: move.color, reason: 'checkmate' };
          } else if (status === 'stalemate') {
            stateUpdate.matchResult = { winner: 'draw', reason: 'stalemate' };
          } else {
            stateUpdate.matchResult = { winner: 'draw', reason: 'draw' };
          }
        }
        
        // Handle Puzzle Mode Logic
        const { isPuzzleMode, puzzleSolution, puzzleMoveIndex } = get();
        if (isPuzzleMode && !isRemote) {
          const expectedMove = puzzleSolution[puzzleMoveIndex];
          if (expectedMove && move.san === expectedMove.san) {
            // Correct move
            stateUpdate.puzzleMoveIndex = puzzleMoveIndex + 1;
            if (puzzleMoveIndex + 1 >= puzzleSolution.length) {
              stateUpdate.puzzleState = 'solved';
            }
            set(stateUpdate);
            
            // Auto-play opponent's move
            if (stateUpdate.puzzleState !== 'solved') {
              setTimeout(() => {
                const { puzzleSolution: curSol, puzzleMoveIndex: curIdx, puzzleState: curState } = get();
                if (curState === 'playing') {
                  const nextMove = curSol[curIdx];
                  if (nextMove) {
                    get().movePiece(nextMove.from, nextMove.to, true);
                    // After opponent moves, increment index again
                    set((state) => ({ 
                      puzzleMoveIndex: state.puzzleMoveIndex + 1,
                      puzzleState: state.puzzleMoveIndex + 1 >= state.puzzleSolution.length ? 'solved' : 'playing'
                    }));
                  }
                }
              }, 500);
            }
            return true;
          } else {
            // Wrong move
            stateUpdate.puzzleState = 'wrong';
            set(stateUpdate);
            return false;
          }
        }
        
        set(stateUpdate);
        
        const { online, isOffline } = get();
        if (!isRemote && online.roomId && !isOffline) {
          const roomRef = ref(database, `rooms/${online.roomId}`);
          const updates: any = {
            'gameState/lastMove': {
              from,
              to,
              promotion: 'q',
              fen: game.fen(),
            }
          };
          if (nextClocks) {
            updates['clocks'] = nextClocks;
          }
          
          update(roomRef, updates).catch((error) => {
            console.error('Firebase sync error:', error);
          });
          
          if (game.isCheckmate()) {
            update(roomRef, {
              status: 'finished',
              winner: move.color,
              endReason: 'checkmate',
            });
          } else if (game.isDraw() || game.isStalemate()) {
            update(roomRef, {
              status: 'finished',
              winner: 'draw',
              endReason: game.isStalemate() ? 'stalemate' : 'draw',
            });
          }
        }
        
        return true;
      }
    } catch (_error) {
      // fail silently — chess.js throws for invalid moves, handled by caller
    }
    
    set({ selectedSquare: null, legalMoves: [], captureMoves: [] });
    return false;
  },
  
  reset: () => {
    const { timeControl } = get();
    const newGame = new Chess();
    let initialClocks = null;
    if (timeControl) {
      const config = parseTimeControl(timeControl);
      initialClocks = {
        white: config.time,
        black: config.time,
        lastMoveTime: Date.now()
      };
    }
    set({
      game: newGame,
      pieces: initializePieces(newGame),
      fen: newGame.fen(),
      turn: 'w',
      selectedSquare: null,
      legalMoves: [],
      captureMoves: [],
      gameStatus: 'active',
      moveHistory: [],
      capturedPieces: { white: [], black: [] },
      clocks: initialClocks
    });
  },
  
  undo: () => {
    const { game, moveHistory, capturedPieces } = get();
    const lastMove = game.undo();
    
    if (lastMove) {
      const newCaptured = { ...capturedPieces };
      if (lastMove.captured) {
        const capturedType = lastMove.captured as PieceType;
        if (lastMove.color === 'w') {
          newCaptured.white.pop();
        } else {
          newCaptured.black.pop();
        }
      }
      
      let status: GameStatus = 'active';
      if (game.isCheck()) {
        status = 'check';
      }
      
      set({
        pieces: initializePieces(game),
        fen: game.fen(),
        turn: game.turn(),
        selectedSquare: null,
        legalMoves: [],
        captureMoves: [],
        gameStatus: status,
        moveHistory: moveHistory.slice(0, -1),
        capturedPieces: newCaptured,
      });
    }
  },
  
  connectRoom: (roomId: string, myColor: 'w' | 'b') => {
    // CRITICAL: Reset local chess game to initial position before joining any room.
    // Without this, stale moves from a previous game remain in the chess.js instance.
    const newGame = new Chess();
    set({ 
      game: newGame,
      fen: newGame.fen(),
      turn: 'w',
      pieces: initializePieces(newGame),
      selectedSquare: null,
      legalMoves: [],
      captureMoves: [],
      gameStatus: 'active',
      moveHistory: [],
      capturedPieces: { white: [], black: [] },
      online: { roomId, myColor }, 
      matchResult: { winner: null, reason: null },
      roomStatus: 'waiting',
      playerCount: 1,
      players: myColor === 'w' ? { white: 'placeholder' } : { black: 'placeholder' }
    });
    
    // Set up disconnect listener to remove our player node if tab is closed
    const myPlayerPath = myColor === 'w' ? 'players/white' : 'players/black';
    const playerRef = ref(database, `rooms/${roomId}/${myPlayerPath}`);
    onDisconnect(playerRef).remove();
    
    const lastMoveRef = ref(database, `rooms/${roomId}/gameState/lastMove`);
    firebaseUnsubscribe = onValue(lastMoveRef, (snapshot) => {
      const lastMove = snapshot.val();
      
      // Fresh room with no moves yet — nothing to sync
      if (!lastMove) return;
      
      const { game, fen: localFen } = get();
      
      // Already in sync — skip
      if (lastMove.fen === localFen) return;
      
      // Try applying the move normally (works during live play)
      const moveSucceeded = get().movePiece(lastMove.from, lastMove.to, true);
      
      // If movePiece failed, we're desynced (F5 reconnect, or stale initial snapshot).
      // Force-load the authoritative FEN from Firebase to recover.
      if (!moveSucceeded) {
        try {
          game.load(lastMove.fen);
          
          let status: GameStatus = 'active';
          if (game.isCheckmate()) status = 'checkmate';
          else if (game.isDraw()) status = 'draw';
          else if (game.isStalemate()) status = 'stalemate';
          else if (game.isCheck()) status = 'check';
          
          set({
            fen: game.fen(),
            turn: game.turn(),
            pieces: initializePieces(game),
            gameStatus: status,
            selectedSquare: null,
            legalMoves: [],
            captureMoves: [],
          });
        } catch (e) {
          console.error('Failed to load FEN from Firebase:', e);
        }
      }
    });
    
    const roomRef = ref(database, `rooms/${roomId}`);
    statusUnsubscribe = onValue(roomRef, (snapshot) => {
      const roomData = snapshot.val();
      if (!roomData) {
        set({ roomStatus: 'disconnected' });
        return;
      }
      
      const status = roomData.status as 'waiting' | 'playing' | 'finished';
      const players = roomData.players || {};
      const playerCount = roomData.playerCount || 0;
      const dbClocks = roomData.clocks || null;
      
      // Strict client-side status resolution:
      // If db says playing but one opponent is actually missing/disconnected, pause it.
      let finalStatus: 'waiting' | 'playing' | 'disconnected' | 'finished' = status;
      if (status === 'playing' && (!players.white || !players.black)) {
        finalStatus = 'disconnected';
      }
      
      set({ 
        roomStatus: finalStatus,
        playerCount: playerCount,
        players: players,
        clocks: dbClocks,
        timeControl: roomData.timeControl || null
      });
      
      if (roomData.status === 'finished' && roomData.winner) {
        let reason = '';
        if (roomData.endReason === 'checkmate') reason = 'Chiếu hết';
        else if (roomData.endReason === 'opponent_resigned') reason = 'Đối thủ rời phòng';
        else if (roomData.endReason === 'stalemate') reason = 'Hết nước đi (Stalemate)';
        else if (roomData.endReason === 'draw') reason = 'Hòa';
        else if (roomData.endReason === 'timeout') reason = 'Hết giờ (Timeout)';
        else reason = 'Game kết thúc';
        
        set({ matchResult: { winner: roomData.winner, reason } });
      }
    });
  },
  
  disconnectRoom: () => {
    const { online } = get();
    if (online.roomId && online.myColor) {
      const roomRef = ref(database, `rooms/${online.roomId}`);
      firebaseGet(roomRef).then((snapshot) => {
        const roomData = snapshot.val();
        if (roomData) {
          const updates: any = {};
          const newPlayerCount = Math.max(0, roomData.playerCount - 1);
          updates[`playerCount`] = newPlayerCount;
          
          if (online.myColor === 'w') {
            updates[`players/white`] = null;
          } else {
            updates[`players/black`] = null;
          }
          
          if (newPlayerCount === 0) {
            // Delete room if empty
            remove(roomRef);
          } else {
            updates[`status`] = 'waiting';
            update(roomRef, updates);
          }
        }
      }).catch(err => console.error("Disconnect room error:", err));
    }

    if (firebaseUnsubscribe) {
      firebaseUnsubscribe();
      firebaseUnsubscribe = null;
    }
    if (statusUnsubscribe) {
      statusUnsubscribe();
      statusUnsubscribe = null;
    }
    set({ 
      online: { roomId: null, myColor: null }, 
      matchResult: { winner: null, reason: null },
      roomStatus: null,
      playerCount: 0,
      players: null,
      timeControl: null,
      clocks: null
    });
  },
  
  startOfflineGame: (timeControl?: string) => {
    const newGame = new Chess();
    let initialClocks = null;
    if (timeControl) {
      const config = parseTimeControl(timeControl);
      initialClocks = {
        white: config.time,
        black: config.time,
        lastMoveTime: Date.now()
      };
    }
    set({
      game: newGame,
      fen: newGame.fen(),
      turn: newGame.turn(),
      pieces: initializePieces(newGame),
      selectedSquare: null,
      legalMoves: [],
      captureMoves: [],
      gameStatus: 'active',
      moveHistory: [],
      capturedPieces: { white: [], black: [] },
      isOffline: true,
      matchResult: { winner: null, reason: null },
      roomStatus: null,
      playerCount: 0,
      players: null,
      timeControl: timeControl || null,
      clocks: initialClocks
    });
  },
  
  startAIGame: (botId: string, botElo: number) => {
    const newGame = new Chess();
    set({
      game: newGame,
      fen: newGame.fen(),
      turn: newGame.turn(),
      pieces: initializePieces(newGame),
      selectedSquare: null,
      legalMoves: [],
      captureMoves: [],
      gameStatus: 'active',
      moveHistory: [],
      capturedPieces: { white: [], black: [] },
      isOffline: false,
      isAI: true,
      aiColor: 'b',
      aiBotId: botId,
      aiBotElo: botElo,
      online: { roomId: null, myColor: 'w' },
      matchResult: { winner: null, reason: null },
      roomStatus: null,
      playerCount: 0,
      players: null,
      timeControl: null,
      clocks: null,
    });
  },
  
  quitToHub: () => {
    set({ 
      isOffline: false, 
      isAI: false,
      aiBotId: null,
      aiBotElo: null,
      aiColor: null,
      online: { roomId: null, myColor: null },
      matchResult: { winner: null, reason: null },
      isReviewing: false
    });
    get().reset();
  },

  startReview: () => {
    set({ isReviewing: true });
  },

  startRandomPuzzle: async () => {
    set({ puzzleState: 'loading', isPuzzleMode: true });
    try {
      const response = await fetch('https://api.chess.com/pub/puzzle/random');
      const data = await response.json();
      
      const tempGame = new Chess();
      tempGame.loadPgn(data.pgn);
      const solutionMoves = tempGame.history({ verbose: true });
      
      const newGame = new Chess();
      newGame.load(data.fen);
      
      set({
        game: newGame,
        fen: newGame.fen(),
        turn: newGame.turn(),
        pieces: initializePieces(newGame),
        selectedSquare: null,
        legalMoves: [],
        captureMoves: [],
        gameStatus: 'active',
        moveHistory: [],
        capturedPieces: { white: [], black: [] },
        isOffline: false,
        isAI: false,
        online: { roomId: null, myColor: null },
        matchResult: { winner: null, reason: null },
        roomStatus: null,
        
        puzzleData: data,
        puzzleSolution: solutionMoves as Move[],
        puzzleMoveIndex: 0,
        puzzleState: 'playing'
      });
      get().triggerCameraReset();
    } catch (error) {
      console.error('Failed to load puzzle:', error);
      set({ puzzleState: null, isPuzzleMode: false });
    }
  },

  retryPuzzleMove: () => {
    const { isPuzzleMode, puzzleState } = get();
    if (isPuzzleMode && puzzleState === 'wrong') {
      get().undo(); // Revert the player's incorrect move
      set({ puzzleState: 'playing' });
    }
  },

  quitPuzzle: () => {
    set({ 
      isPuzzleMode: false,
      puzzleData: null,
      puzzleSolution: [],
      puzzleMoveIndex: 0,
      puzzleState: null
    });
    get().quitToHub();
  }
}));
