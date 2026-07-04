'use client';

import React from 'react';
import { useChessStore } from '@/store/useChessStore';

interface GameOverModalProps {
  onBackToLobby: () => void;
}

export function GameOverModal({ onBackToLobby }: GameOverModalProps) {
  const matchResult = useChessStore((state) => state.matchResult);
  const online = useChessStore((state) => state.online);
  const disconnectRoom = useChessStore((state) => state.disconnectRoom);

  if (!matchResult.winner || !online.roomId) return null;

  const isPlayerWinner = matchResult.winner === online.myColor;
  const isDraw = matchResult.winner === 'draw';

  let emoji: string;
  let title: string;
  let subtitle: string;

  if (isDraw) {
    emoji = '🤝';
    title = 'Hòa!';
    subtitle = matchResult.reason || 'Ván cờ kết thúc với tỷ số hòa';
  } else if (isPlayerWinner) {
    emoji = '🎉';
    title = 'Chiến thắng!';
    subtitle = matchResult.reason || 'Bạn đã đánh bại đối thủ';
  } else {
    emoji = '💀';
    title = 'Bạn đã thua!';
    subtitle = matchResult.reason || 'Đối thủ đã đánh bại bạn';
  }

  const handleBackToLobby = () => {
    disconnectRoom();
    onBackToLobby();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl p-8 w-full max-w-md text-center border border-gray-700 shadow-2xl">
        <div className="text-6xl mb-4">{emoji}</div>
        
        <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
        
        <p className="text-gray-300 text-lg mb-6">{subtitle}</p>
        
        <div className="flex justify-center">
          <button
            onClick={handleBackToLobby}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-lg"
          >
            Quay lại Sảnh
          </button>
        </div>
      </div>
    </div>
  );
}
