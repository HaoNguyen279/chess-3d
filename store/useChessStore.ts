import { Chess, Square } from 'chess.js';
import { create } from 'zustand';

export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
  square: Square;
}

export type GameStatus = 'active' | 'check' | 'checkmate' | 'draw' | 'stalemate';

interface ChessState {
  game: Chess;
  fen: string;
  turn: PieceColor;
  selectedSquare: Square | null;
  legalMoves: Square[];
  gameStatus: GameStatus;
  moveHistory: string[];
  capturedPieces: { white: PieceType[]; black: PieceType[] };
  
  selectSquare: (square: Square) => void;
  movePiece: (from: Square, to: Square) => boolean;
  reset: () => void;
  undo: () => void;
}

const initialGame = new Chess();

export const useChessStore = create<ChessState>((set, get) => ({
  game: initialGame,
  fen: initialGame.fen(),
  turn: 'w',
  selectedSquare: null,
  legalMoves: [],
  gameStatus: 'active',
  moveHistory: [],
  capturedPieces: { white: [], black: [] },
  
  selectSquare: (square: Square) => {
    const { game, selectedSquare } = get();
    const currentTurn = game.turn();
    
    if (!selectedSquare) {
      const piece = game.get(square);
      if (piece && piece.color === currentTurn) {
        const moves = game.moves({ square, verbose: true });
        const legalSquares = moves.map((m) => m.to as Square);
        set({ selectedSquare: square, legalMoves: legalSquares });
      }
      return;
    }
    
    if (selectedSquare === square) {
      set({ selectedSquare: null, legalMoves: [] });
      return;
    }
    
    const moveSucceeded = get().movePiece(selectedSquare, square);
    
    if (!moveSucceeded) {
      const clickedPiece = game.get(square);
      if (clickedPiece && clickedPiece.color === currentTurn) {
        const moves = game.moves({ square, verbose: true });
        const legalSquares = moves.map((m) => m.to as Square);
        set({ selectedSquare: square, legalMoves: legalSquares });
      } else {
        set({ selectedSquare: null, legalMoves: [] });
      }
    }
  },
  
  movePiece: (from: Square, to: Square) => {
    const { game, capturedPieces, moveHistory } = get();
    
    try {
      const move = game.move({ from, to, promotion: 'q' });
      
      if (move) {
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
          fen: game.fen(),
          turn: game.turn(),
          selectedSquare: null,
          legalMoves: [],
          gameStatus: status,
          moveHistory: [...moveHistory, move.san],
          capturedPieces: newCaptured,
        });
        
        return true;
      }
    } catch (error) {
      console.error('Invalid move:', error);
    }
    
    set({ selectedSquare: null, legalMoves: [] });
    return false;
  },
  
  reset: () => {
    const newGame = new Chess();
    set({
      game: newGame,
      fen: newGame.fen(),
      turn: 'w',
      selectedSquare: null,
      legalMoves: [],
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
        fen: game.fen(),
        turn: game.turn(),
        selectedSquare: null,
        legalMoves: [],
        gameStatus: status,
        moveHistory: moveHistory.slice(0, -1),
        capturedPieces: newCaptured,
      });
    }
  },
}));
