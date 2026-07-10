'use client';

import React, { useEffect, useState } from 'react';

interface Platform {
  type: string;
  stream_url: string;
  channel_url: string;
  is_live: boolean;
  is_main_live_platform: boolean;
}

interface Streamer {
  username: string;
  avatar: string;
  twitch_url: string;
  url: string;
  is_live: boolean;
  is_community_streamer: boolean;
  platforms: Platform[];
}

export function LiveStreamers() {
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [loading, setLoading] = useState(true);
  const [hostname, setHostname] = useState('localhost');
  const [loadedCount, setLoadedCount] = useState(0);

  useEffect(() => {
    setHostname(window.location.hostname);
    
    const fetchStreamers = async () => {
      try {
        const res = await fetch('https://api.chess.com/pub/streamers');
        const data = await res.json();
        const live = (data.streamers || []).filter((s: Streamer) => s.is_live);
        setStreamers(live);
        if (live.length > 0) {
          setLoadedCount(1); // start loading the first one
        }
      } catch (e) {
        console.error('Failed to fetch streamers', e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStreamers();
  }, []);

  // Staggered loading of iframes to prevent browser freeze
  useEffect(() => {
    if (streamers.length > 0 && loadedCount > 0 && loadedCount < streamers.length) {
      const timer = setTimeout(() => {
        setLoadedCount(prev => prev + 1);
      }, 2000); // 2 second delay between loading each stream
      return () => clearTimeout(timer);
    }
  }, [streamers.length, loadedCount]);

  const getTwitchEmbedUrl = (channelUrl: string) => {
    try {
      const channel = channelUrl.split('/').filter(Boolean).pop();
      if (!channel) return null;
      return `https://player.twitch.tv/?channel=${channel}&parent=${hostname}&muted=true&autoplay=true`;
    } catch {
      return null;
    }
  };

  return (
    <div className="w-full h-full bg-[#0c141a] text-[#dbe3ec] p-8 overflow-y-auto custom-scrollbar relative">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header Section */}
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-4">
              Live Arena
              <span className="flex items-center gap-2 text-xs font-bold bg-red-500/10 text-red-500 px-3 py-1.5 rounded-full border border-red-500/20">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                LIVE NOW
              </span>
            </h1>
            <p className="text-on-surface-variant mt-2 font-medium">
              Watch top Grandmasters and the Chess community play right now.
            </p>
          </div>
          <div className="bg-surface-container-high px-4 py-2 rounded-xl border border-outline-variant flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">group</span>
            <span className="font-mono font-bold text-secondary">{streamers.length}</span>
            <span className="text-sm font-medium text-on-surface-variant">Streamers</span>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
            <span className="w-10 h-10 rounded-full border-4 border-surface-container-highest border-t-secondary animate-spin"></span>
            <p className="text-on-surface-variant font-medium animate-pulse">Locating active broadcasts...</p>
          </div>
        ) : streamers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] gap-4 bg-surface-container-lowest border border-outline-variant rounded-3xl">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant opacity-50">videocam_off</span>
            <p className="text-on-surface-variant font-medium">No streamers are live right now. Check back later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {streamers.map((streamer, idx) => {
              const livePlatform = streamer.platforms.find(p => p.is_main_live_platform) || streamer.platforms[0];
              const isTwitch = livePlatform?.type === 'twitch';
              const embedUrl = isTwitch ? getTwitchEmbedUrl(livePlatform.channel_url) : null;
              
              const shouldLoadIframe = idx < loadedCount;

              return (
                <div 
                  key={`${streamer.username}-${idx}`} 
                  className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden group hover:border-secondary/50 transition-all shadow-lg hover:shadow-[0_8px_30px_rgba(168,214,56,0.15)] flex flex-col"
                >
                  {/* Video Player / Thumbnail Area */}
                  <div className="relative w-full aspect-video bg-black overflow-hidden border-b border-outline-variant">
                    {embedUrl && shouldLoadIframe ? (
                      <iframe
                        src={embedUrl}
                        height="100%"
                        width="100%"
                        allowFullScreen
                        className="absolute inset-0 border-0 animate-fadeIn"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-surface-container-highest to-[#070f15]">
                        <img 
                          src={streamer.avatar || 'https://www.chess.com/bundles/web/images/user-image.svg'} 
                          alt={streamer.username} 
                          className="w-16 h-16 rounded-full shadow-2xl mb-3 opacity-60"
                        />
                        {embedUrl && idx === loadedCount ? (
                          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md">
                            <span className="w-3 h-3 rounded-full border-2 border-white/20 border-t-secondary animate-spin"></span>
                            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                              Loading Stream...
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
                            {embedUrl ? 'Queued' : 'Preview Unavailable'}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Live Badge Overlay */}
                    <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded shadow-lg flex items-center gap-1.5 z-10 pointer-events-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                      LIVE
                    </div>
                  </div>

                  {/* Streamer Info Area */}
                  <div className="p-5 flex items-start gap-4 bg-surface-container-lowest group-hover:bg-surface-container-highest/30 transition-colors">
                    <img 
                      src={streamer.avatar || 'https://www.chess.com/bundles/web/images/user-image.svg'} 
                      alt={streamer.username}
                      className="w-12 h-12 rounded-full border-2 border-outline-variant group-hover:border-secondary transition-colors shadow-md"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-lg truncate flex items-center gap-2">
                        {streamer.username}
                        {streamer.is_community_streamer && (
                          <span className="material-symbols-outlined text-sm text-blue-400" title="Community Streamer">verified</span>
                        )}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-medium text-on-surface-variant capitalize px-2 py-0.5 bg-surface-container-high rounded-md border border-outline-variant">
                          {livePlatform?.type || 'Unknown Platform'}
                        </span>
                      </div>
                    </div>
                    
                    <a
                      href={streamer.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary hover:bg-secondary hover:text-on-secondary transition-all shrink-0"
                      title="View Profile"
                    >
                      <span className="material-symbols-outlined text-xl">open_in_new</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
