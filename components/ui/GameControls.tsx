'use client';

import React from 'react';
import { useChessStore } from '@/store/useChessStore';

export function GameControls() {
  const reset = useChessStore((state) => state.reset);
  const undo = useChessStore((state) => state.undo);
  const moveHistory = useChessStore((state) => state.moveHistory);
  
  const canUndo = moveHistory.length > 0;
  
  return (
    <div className="flex gap-3">
      <button
        onClick={undo}
        disabled={!canUndo}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm"
      >
        Undo
      </button>
      
      <button
        onClick={reset}
        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-sm"
      >
        Reset
      </button>
    </div>
  );
}
