'use client';

import { Scene3D } from '@/components/Scene3D';
import { GameHeader } from '@/components/ui/GameHeader';
import { MoveHistory } from '@/components/ui/MoveHistory';
import { CapturedPieces } from '@/components/ui/CapturedPieces';
import { GameControls } from '@/components/ui/GameControls';

export default function Home() {
  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <Scene3D />
      
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-6 left-6 pointer-events-auto">
          <GameHeader />
        </div>
        
        <div className="absolute top-6 right-6 pointer-events-auto w-64 space-y-4">
          <CapturedPieces />
          <MoveHistory />
        </div>
        
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto">
          <GameControls />
        </div>
      </div>
    </div>
  );
}
