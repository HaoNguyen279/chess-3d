'use client';

import React from 'react';
import { useChessStore } from '@/store/useChessStore';

export function MoveHistory() {
  const moveHistory = useChessStore((state) => state.moveHistory);
  
  const movePairs = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: moveHistory[i],
      black: moveHistory[i + 1] || '',
    });
  }
  
  return (
    <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4 border border-gray-700 max-h-64 overflow-y-auto">
      <div className="text-sm font-semibold text-gray-300 mb-3">Move History</div>
      
      {movePairs.length === 0 ? (
        <div className="text-xs text-gray-500 italic">No moves yet</div>
      ) : (
        <div className="space-y-1">
          {movePairs.map((pair) => (
            <div key={pair.number} className="flex items-center text-xs gap-2">
              <span className="text-gray-500 font-mono w-6">{pair.number}.</span>
              <span className="text-white font-mono w-16">{pair.white}</span>
              {pair.black && (
                <span className="text-gray-300 font-mono w-16">{pair.black}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
