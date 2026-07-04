'use client';

import React from 'react';
import { useChessStore } from '@/store/useChessStore';

export function GameHeader() {
  const turn = useChessStore((state) => state.turn);
  const gameStatus = useChessStore((state) => state.gameStatus);
  
  const turnText = turn === 'w' ? 'White' : 'Black';
  
  const statusText = {
    active: 'In Progress',
    check: 'Check!',
    checkmate: 'Checkmate!',
    draw: 'Draw',
    stalemate: 'Stalemate',
  }[gameStatus];
  
  const statusColor = {
    active: 'text-gray-300',
    check: 'text-yellow-400',
    checkmate: 'text-red-400',
    draw: 'text-blue-400',
    stalemate: 'text-blue-400',
  }[gameStatus];
  
  return (
    <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
      <div className="text-sm text-gray-400 mb-1">Current Turn</div>
      <div className="text-2xl font-bold text-white mb-2">{turnText}</div>
      <div className={`text-sm font-semibold ${statusColor}`}>{statusText}</div>
    </div>
  );
}
