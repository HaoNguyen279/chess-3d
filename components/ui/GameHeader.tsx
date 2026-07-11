'use client';

import React, { useState, useEffect } from 'react';
import { useChessStore } from '@/store/useChessStore';
import { database } from '@/lib/firebase';
import { ref, update } from 'firebase/database';
import { useLanguage } from '@/contexts/LanguageContext';

function formatTime(ms: number): string {
  if (ms <= 0) return '00:00.0';

  const totalSeconds = ms / 1000;

  if (totalSeconds < 60) {
    const seconds = Math.floor(totalSeconds);
    const tenths = Math.floor((ms % 1000) / 100);
    return `${seconds}.${tenths}s`;
  } else {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const secStr = seconds < 10 ? `0${seconds}` : `${seconds}`;
    const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${minStr}:${secStr}`;
  }
}

interface GameHeaderProps {
  type: 'opponent' | 'self';
}

export function GameHeader({ type }: GameHeaderProps) {
  const { t } = useLanguage();
  const turn = useChessStore((state) => state.turn);
  const gameStatus = useChessStore((state) => state.gameStatus);
  const online = useChessStore((state) => state.online);
  const players = useChessStore((state) => state.players);
  const clocks = useChessStore((state) => state.clocks);
  const isOffline = useChessStore((state) => state.isOffline);
  const isAI = useChessStore((state) => state.isAI);
  const aiBotElo = useChessStore((state) => state.aiBotElo);
  const roomStatus = useChessStore((state) => state.roomStatus);
  const moveHistory = useChessStore((state) => state.moveHistory);

  // Destructure store values to safe primitive dependency variables
  const clocksWhite = clocks?.white ?? 0;
  const clocksBlack = clocks?.black ?? 0;
  const clocksLastMoveTime = clocks?.lastMoveTime ?? 0;
  const onlineRoomId = online.roomId;
  const onlineMyColor = online.myColor;
  const moveHistoryLength = moveHistory.length;

  // Determine the color of self and opponent
  const selfColor = onlineRoomId ? (onlineMyColor || 'w') : 'w';
  const opponentColor = selfColor === 'w' ? 'b' : 'w';

  const cardColor = type === 'self' ? selfColor : opponentColor;

  // Game running state is true if the game is active OR in check state
  const isGameRunning = gameStatus === 'active' || gameStatus === 'check';
  const isCardTurn = turn === cardColor && isGameRunning;

  const colorText = cardColor === 'w' ? t.game.white : t.game.black;
  const colorEmoji = cardColor === 'w' ? '⚪' : '⚫';

  // Determine player presence (online mode only)
  const isPlayerPresent = onlineRoomId
    ? cardColor === 'w'
      ? !!players?.white
      : !!players?.black
    : true;

  // Player Name / Role text
  let displayName = '';
  if (isAI) {
    if (type === 'self') {
      displayName = t.game_header.self_label.replace('{color}', colorText);
    } else {
      displayName = t.game_header.ai_bot_label.replace('{elo}', String(aiBotElo ?? '?'));
    }
  } else if (onlineRoomId) {
    if (type === 'self') {
      displayName = t.game_header.self_label.replace('{color}', colorText);
    } else {
      displayName = t.game_header.opponent_label.replace('{color}', colorText);
    }
  } else {
    if (type === 'self') {
      displayName = t.game_header.offline_self;
    } else {
      displayName = t.game_header.offline_opponent;
    }
  }

  // Local state to display real-time clock tickdown without polluting store too often
  const [displayClocks, setDisplayClocks] = useState<{ white: number; black: number }>({ white: 0, black: 0 });

  useEffect(() => {
    if (clocks) {
      setDisplayClocks({ white: clocks.white, black: clocks.black });
    }
  }, [clocks]);

  useEffect(() => {
    if (!clocks || !isGameRunning) return;

    // Only tick when the game is actually playing (if online)
    if (onlineRoomId && roomStatus !== 'playing') return;

    // Do NOT tick down the clocks if the game just started and no moves have been made yet
    if (moveHistoryLength === 0) {
      setDisplayClocks({ white: clocksWhite, black: clocksBlack });
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - clocksLastMoveTime;

      let whiteTime = clocksWhite;
      let blackTime = clocksBlack;

      if (turn === 'w') {
        whiteTime = Math.max(0, clocksWhite - elapsed);
      } else {
        blackTime = Math.max(0, clocksBlack - elapsed);
      }

      setDisplayClocks({ white: whiteTime, black: blackTime });

      // Handle timeout check
      if (whiteTime <= 0 || blackTime <= 0) {
        clearInterval(interval);
        const winner = whiteTime <= 0 ? 'b' : 'w';

        if (isOffline) {
          useChessStore.setState({
            gameStatus: 'timeout',
            matchResult: { winner, reason: 'timeout' }
          });
        } else if (onlineRoomId) {
          // Only the player who timed out triggers the database update to avoid race conditions
          if (onlineMyColor === turn) {
            const roomRef = ref(database, `rooms/${onlineRoomId}`);
            update(roomRef, {
              status: 'finished',
              winner,
              endReason: 'timeout'
            }).catch(err => console.error("Firebase timeout update error:", err));
          }
        }
      }
    }, 50);

    return () => clearInterval(interval);
  }, [clocksWhite, clocksBlack, clocksLastMoveTime, turn, gameStatus, isOffline, onlineRoomId, onlineMyColor, roomStatus, moveHistoryLength, isGameRunning, clocks]);

  const timeValue = cardColor === 'w' ? displayClocks.white : displayClocks.black;
  const isTimeLow = timeValue < 15000 && clocks; // 15 seconds

  // Active / Check / Status indicator on card
  const isChecked = gameStatus === 'check' && isCardTurn;

  return (
    <div
      className={`min-w-[240px] text-[#dbe3ec] transition-all duration-300 ${
        isCardTurn ? 'opacity-100 clock-card-wrapper ' : 'opacity-60'
      }`}
    >
      {/* Inner content layer - solid bg covers the spinning gradient center */}
      <div className="clock-card-inner">
        <div className="flex items-center justify-between gap-4 w-full">
          {/* Left side: Color, Name, Check badge, Online indicator */}
          <div className="flex items-center gap-2 select-none">
            <span className="text-lg leading-none">{colorEmoji}</span>
            <span className="font-bold text-sm tracking-wide text-white whitespace-nowrap">{displayName}</span>

            {onlineRoomId && (
              <span
                className={`w-2 h-2 rounded-full transition-all ${isPlayerPresent
                  ? 'bg-[#a8d638] shadow-[0_0_6px_#a8d638]'
                  : 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]'
                  }`}
              />
            )}

            {isChecked && (
              <span className="bg-red-600/90 text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow-[0_2px_6px_rgba(220,38,38,0.4)] tracking-wider animate-pulse">
                {t.game.check_label}
              </span>
            )}
          </div>

          {/* Right side: Clock timer */}
          <div className="flex items-center">
            {clocks ? (
              <span
                className={`text-base font-mono font-black px-2.5 py-1 rounded-xl transition-all tracking-wide ${isTimeLow && isCardTurn
                  ? 'bg-red-950/80 text-red-400 animate-pulse'
                  : isCardTurn
                    ? 'bg-[#a8d638]/15 text-[#a8d638]'
                    : 'bg-[#070f15]/80 text-slate-400'
                  }`}
              >
                {formatTime(timeValue)}
              </span>
            ) : (
              <span className={`text-xl font-bold font-mono px-2.5 py-1 rounded-xl transition-all tracking-wide ${isCardTurn ? 'bg-[#a8d638]/15 text-[#a8d638]' : 'bg-[#070f15]/80 text-slate-400'}`}>
                ∞
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
