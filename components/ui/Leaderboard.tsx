'use client';

import React, { useEffect, useState } from 'react';

interface LeaderboardPlayer {
  player_id: number;
  username: string;
  score: number;
  rank: number;
  name?: string;
  avatar?: string;
  country: string;
  title?: string;
  url: string;
}

export function Leaderboard() {
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('https://api.chess.com/pub/leaderboards');
        const data = await response.json();
        // Just take the 'daily' leaderboard
        if (data && data.daily) {
          setPlayers(data.daily);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#070f15]/50 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#a8d638]/30 border-t-[#a8d638] rounded-full animate-spin shadow-[0_0_15px_rgba(168,214,56,0.5)]"></div>
          <span className="text-[#a8d638] font-bold text-lg tracking-widest animate-pulse">LOADING LEADERBOARD...</span>
        </div>
      </div>
    );
  }

  // Get country code from api url: "https://api.chess.com/pub/country/US" -> "us"
  const getCountryCode = (url: string) => {
    const parts = url.split('/');
    return parts[parts.length - 1].toLowerCase();
  };

  return (
    <div className="w-full h-full overflow-y-auto custom-scrollbar p-10 flex justify-center bg-gradient-to-br from-[#070f15] to-[#0c141a]">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#a8d638] to-[#d4ff63] drop-shadow-[0_0_20px_rgba(168,214,56,0.3)] mb-3 tracking-tighter">
            GLOBAL RANKINGS
          </h1>
          <p className="text-[#8e9a92] text-lg font-medium">Top players from around the world in Daily Chess</p>
        </div>

        <div className="bg-[#0c141a]/80 backdrop-blur-xl border border-[#2a3431] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-[#2a3431] bg-[#111a22] text-[#8e9a92] text-xs font-bold uppercase tracking-wider sticky top-0 z-10">
            <div className="col-span-1 text-center">Rank</div>
            <div className="col-span-6 md:col-span-4">Player</div>
            <div className="col-span-2 hidden md:block">Country</div>
            <div className="col-span-3 md:col-span-3 text-right">Rating</div>
            <div className="col-span-2 hidden md:block text-right">Title</div>
          </div>

          {/* Player List */}
          <div className="flex flex-col">
            {players.map((player, index) => (
              <div 
                onClick={() => window.open(player.url, '_blank')}
                key={player.player_id}
                className={`grid grid-cols-12 gap-4 px-8 py-4 items-center group transition-all duration-300 hover:bg-[#1a2520]/80 border-b border-[#2a3431]/50 last:border-0 ${
                  index < 3 ? 'bg-[#111a22]/30' : ''
                }`}
              >
                {/* Rank */}
                <div className="col-span-1 flex justify-center">
                  <span className={`text-xl font-black ${
                    index === 0 ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]' :
                    index === 1 ? 'text-gray-300 drop-shadow-[0_0_10px_rgba(209,213,219,0.5)]' :
                    index === 2 ? 'text-amber-600 drop-shadow-[0_0_10px_rgba(217,119,6,0.5)]' :
                    'text-[#4a5551]'
                  }`}>
                    #{player.rank}
                  </span>
                </div>

                {/* Player Info */}
                <div className="col-span-6 md:col-span-4 flex items-center gap-4">
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${
                      index < 3 ? 'border-[#a8d638] shadow-[0_0_15px_rgba(168,214,56,0.3)]' : 'border-[#2a3431]'
                    } transition-colors group-hover:border-[#a8d638]`}>
                      <img 
                        src={player.avatar || `https://ui-avatars.com/api/?name=${player.username}&background=2a3431&color=a8d638`} 
                        alt={player.username}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${player.username}&background=2a3431&color=a8d638`;
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-base truncate group-hover:text-[#a8d638] transition-colors">
                      {player.username}
                    </span>
                    <span className="text-[#8e9a92] text-xs font-medium truncate">
                      {player.name || 'Unknown'}
                    </span>
                  </div>
                </div>

                {/* Country */}
                <div className="col-span-2 hidden md:flex items-center gap-2">
                  <img 
                    src={`https://flagcdn.com/w20/${getCountryCode(player.country)}.png`}
                    alt="country"
                    className="w-5 h-auto rounded-sm opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  <span className="text-[#8e9a92] text-xs font-bold uppercase">{getCountryCode(player.country)}</span>
                </div>

                {/* Rating */}
                <div className="col-span-3 md:col-span-3 flex justify-end">
                  <div className="bg-[#111a22] group-hover:bg-[#a8d638]/10 border border-[#2a3431] group-hover:border-[#a8d638]/30 px-4 py-1.5 rounded-xl transition-all">
                    <span className="text-[#a8d638] font-black text-lg font-mono tracking-tight">{player.score}</span>
                  </div>
                </div>

                {/* Title */}
                <div className="col-span-2 hidden md:flex justify-end">
                  {player.title ? (
                    <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-black rounded uppercase border border-red-500/30">
                      {player.title}
                    </span>
                  ) : (
                    <span className="text-[#4a5551] text-xs font-medium">-</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
