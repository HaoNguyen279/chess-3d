'use client';

import React from 'react';
import { useChessStore, PieceType } from '@/store/useChessStore';
import { useLanguage } from '@/contexts/LanguageContext';

const PIECE_SYMBOLS: Record<PieceType, string> = {
  p: '♟',
  n: '♞',
  b: '♝',
  r: '♜',
  q: '♛',
  k: '♚',
};

const PIECE_VALUES: Record<PieceType, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

export function CapturedPieces() {
  const { t } = useLanguage();
  const capturedPieces = useChessStore((state) => state.capturedPieces);

  const whiteValue = capturedPieces.white.reduce((sum, type) => sum + PIECE_VALUES[type], 0);
  const blackValue = capturedPieces.black.reduce((sum, type) => sum + PIECE_VALUES[type], 0);
  const advantage = whiteValue - blackValue;

  return (
    <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
      <div className="text-sm font-semibold text-gray-300 mb-3">{t.game.captured_pieces}</div>

      <div className="space-y-3">
        <div>
          <div className="text-xs text-gray-400 mb-1">{t.game.white_captured}</div>
          <div className="flex flex-wrap gap-1 min-h-[28px]">
            {capturedPieces.white.length === 0 ? (
              <span className="text-xs text-gray-600">{t.game.none}</span>
            ) : (
              capturedPieces.white.map((type, index) => (
                <span key={index} className="text-2xl text-gray-800">
                  {PIECE_SYMBOLS[type]}
                </span>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-400 mb-1">{t.game.black_captured}</div>
          <div className="flex flex-wrap gap-1 min-h-[28px]">
            {capturedPieces.black.length === 0 ? (
              <span className="text-xs text-gray-600">{t.game.none}</span>
            ) : (
              capturedPieces.black.map((type, index) => (
                <span key={index} className="text-2xl text-gray-100">
                  {PIECE_SYMBOLS[type]}
                </span>
              ))
            )}
          </div>
        </div>

        {advantage !== 0 && (
          <div className="pt-2 border-t border-gray-700">
            <div className="text-xs">
              <span className={advantage > 0 ? 'text-white' : 'text-gray-800'}>
                {advantage > 0 ? t.game.white : t.game.black} +{Math.abs(advantage)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
