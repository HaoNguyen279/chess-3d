'use client';

import React from 'react';
import { useChessStore } from '@/store/useChessStore';
import { database } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import { useLanguage } from '@/contexts/LanguageContext';

interface GameControlsProps {
  onLeaveRoom?: () => void;
  onBackToHub?: () => void;
}

export function GameControls({ onLeaveRoom, onBackToHub }: GameControlsProps) {
  const { t } = useLanguage();
  const reset = useChessStore((state) => state.reset);
  const undo = useChessStore((state) => state.undo);
  const moveHistory = useChessStore((state) => state.moveHistory);
  const isOffline = useChessStore((state) => state.isOffline);
  const isAI = useChessStore((state) => state.isAI);
  const online = useChessStore((state) => state.online);
  const isReviewing = useChessStore((state) => state.isReviewing);
  const triggerCameraReset = useChessStore((state) => state.triggerCameraReset);

  const canUndo = moveHistory.length > 0;

  const handleLeaveRoom = async () => {
    if (!online.roomId) return;

    try {
      const roomRef = ref(database, `rooms/${online.roomId}`);
      const opponentColor = online.myColor === 'w' ? 'b' : 'w';

      const state = useChessStore.getState();
      if (!state.matchResult.winner) {
        await update(roomRef, {
          status: 'finished',
          winner: opponentColor,
          endReason: 'opponent_resigned',
        });
      }

      onLeaveRoom?.();
    } catch (error) {
      console.error('Error leaving room:', error);
      onLeaveRoom?.();
    }
  };

  // Review mode
  if (isReviewing) {
    return (
      <div className="flex gap-3">
        <button
          onClick={online.roomId ? handleLeaveRoom : onBackToHub}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-sm"
        >
          {t.game_controls.leave_match}
        </button>
        <button
          onClick={triggerCameraReset}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors text-sm"
        >
          {t.game_controls.default_view}
        </button>
      </div>
    );
  }

  // AI mode: only Back to Hub + Default View
  if (isAI) {
    return (
      <div className="flex gap-3">
        <button
          onClick={onBackToHub}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors text-sm"
        >
          {t.game_controls.back_hub}
        </button>
        <button
          onClick={triggerCameraReset}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors text-sm"
        >
          {t.game_controls.default_view}
        </button>
      </div>
    );
  }

  if (isOffline) {
    return (
      <div className="flex gap-3">
        <button
          onClick={onBackToHub}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors text-sm"
        >
          {t.game_controls.back_hub}
        </button>
        <button
          onClick={triggerCameraReset}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors text-sm"
        >
          {t.game_controls.default_view}
        </button>
        <button
          onClick={undo}
          disabled={!canUndo}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm"
        >
          {t.game_controls.undo}
        </button>
        <button
          onClick={reset}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-sm"
        >
          {t.game_controls.reset}
        </button>
      </div>
    );
  }

  if (online.roomId) {
    return (
      <div className="flex gap-3">
        <button
          onClick={triggerCameraReset}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors text-sm"
        >
          {t.game_controls.default_view}
        </button>
        <button
          onClick={handleLeaveRoom}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-sm"
        >
          {t.game_controls.quit}
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={triggerCameraReset}
        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors text-sm"
      >
        {t.game_controls.default_view}
      </button>

      <button
        onClick={undo}
        disabled={!canUndo}
        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors text-sm"
      >
        {t.game_controls.undo}
      </button>

      <button
        onClick={reset}
        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-sm"
      >
        {t.game_controls.reset}
      </button>
    </div>
  );
}
