'use client';

import React from 'react';
import { useChessStore } from '@/store/useChessStore';

export function PuzzleUI() {
  const isPuzzleMode = useChessStore((state) => state.isPuzzleMode);
  const puzzleState = useChessStore((state) => state.puzzleState);
  const puzzleData = useChessStore((state) => state.puzzleData);
  const startRandomPuzzle = useChessStore((state) => state.startRandomPuzzle);
  const retryPuzzleMove = useChessStore((state) => state.retryPuzzleMove);
  const quitPuzzle = useChessStore((state) => state.quitPuzzle);

  if (!isPuzzleMode) return null;

  return (
    <>
      {/* Top Header */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-auto z-30">
        <div className="bg-[#0c141a]/90 backdrop-blur-md border border-[#414942] rounded-2xl px-6 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col items-center">
          <span className="text-[#a8d638] font-black uppercase tracking-widest text-[10px] mb-1">
            PUZZLE MODE
          </span>
          <h2 className="text-white font-bold text-lg text-center max-w-[300px] truncate">
            {puzzleData?.title || 'Loading...'}
          </h2>
        </div>
      </div>

      {/* Loading Overlay */}
      {puzzleState === 'loading' && (
        <div className="absolute inset-0 bg-[#070f15]/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4">
            <span className="w-8 h-8 rounded-full border-4 border-[#a8d638]/30 border-t-[#a8d638] animate-spin shadow-[0_0_15px_rgba(168,214,56,0.5)]"></span>
            <span className="text-[#a8d638] font-bold tracking-widest animate-pulse">FETCHING PUZZLE...</span>
          </div>
        </div>
      )}

      {/* Wrong Move Overlay */}
      {puzzleState === 'wrong' && (
        <div className="absolute inset-0 bg-red-900/20 flex flex-col items-center justify-center z-40 pointer-events-auto backdrop-blur-[2px]">
          <div className="bg-[#1a0f14] border border-red-500/50 rounded-2xl p-8 max-w-sm w-full text-center shadow-[0_0_40px_rgba(239,68,68,0.2)] animate-scaleUp">
            <span className="material-symbols-outlined text-red-500 text-5xl mb-4">Wrong Move!</span>
            <p className="text-[#c1c9c0] text-sm mb-6">That is not the correct solution.</p>
            <p className="text-[#c1c9c0] text-sm mb-6">Please try again.</p>
            <button
              onClick={retryPuzzleMove}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Solved Overlay */}
      {puzzleState === 'solved' && (
        <div className="absolute inset-0 bg-[#070f15]/60 flex items-center justify-center z-40 pointer-events-auto backdrop-blur-sm">
          <div className="bg-[#0c141a] border border-[#a8d638]/50 rounded-2xl p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(168,214,56,0.3)] animate-scaleUp">
            <span className="material-symbols-outlined text-[#a8d638] text-5xl mb-4 animate-bounce">emoji_events</span>
            <h3 className="text-2xl font-black text-white mb-2">Puzzle Solved!</h3>
            <p className="text-[#c1c9c0] text-sm mb-6">Excellent calculation.</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={startRandomPuzzle}
                className="w-full py-3 bg-[#a8d638] hover:brightness-110 text-[#263500] font-black rounded-xl transition-all shadow-[0_0_15px_rgba(168,214,56,0.3)]"
              >
                Next Puzzle
              </button>
              <button
                onClick={quitPuzzle}
                className="w-full py-3 bg-[#232b31] hover:bg-[#2e363c] text-[#dbe3ec] font-bold rounded-xl transition-colors"
              >
                Quit to Lobby
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 pointer-events-auto z-30">
        <button
          onClick={quitPuzzle}
          className="px-6 py-2.5 bg-[#232b31] hover:bg-[#2e363c] text-white font-bold rounded-xl transition-colors shadow-lg border border-[#414942]"
        >
          Quit
        </button>
        <button
          onClick={startRandomPuzzle}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg"
        >
          Skip Puzzle
        </button>
      </div>
    </>
  );
}
