'use client';

import React from 'react';
import { useProgress } from '@react-three/drei';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMounted } from '@/lib/useMounted';

export function LoadingAsset() {
  const { t } = useLanguage();
  const { active, progress } = useProgress();
  const mounted = useMounted();

  // Only show when mounted, and hide when loading is finished.
  if (!mounted) return null;
  if (!active && progress === 100) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-end pb-12 pointer-events-none">
       <div className="bg-[#0c141a]/80 backdrop-blur-md border border-[#414942] rounded-full px-5 py-2.5 flex items-center gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div className="w-4 h-4 border-2 border-[#a8d638] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[#dbe3ec] font-medium text-xs tracking-wide">
             {t.loading_asset.loading.replace('{progress}', String(Math.round(progress)))}
          </span>
       </div>
    </div>
  );
}
