'use client';

import React, { useState, useEffect } from 'react';
import { useChessStore, GameStatus } from '@/store/useChessStore';
import { database } from '@/lib/firebase';
import { ref, update } from 'firebase/database';

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

export function GameHeader() {
  const turn = useChessStore((state) => state.turn);
  const gameStatus = useChessStore((state) => state.gameStatus);
  const online = useChessStore((state) => state.online);
  const players = useChessStore((state) => state.players);
  const clocks = useChessStore((state) => state.clocks);
  const isOffline = useChessStore((state) => state.isOffline);
  const roomStatus = useChessStore((state) => state.roomStatus);
  const moveHistory = useChessStore((state) => state.moveHistory);
  
  const turnText = turn === 'w' ? 'White' : 'Black';
  
  const statusText = {
    active: 'In Progress',
    check: 'Check!',
    checkmate: 'Checkmate!',
    draw: 'Draw',
    stalemate: 'Stalemate',
    timeout: 'Hết giờ (Timeout)',
  }[gameStatus];
  
  const statusColor = {
    active: 'text-gray-300',
    check: 'text-yellow-400',
    checkmate: 'text-red-400',
    draw: 'text-blue-400',
    stalemate: 'text-blue-400',
    timeout: 'text-red-400',
  }[gameStatus];
  
  const hasWhite = !!players?.white;
  const hasBlack = !!players?.black;

  // Local state to display real-time clock tickdown without polluting store too often
  const [displayClocks, setDisplayClocks] = useState<{ white: number; black: number }>({ white: 0, black: 0 });

  useEffect(() => {
    if (clocks) {
      setDisplayClocks({ white: clocks.white, black: clocks.black });
    }
  }, [clocks]);

  useEffect(() => {
    if (!clocks || gameStatus !== 'active') return;
    
    // Only tick when the game is actually playing (if online)
    if (online.roomId && roomStatus !== 'playing') return;

    // Do NOT tick down the clocks if the game just started and no moves have been made yet
    if (moveHistory.length === 0) {
      setDisplayClocks({ white: clocks.white, black: clocks.black });
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - clocks.lastMoveTime;
      
      let whiteTime = clocks.white;
      let blackTime = clocks.black;

      if (turn === 'w') {
        whiteTime = Math.max(0, clocks.white - elapsed);
      } else {
        blackTime = Math.max(0, clocks.black - elapsed);
      }

      setDisplayClocks({ white: whiteTime, black: blackTime });

      // Handle timeout check
      if (whiteTime <= 0 || blackTime <= 0) {
        clearInterval(interval);
        const winner = whiteTime <= 0 ? 'b' : 'w';
        
        if (isOffline) {
          useChessStore.setState({
            gameStatus: 'timeout',
            matchResult: { winner, reason: 'Hết giờ (Timeout)' }
          });
        } else if (online.roomId) {
          // Only the player who timed out triggers the database update to avoid race conditions
          if (online.myColor === turn) {
            const roomRef = ref(database, `rooms/${online.roomId}`);
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
  }, [clocks, turn, gameStatus, isOffline, online, roomStatus, moveHistory]);

  return (
    <div className="bg-[#0c141a]/90 backdrop-blur-md rounded-2xl p-5 border border-[#414942] min-w-[240px] shadow-xl text-[#dbe3ec] relative overflow-hidden">
      {/* Decorative subtle header background line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#a8d638] to-transparent" />
      
      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Lượt đi</div>
      <div className="text-2xl font-black text-white mb-1.5 flex items-center gap-2">
        <span className={turn === 'w' ? 'text-white' : 'text-slate-400'}>
          {turn === 'w' ? '⚪' : '⚫'}
        </span>
        <span>{turnText}</span>
      </div>
      <div className={`text-xs font-bold uppercase tracking-wider mb-4 ${statusColor}`}>{statusText}</div>
      
      {/* ONLINE MODE TIMERS AND PRESENCE */}
      {online.roomId && (
        <div className="pt-3.5 border-t border-[#414942] space-y-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-[#a8d638]/70">Người chơi & Thời gian</div>
          
          {/* White Player row */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-gray-300 flex items-center gap-1.5 font-medium">
              <span>⚪</span> Trắng {online.myColor === 'w' && <span className="text-[9px] text-[#a8d638] font-mono font-bold">(Bạn)</span>}
            </span>
            <div className="flex items-center gap-3">
              {clocks && (
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded transition-all ${
                  displayClocks.white < 15000 && turn === 'w'
                    ? 'bg-red-950 border border-red-700/50 text-red-400 animate-pulse'
                    : turn === 'w'
                    ? 'bg-[#a8d638]/10 border border-[#a8d638]/30 text-[#a8d638]'
                    : 'bg-[#070f15] border border-[#414942] text-slate-400'
                }`}>
                  {formatTime(displayClocks.white)}
                </span>
              )}
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${hasWhite ? 'bg-[#a8d638] shadow-[0_0_8px_#a8d638]' : 'bg-gray-600'}`} />
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{hasWhite ? 'On' : 'Off'}</span>
              </div>
            </div>
          </div>
          
          {/* Black Player row */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-gray-300 flex items-center gap-1.5 font-medium">
              <span>⚫</span> Đen {online.myColor === 'b' && <span className="text-[9px] text-[#a8d638] font-mono font-bold">(Bạn)</span>}
            </span>
            <div className="flex items-center gap-3">
              {clocks && (
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded transition-all ${
                  displayClocks.black < 15000 && turn === 'b'
                    ? 'bg-red-950 border border-red-700/50 text-red-400 animate-pulse'
                    : turn === 'b'
                    ? 'bg-[#a8d638]/10 border border-[#a8d638]/30 text-[#a8d638]'
                    : 'bg-[#070f15] border border-[#414942] text-slate-400'
                }`}>
                  {formatTime(displayClocks.black)}
                </span>
              )}
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${hasBlack ? 'bg-[#a8d638] shadow-[0_0_8px_#a8d638]' : 'bg-gray-600'}`} />
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{hasBlack ? 'On' : 'Off'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OFFLINE MODE TIMERS */}
      {clocks && !online.roomId && (
        <div className="pt-3.5 border-t border-[#414942] space-y-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-[#a8d638]/70">Đồng hồ đếm ngược</div>
          
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-gray-300 flex items-center gap-1.5 font-medium">
              <span>⚪</span> Trắng
            </span>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded transition-all ${
              displayClocks.white < 15000 && turn === 'w'
                ? 'bg-red-950 border border-red-700/50 text-red-400 animate-pulse'
                : turn === 'w'
                ? 'bg-[#a8d638]/10 border border-[#a8d638]/30 text-[#a8d638]'
                : 'bg-[#070f15] border border-[#414942] text-slate-400'
            }`}>
              {formatTime(displayClocks.white)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-gray-300 flex items-center gap-1.5 font-medium">
              <span>⚫</span> Đen
            </span>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded transition-all ${
              displayClocks.black < 15000 && turn === 'b'
                ? 'bg-red-950 border border-red-700/50 text-red-400 animate-pulse'
                : turn === 'b'
                ? 'bg-[#a8d638]/10 border border-[#a8d638]/30 text-[#a8d638]'
                : 'bg-[#070f15] border border-[#414942] text-slate-400'
            }`}>
              {formatTime(displayClocks.black)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
