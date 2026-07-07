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
  if (!matchResult.winner || isReviewing) return null;

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
    <div className="fixed inset-0 bg-[#070f15]/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-[#0c141a] border border-[#414942] rounded-3xl p-8 w-full max-w-md text-center shadow-2xl relative overflow-hidden">
        {/* Decorative top colored strip */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#a8d638] to-transparent" />
        
        <div className="text-7xl mb-5 drop-shadow-[0_0_15px_rgba(168,214,56,0.2)] select-none">
          {emoji}
        </div>
        
        <h2 className="text-3xl font-black text-white mb-3 tracking-tight">
          {title}
        </h2>
        
        <p className="text-[#c1c9c0] text-sm leading-relaxed mb-8 max-w-xs mx-auto">
          {subtitle}
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={startReview}
            className="w-full py-3.5 bg-[#1a232c] text-white border border-[#414942] font-bold rounded-xl hover:bg-[#232b31] active:scale-[0.97] transition-all text-base shadow-sm"
          >
            Xem lại ván đấu
          </button>
          
          <button
            onClick={handleBackToLobby}
            className="w-full py-3.5 bg-[#a8d638] text-[#263500] font-black rounded-xl hover:brightness-110 active:scale-[0.97] transition-all text-base shadow-[0_4px_20px_rgba(168,214,56,0.25)]"
          >
            Quay lại Sảnh
          </button>
        </div>
      </div>
    </div>
  );
}
