'use client';

import React from 'react';
import { useChessStore } from '@/store/useChessStore';
import { useLanguage } from '@/contexts/LanguageContext';

interface GameOverModalProps {
  onBackToLobby: () => void;
}

export function GameOverModal({ onBackToLobby }: GameOverModalProps) {
  const { t } = useLanguage();
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

  // Get reason text from dictionary or fallback
  const getReasonText = () => {
    if (!matchResult.reason) return '';
    const reasons = t.game_over.reasons;
    return (reasons as Record<string, string>)[matchResult.reason] || matchResult.reason;
  };

  const reasonText = getReasonText();

  let emoji: string = '🏆';
  let title: string = t.game_over.title_default;
  let subtitle: string = reasonText;

  if (isAI) {
    const isPlayerWinner = matchResult.winner === 'w';
    const botName = aiBotId ? (aiBotId.charAt(0).toUpperCase() + aiBotId.slice(1)) : 'Bot';

    if (isDraw) {
      emoji = '🤝';
      title = t.game_over.title_draw;
      subtitle = reasonText || t.game_over.vs_bot_draw.replace('{botName}', botName);
    } else if (isPlayerWinner) {
      emoji = '🎉';
      title = t.game_over.title_victory;
      subtitle = reasonText || t.game_over.vs_bot_win.replace('{botName}', botName);
    } else {
      emoji = '💀';
      title = t.game_over.title_defeat;
      subtitle = reasonText || t.game_over.vs_bot_lose.replace('{botName}', botName);
    }
  } else if (isOnline) {
    const isPlayerWinner = matchResult.winner === online.myColor;
    if (isDraw) {
      emoji = '🤝';
      title = t.game_over.title_draw;
      subtitle = reasonText || t.game_over.vs_online_draw;
    } else if (isPlayerWinner) {
      emoji = '🎉';
      title = t.game_over.title_victory;
      subtitle = reasonText || t.game_over.vs_online_win;
    } else {
      emoji = '💀';
      title = t.game_over.title_defeat;
      subtitle = reasonText || t.game_over.vs_online_lose;
    }
  } else {
    // Offline mode
    if (isDraw) {
      emoji = '🤝';
      title = t.game_over.title_draw;
      subtitle = reasonText || t.game_over.offline_draw;
    } else {
      emoji = '🏆';
      title = matchResult.winner === 'w' ? t.game_over.title_white_wins : t.game_over.title_black_wins;
      subtitle = reasonText || (matchResult.winner === 'w' ? t.game_over.offline_white_wins : t.game_over.offline_black_wins);
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
          {t.game_over.back_to_lobby}
        </button>
      </div>
    </div>
  );
}

