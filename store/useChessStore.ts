import { Chess, Square, Move } from 'chess.js';
import { create } from 'zustand';
import { database } from '@/lib/firebase';
import { ref, onValue, update, Unsubscribe } from 'firebase/database';

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export interface ChessPiece {
  id: string;
  type: PieceType;
  color: PieceColor;
  square: Square;
}

export type GameStatus = 'active' | 'check' | 'checkmate' | 'draw' | 'stalemate';

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
  online: {
    roomId: string | null;
    myColor: 'w' | 'b' | null;
  };
  matchResult: {
    winner: 'w' | 'b' | 'draw' | null;
    reason: string | null;
  };
  
  selectSquare: (square: Square) => void;
  movePiece: (from: Square, to: Square, isRemote?: boolean) => boolean;
  reset: () => void;
  undo: () => void;
  connectRoom: (roomId: string, myColor: 'w' | 'b') => void;
  disconnectRoom: () => void;
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
  
  selectSquare: (square: Square) => {
    const { game, selectedSquare, online } = get();
    const currentTurn = game.turn();
    
    if (online.roomId && online.myColor !== currentTurn) {
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
    const { game, pieces, capturedPieces, moveHistory } = get();
    
    try {
      const move = game.move({ from, to, promotion: 'q' });
      
      if (move) {
        let nextPieces = [...pieces];
        
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
        
        set({
          pieces: nextPieces,
          fen: game.fen(),
          turn: game.turn(),
          selectedSquare: null,
          legalMoves: [],
          captureMoves: [],
          gameStatus: status,
          moveHistory: [...moveHistory, move.san],
          capturedPieces: newCaptured,
        });
        
        const { online } = get();
        if (!isRemote && online.roomId) {
          const lastMoveRef = ref(database, `rooms/${online.roomId}/gameState/lastMove`);
          update(lastMoveRef, {
            from,
            to,
            promotion: 'q',
            fen: game.fen(),
          }).catch((error) => {
            console.error('Firebase sync error:', error);
          });
          
          if (game.isCheckmate()) {
            const roomRef = ref(database, `rooms/${online.roomId}`);
            update(roomRef, {
              status: 'finished',
              winner: move.color,
              endReason: 'checkmate',
            });
          } else if (game.isDraw() || game.isStalemate()) {
            const roomRef = ref(database, `rooms/${online.roomId}`);
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
    const newGame = new Chess();
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
    set({ online: { roomId, myColor }, matchResult: { winner: null, reason: null } });
    
    const lastMoveRef = ref(database, `rooms/${roomId}/gameState/lastMove`);
    firebaseUnsubscribe = onValue(lastMoveRef, (snapshot) => {
      const lastMove = snapshot.val();
      if (!lastMove) return;
      
      const { fen: localFen } = get();
      if (lastMove.fen !== localFen) {
        get().movePiece(lastMove.from, lastMove.to, true);
      }
    });
    
    const roomRef = ref(database, `rooms/${roomId}`);
    statusUnsubscribe = onValue(roomRef, (snapshot) => {
      const roomData = snapshot.val();
      if (!roomData) return;
      
      if (roomData.status === 'finished' && roomData.winner) {
        let reason = '';
        if (roomData.endReason === 'checkmate') reason = 'Chiếu hết';
        else if (roomData.endReason === 'opponent_resigned') reason = 'Đối thủ rời phòng';
        else if (roomData.endReason === 'stalemate') reason = 'Hết nước đi (Stalemate)';
        else if (roomData.endReason === 'draw') reason = 'Hòa';
        else reason = 'Game kết thúc';
        
        set({ matchResult: { winner: roomData.winner, reason } });
      }
    });
  },
  
  disconnectRoom: () => {
    if (firebaseUnsubscribe) {
      firebaseUnsubscribe();
      firebaseUnsubscribe = null;
    }
    if (statusUnsubscribe) {
      statusUnsubscribe();
      statusUnsubscribe = null;
    }
    set({ online: { roomId: null, myColor: null }, matchResult: { winner: null, reason: null } });
  },
}));
