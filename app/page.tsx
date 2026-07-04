'use client';

import { useState, useCallback } from 'react';
import { Scene3D } from '@/components/Scene3D';
import { GameHeader } from '@/components/ui/GameHeader';
import { MoveHistory } from '@/components/ui/MoveHistory';
import { CapturedPieces } from '@/components/ui/CapturedPieces';
import { GameControls } from '@/components/ui/GameControls';
import { GameOverModal } from '@/components/ui/GameOverModal';
import { Lobby } from '@/components/ui/Lobby';
import { useChessStore } from '@/store/useChessStore';

export default function Home() {
  const [gameSession, setGameSession] = useState<{ roomId: string; myColor: 'w' | 'b' } | null>(null);
  const connectRoom = useChessStore((state) => state.connectRoom);
  const disconnectRoom = useChessStore((state) => state.disconnectRoom);
  const isOffline = useChessStore((state) => state.isOffline);
  const startOfflineGame = useChessStore((state) => state.startOfflineGame);
  const quitToHub = useChessStore((state) => state.quitToHub);

  const handleJoinRoom = useCallback((roomId: string, myColor: 'w' | 'b') => {
    connectRoom(roomId, myColor);
    setGameSession({ roomId, myColor });
  }, [connectRoom]);

  const handleLeaveRoom = useCallback(() => {
    disconnectRoom();
    setGameSession(null);
  }, [disconnectRoom]);

  const handleStartOffline = useCallback(() => {
    startOfflineGame();
  }, [startOfflineGame]);

  const handleBackToHub = useCallback(() => {
    quitToHub();
  }, [quitToHub]);

  if (!gameSession && !isOffline) {
    return <Lobby onJoinRoom={handleJoinRoom} onStartOffline={handleStartOffline} />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <Scene3D />

      <GameOverModal onBackToLobby={handleBackToHub} />
      
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
