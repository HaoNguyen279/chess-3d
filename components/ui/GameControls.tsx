'use client';

import React from 'react';
import { useChessStore } from '@/store/useChessStore';
import { database } from '@/lib/firebase';
import { ref, update } from 'firebase/database';

interface GameControlsProps {
  onLeaveRoom?: () => void;
  onBackToHub?: () => void;
}

export function GameControls({ onLeaveRoom, onBackToHub }: GameControlsProps) {
  const reset = useChessStore((state) => state.reset);
  const undo = useChessStore((state) => state.undo);
  const moveHistory = useChessStore((state) => state.moveHistory);
  const isOffline = useChessStore((state) => state.isOffline);
  const online = useChessStore((state) => state.online);

  const canUndo = moveHistory.length > 0;

  const handleLeaveRoom = async () => {
    if (!online.roomId) return;

    try {
      const roomRef = ref(database, `rooms/${online.roomId}`);
      const opponentColor = online.myColor === 'w' ? 'b' : 'w';
      
      await update(roomRef, {
        status: 'finished',
        winner: opponentColor,
        endReason: 'opponent_resigned',
      });

      onLeaveRoom?.();
    } catch (error) {
      console.error('Error leaving room:', error);
      onLeaveRoom?.();
    }
  };

  if (isOffline) {
    return (
      <div className="flex gap-3">
        <button
          onClick={onBackToHub}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors text-sm"
        >
          ← Về Hub
        </button>
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

  if (online.roomId) {
    return (
      <button
        onClick={handleLeaveRoom}
        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-sm"
      >
        Rời phòng (Resign)
      </button>
    );
  }

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
