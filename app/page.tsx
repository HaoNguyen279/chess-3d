'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Scene3D } from '@/components/Scene3D';
import { GameHeader } from '@/components/ui/GameHeader';
import { MoveHistory } from '@/components/ui/MoveHistory';
import { CapturedPieces } from '@/components/ui/CapturedPieces';
import { GameControls } from '@/components/ui/GameControls';
import { GameOverModal } from '@/components/ui/GameOverModal';
import { Lobby } from '@/components/ui/Lobby';
import { PuzzleUI } from '@/components/ui/PuzzleUI';
import { useChessStore } from '@/store/useChessStore';
import { useChessSounds } from '@/lib/useChessSounds';
import { useAIPlayer } from '@/lib/useAIPlayer';

export default function Home() {
  useChessSounds();
  useAIPlayer();
  const [gameSession, setGameSession] = useState<{ roomId: string; myColor: 'w' | 'b' } | null>(null);
  const connectRoom = useChessStore((state) => state.connectRoom);
  const disconnectRoom = useChessStore((state) => state.disconnectRoom);
  const isOffline = useChessStore((state) => state.isOffline);
  const isAI = useChessStore((state) => state.isAI);
  const startOfflineGame = useChessStore((state) => state.startOfflineGame);
  const startAIGame = useChessStore((state) => state.startAIGame);
  const quitToHub = useChessStore((state) => state.quitToHub);
  const isPuzzleMode = useChessStore((state) => state.isPuzzleMode);

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

  const handlePlayBot = useCallback((botId: string, elo: number) => {
    startAIGame(botId, elo);
  }, [startAIGame]);

  const handleBackToHub = useCallback(() => {
    quitToHub();
    setGameSession(null);
  }, [quitToHub]);

  if (!gameSession && !isOffline && !isAI && !isPuzzleMode) {
    return <Lobby onJoinRoom={handleJoinRoom} onStartOffline={handleStartOffline} onPlayBot={handlePlayBot} />;
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

      {/* Modal removed as requested */}

      <PuzzleUI />

      {!isPuzzleMode && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-6 left-6 pointer-events-auto">
            <GameHeader type="opponent" />
          </div>

          <div className="absolute bottom-6 left-6 pointer-events-auto">
            <GameHeader type="self" />
          </div>

          <div className="absolute top-6 right-6 pointer-events-auto w-64 space-y-4">
            <CapturedPieces />
            <MoveHistory />
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-3">
            {online.roomId && roomStatus !== 'playing' ? (
              <div className="flex items-center gap-4 bg-[#0c141a]/90 backdrop-blur-md border border-[#414942] rounded-2xl px-5 py-3 shadow-2xl">
                {roomStatus === 'waiting' ? (
                  <>
                    <span className="w-3 h-3 rounded-full bg-[#a8d638] animate-pulse shadow-[0_0_10px_#a8d638]" />
                    <span className="text-sm font-bold text-white tracking-wide">Waiting for opponent...</span>
                    <div className="h-4 w-px bg-[#414942] mx-2" />
                    <span className="font-mono text-sm text-[#a8d638] select-all">{online.roomId}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(online.roomId || '')}
                      className="px-3 py-1.5 bg-[#a8d638]/10 text-[#a8d638] hover:bg-[#a8d638]/20 rounded-lg text-xs font-bold transition-all"
                    >
                      Copy
                    </button>
                  </>
                ) : (
                  <>
                    <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.7)]" />
                    <span className="text-sm font-bold text-white tracking-wide">Opponent Disconnected</span>
                  </>
                )}
                <div className="h-4 w-px bg-[#414942] mx-2" />
                <button
                  onClick={handleLeaveRoom}
                  className="px-4 py-1.5 bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white border border-red-600/30 rounded-lg text-xs font-bold transition-all"
                >
                  Quit to Lobby
                </button>
              </div>
            ) : (
              <GameControls onLeaveRoom={handleLeaveRoom} onBackToHub={handleBackToHub} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
