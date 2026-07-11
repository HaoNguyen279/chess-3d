'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Bot {
  id: string | number;
  name: string;
  country: string;
  descriptionKey: string;
  elo: number;
  imageUrl: string;
  locked?: boolean;
}

const bots: Bot[] = [
  { id: 1, name: "Leo Carter", country: "USA", elo: 100, descriptionKey: "bot_1", imageUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Leo Carter" },
  { id: 2, name: "Min-Jun Park", country: "South Korea", elo: 300, descriptionKey: "bot_2", imageUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Min-Jun Park" },
  { id: 3, name: "Mateo Silva", country: "Brazil", elo: 500, descriptionKey: "bot_3", imageUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Mateo Silva" },
  { id: 4, name: "Luca Rossi", country: "Italy", elo: 700, descriptionKey: "bot_4", imageUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Luca Rossi" },
  { id: 5, name: "Emily Wilson", country: "Canada", elo: 900, descriptionKey: "bot_5", imageUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Emily Wilson" },
  { id: 6, name: "Kim Ngan", country: "Vietnam", elo: 1100, descriptionKey: "bot_6", imageUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Kim Ngan" },
  { id: 7, name: "Ananya Sharma", country: "India", elo: 1300, descriptionKey: "bot_7", imageUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Ananya Sharma" },
  { id: 8, name: "Ivan Petrov", country: "Russia", elo: 1500, descriptionKey: "bot_8", imageUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Ivan Petrov" },
  { id: 9, name: "Sophie Dubois", country: "France", elo: 1700, descriptionKey: "bot_9", imageUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Sophie Dubois" },
  { id: 10, name: "Kenji Tanaka", country: "Japan", elo: 1900, descriptionKey: "bot_10", imageUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Kenji Tanaka" },
  { id: 11, name: "Magnus Eriksen", country: "Norway", elo: 2100, descriptionKey: "bot_11", imageUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Magnus Eriksen" },
  { id: 12, name: "Artem Volkov", country: "Ukraine", elo: 2300, descriptionKey: "bot_12", imageUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Artem Volkov", locked: true },
  { id: 13, name: "Wei Chen", country: "China", elo: 2500, descriptionKey: "bot_13", imageUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Wei Chen", locked: true },
];

interface PlayWithAIProps {
  onPlayBot: (botId: string, elo: number) => void;
}

export function PlayWithAI({ onPlayBot }: PlayWithAIProps) {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<'all' | 'beginner' | 'intermediate' | 'master'>('all');

  const filteredBots = bots.filter(bot => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'beginner') return bot.elo <= 1000;
    if (activeFilter === 'intermediate') return bot.elo > 1000 && bot.elo <= 2000;
    if (activeFilter === 'master') return bot.elo > 2000;
    return true;
  });

  const botDescriptions = (t.play_ai.bot_descriptions || {}) as Record<string, string>;

  return (
    <main className="ml-64 w-[calc(100%-16rem)] min-h-screen flex flex-col pb-16 bg-[#0c141a]">
      {/* Header Banner */}
      <header className="w-full bg-[#192027] border-b border-[#414942] px-16 py-10 flex flex-col relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-cover bg-center"
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBVoWVty5uaR_chmYwEeuQGtTvq-WDwV9BXvb2R7sQQ2O9ChksYDzCgweeDL2WHDXThlYZFG3H9kUTpLG_QV_gAxhKRDMIRJTz39WjGRew9QdddKVa2BWSv91zRKQxGPU2Vgx0BYVmLQ-Iw2bpS3IqsqZwsRJFmzv4Q0Q552pBrdTVL56ZunysISIx2GrTDL8Z-uozI4nhIwZrXqWopUMVT8Hz6pF6s1aq95X3MOSbknuCjBGAVUlVoPw')" }}
        ></div>

        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-2">
            <span className="material-symbols-outlined text-[#a8d638] text-4xl">smart_toy</span>
            <h1 className="text-4xl font-extrabold tracking-tight text-white">{t.play_ai.title}</h1>
          </div>
          <p className="text-[#c1c9c0] font-medium max-w-2xl text-base mt-2">
            {t.play_ai.subtitle}
          </p>
        </div>

        {/* Difficulty Filter Pills */}
        <div className="flex space-x-4 relative z-10 mt-8">
          {(['all', 'beginner', 'intermediate', 'master'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-6 py-2 rounded-full border text-xs font-mono font-semibold uppercase tracking-wider transition-colors ${
                activeFilter === filter
                  ? 'border-[#a8d638] bg-[#a8d638]/10 text-[#a8d638]'
                  : 'border-[#414942] bg-[#0c141a] text-[#c1c9c0] hover:bg-[#232b31]'
              }`}
            >
              {t.play_ai[`filter_${filter}` as keyof typeof t.play_ai] as string}
            </button>
          ))}
        </div>
      </header>

      {/* Bot Grid */}
      <div className="px-16 py-12 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filteredBots.map((bot) => (
            <div
              key={bot.id}
              className="relative bg-[#192027] rounded-xl border border-[#414942] p-8 flex flex-col items-center hover:-translate-y-1 transition-transform duration-300 group overflow-hidden shadow-lg"
            >
              {/* Hover Glow */}
              <div className="absolute inset-0 bg-[#a8d638] opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 pointer-events-none"></div>

              {/* Country indicator */}
              <div className="absolute top-4 left-4 flex flex-col items-center gap-1 z-20">
                 <span className="text-[10px] font-mono font-bold text-[#c1c9c0] uppercase tracking-wider bg-[#0c141a]/80 px-2 py-0.5 rounded border border-[#414942]">
                    {bot.country}
                 </span>
              </div>

              {/* Fire Icon for popular bot (1500 Elo) */}
              {bot.elo === 1500 && (
                <div className="absolute top-4 right-4 text-[#a8d638] bg-[#a8d638]/20 rounded-full p-1.5 z-20" title={t.play_ai.popular}>
                  <span className="material-symbols-outlined text-[18px]">local_fire_department</span>
                </div>
              )}

              <div className={`w-24 h-24 rounded-full overflow-hidden border-2 mb-4 relative z-10 transition-colors bg-[#0c141a] ${
                bot.elo >= 2000 ? 'border-[#a8d638] shadow-[0_0_15px_rgba(168,214,56,0.3)]' : 'border-[#414942] group-hover:border-[#a8d638]'
              }`}>
                <img className="w-full h-full object-cover p-2" src={bot.imageUrl} alt={bot.name} />
              </div>

              <div className="text-center z-10 mb-auto">
                <h3 className="text-lg font-bold text-[#dbe3ec] mb-1">{bot.name}</h3>
                <p className="text-[13px] text-[#c1c9c0] leading-relaxed line-clamp-3 min-h-[60px]">
                  {botDescriptions[bot.descriptionKey] || bot.descriptionKey}
                </p>
              </div>

              <div className="w-full flex items-center justify-between mt-6 z-10">
                <div className={`text-[11px] font-mono font-bold px-2 py-1 rounded ${
                  bot.elo >= 1500 ? 'text-[#a8d638] bg-[#a8d638]/10 border border-[#a8d638]/30' : 'text-[#c1c9c0] bg-[#2e363c]'
                }`}>
                  {t.play_ai.elo_label.replace('{elo}', String(bot.elo))}
                </div>

                {bot.locked ? (
                  <button disabled className="px-4 py-1.5 bg-[#0c141a] border border-[#414942] rounded-lg font-bold text-xs text-[#dbe3ec] opacity-60 flex items-center cursor-not-allowed">
                    <span className="material-symbols-outlined text-[14px] mr-1">lock</span> {t.play_ai.locked}
                  </button>
                ) : (
                  <button
                    onClick={() => onPlayBot(bot.id.toString(), bot.elo)}
                    className="px-5 py-1.5 rounded-lg font-bold text-xs transition-all shadow-md bg-[#0c141a] border border-[#414942] text-[#dbe3ec] hover:bg-[#a8d638] hover:text-[#263500] hover:border-[#a8d638]"
                  >
                    {t.play_ai.play}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
