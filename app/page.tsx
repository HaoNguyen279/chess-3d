'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Scene3D } from '@/components/Scene3D';
import { GameHeader } from '@/components/ui/GameHeader';
import { MoveHistory } from '@/components/ui/MoveHistory';
import { CapturedPieces } from '@/components/ui/CapturedPieces';
import { GameControls } from '@/components/ui/GameControls';
import { GameOverModal } from '@/components/ui/GameOverModal';
import { Lobby } from '@/components/ui/Lobby';
import { useChessStore } from '@/store/useChessStore';
import { useChessSounds } from '@/lib/useChessSounds';

export default function Home() {
  useChessSounds();
  const [gameSession, setGameSession] = useState<{ roomId: string; myColor: 'w' | 'b' } | null>(null);
  const connectRoom = useChessStore((state) => state.connectRoom);
  const disconnectRoom = useChessStore((state) => state.disconnectRoom);
  const isOffline = useChessStore((state) => state.isOffline);
  const startOfflineGame = useChessStore((state) => state.startOfflineGame);
  const quitToHub = useChessStore((state) => state.quitToHub);

  const online = useChessStore((state) => state.online);
  const roomStatus = useChessStore((state) => state.roomStatus);

  const [showToast, setShowToast] = useState(false);
  const prevStatusRef = useRef(roomStatus);

  useEffect(() => {
    if (prevStatusRef.current === 'waiting' && roomStatus === 'playing') {
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
    prevStatusRef.current = roomStatus;
  }, [roomStatus]);

  const handleJoinRoom = useCallback((roomId: string, myColor: 'w' | 'b') => {
    connectRoom(roomId, myColor);
    setGameSession({ roomId, myColor });
  }, [connectRoom]);

  const handleLeaveRoom = useCallback(() => {
    disconnectRoom();
    setGameSession(null);
  }, [disconnectRoom]);

  const handleStartOffline = useCallback((timeControl: string) => {
    startOfflineGame(timeControl);
  }, [startOfflineGame]);

  const handleBackToHub = useCallback(() => {
    quitToHub();
    setGameSession(null);
  }, [quitToHub]);

  if (!gameSession && !isOffline) {
    return <Lobby onJoinRoom={handleJoinRoom} onStartOffline={handleStartOffline} />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <Scene3D />

      <GameOverModal onBackToLobby={handleBackToHub} />
      
      {/* Toast Alert */}
      {showToast && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#a8d638] text-[#263500] font-black text-sm px-6 py-3 rounded-full shadow-[0_0_20px_rgba(168,214,56,0.4)] animate-bounce z-40">
          🎉 Opponent connected! Game starts now.
        </div>
      )}

      {/* Multiplayer Wait/Disconnect Overlay */}
      {online.roomId && roomStatus !== 'playing' && (
        <div className="absolute inset-0 bg-[#070f15]/75 backdrop-blur-[4px] flex items-center justify-center z-20 pointer-events-auto">
          <div className="bg-[#0c141a] border border-[#414942] rounded-2xl p-8 max-w-md w-full text-center shadow-2xl space-y-6">
            {roomStatus === 'waiting' ? (
              <>
                {/* Pulsing loading badge */}
                <div className="flex flex-col items-center gap-3">
                  <span className="w-4 h-4 rounded-full bg-[#a8d638] animate-pulse shadow-[0_0_12px_#a8d638]" />
                  <h3 className="text-xl font-bold text-white tracking-wide">Waiting for Opponent</h3>
                  <p className="text-xs text-[#c1c9c0] leading-relaxed">
                    Waiting for the other player to join the room. Share the room code below:
                  </p>
                </div>
                
                {/* Room ID and Copy Link */}
                <div className="bg-[#070f15] border border-[#414942] rounded-xl p-3 flex items-center justify-between gap-3">
                  <span className="font-mono text-xs text-[#a8d638] select-all truncate max-w-[240px]">
                    {online.roomId}
                  </span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(online.roomId || '');
                    }}
                    className="px-3 py-1.5 bg-[#a8d638] text-[#263500] rounded-lg text-xs font-bold hover:brightness-110 active:scale-95 transition-all"
                  >
                    Copy Code
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Opponent Disconnected */}
                <div className="flex flex-col items-center gap-3">
                  <span className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.7)]" />
                  <h3 className="text-xl font-bold text-white tracking-wide">Opponent Disconnected</h3>
                  <p className="text-xs text-[#c1c9c0] leading-relaxed">
                    The opponent has left or disconnected from the match. The game is paused.
                  </p>
                </div>
              </>
            )}
            
            <button 
              onClick={handleLeaveRoom}
              className="w-full py-2.5 bg-[#232b31] border border-[#414942] text-[#dbe3ec] hover:bg-[#2e363c] font-bold rounded-xl transition-all text-sm"
            >
              Quit to Lobby
            </button>
          </div>
        </div>
      )}
      
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-6 left-6 pointer-events-auto">
          <GameHeader />
        </div>
        
        <div className="absolute top-6 right-6 pointer-events-auto w-64 space-y-4">
          <CapturedPieces />
          <MoveHistory />
        </div>
        
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-3">
          <GameControls onLeaveRoom={handleLeaveRoom} onBackToHub={handleBackToHub} />
        </div>
      </div>
    </div>
  );
}
