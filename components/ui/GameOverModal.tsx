'use client';

import React from 'react';
import { useChessStore } from '@/store/useChessStore';

interface GameOverModalProps {
  onBackToLobby: () => void;
}

export function GameOverModal({ onBackToLobby }: GameOverModalProps) {
  const matchResult = useChessStore((state) => state.matchResult);
  const online = useChessStore((state) => state.online);
  const isOffline = useChessStore((state) => state.isOffline);
  const isAI = useChessStore((state) => state.isAI);
  const aiBotId = useChessStore((state) => state.aiBotId);
  const disconnectRoom = useChessStore((state) => state.disconnectRoom);
  const isReviewing = useChessStore((state) => state.isReviewing);
  const startReview = useChessStore((state) => state.startReview);

  // Show modal if there is a winner, regardless of online or offline mode
  if (!matchResult.winner) return null;

  const isDraw = matchResult.winner === 'draw';
  const isOnline = !!online.roomId;
  
  let emoji: string = '🏆';
  let title: string = 'Game Over';
  let subtitle: string = matchResult.reason || 'Trận đấu kết thúc';

  if (isAI) {
    const isPlayerWinner = matchResult.winner === 'w'; // Player is always white
    const botName = aiBotId ? (aiBotId.charAt(0).toUpperCase() + aiBotId.slice(1)) : 'Bot';
    
    if (isDraw) {
      emoji = '🤝';
      title = 'Hòa!';
      subtitle = matchResult.reason || `Ván cờ hòa với ${botName}`;
    } else if (isPlayerWinner) {
      emoji = '🎉';
      title = 'Chiến thắng!';
      subtitle = matchResult.reason || `Bạn đã đánh bại ${botName}`;
    } else {
      emoji = '💀';
      title = 'Thất bại!';
      subtitle = matchResult.reason || `${botName} đã đánh bại bạn`;
    }
  } else if (isOnline) {
    const isPlayerWinner = matchResult.winner === online.myColor;
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
      title = 'Thất bại!';
      subtitle = matchResult.reason || 'Đối thủ đã đánh bại bạn';
    }
  } else {
    // Offline mode
    if (isDraw) {
      emoji = '🤝';
      title = 'Hòa!';
      subtitle = matchResult.reason || 'Ván cờ hòa';
    } else {
      emoji = '🏆';
      title = matchResult.winner === 'w' ? 'Trắng thắng!' : 'Đen thắng!';
      subtitle = matchResult.reason || (matchResult.winner === 'w' ? 'Quân Trắng giành chiến thắng' : 'Quân Đen giành chiến thắng');
    }
  }

  const handleBackToLobby = () => {
    if (isOnline) {
      disconnectRoom();
    }
    onBackToLobby();
  };

  return (
    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 animate-fadeIn pointer-events-auto">
      <div className="bg-[#0c141a]/70 backdrop-blur-md border border-[#414942]/50 rounded-2xl p-4 flex flex-col items-center justify-center shadow-2xl min-w-[240px]">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-4xl drop-shadow-md">{emoji}</span>
          <div className="flex flex-col items-start">
            <h2 className="text-xl font-black text-white tracking-tight">{title}</h2>
            <p className="text-[#c1c9c0] text-xs font-medium">{subtitle}</p>
          </div>
        </div>
        
        <button
          onClick={handleBackToLobby}
          className="w-full py-2.5 bg-[#a8d638]/90 hover:bg-[#a8d638] text-[#263500] font-black rounded-xl active:scale-[0.97] transition-all text-sm shadow-lg backdrop-blur-sm"
        >
          Thoát trận
        </button>
      </div>
    </div>
  );
}

