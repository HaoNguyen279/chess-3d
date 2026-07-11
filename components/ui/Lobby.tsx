'use client';

import React, { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, push, set, update, get } from 'firebase/database';
import { parseTimeControl } from '@/store/useChessStore';
import { LobbyModel } from './LobbyModel';
import { PlayWithAI } from './PlayWithAI';
import { Leaderboard } from './Leaderboard';
import { LiveStreamers } from './LiveStreamers';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface Room {
  id: string;
  roomName: string;
  password: string;
  playerCount: number;
  status: 'waiting' | 'playing';
  players: {
    white?: string;
    black?: string;
  };
  timeControl?: string;
}

interface LobbyProps {
  onJoinRoom: (roomId: string, color: 'w' | 'b') => void;
  onStartOffline?: (timeControl: string) => void;
  onPlayBot?: (botId: string, elo: number) => void;
}

export function Lobby({ onJoinRoom, onStartOffline, onPlayBot }: LobbyProps) {
  const { t } = useLanguage();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomName, setRoomName] = useState('');
  const [password, setPassword] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [userId, setUserId] = useState('');
  const [showNoRoomModal, setShowNoRoomModal] = useState(false);

  // Selected time control (default to '10 min' )
  const [selectedControl, setSelectedControl] = useState<string>('10 min');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [currentTab, setCurrentTab] = useState<'play' | 'ai' | 'leaderboard' | 'watch'>('play');

  useEffect(() => {
    let storedUserId = localStorage.getItem('chess_user_id');
    if (!storedUserId) {
      storedUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chess_user_id', storedUserId);
    }
    setUserId(storedUserId);

    const roomsRef = ref(database, 'rooms');
    const unsubscribe = onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const roomsList: Room[] = Object.entries(data).map(([id, room]: [string, any]) => ({
          id,
          ...room,
        }));
        setRooms(roomsList.filter((r) => r.status === 'waiting'));
      } else {
        setRooms([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      alert(t.lobby.alert_enter_room_name);
      return;
    }

    const roomsRef = ref(database, 'rooms');
    const newRoomRef = push(roomsRef);
    const roomId = newRoomRef.key!;

    const config = parseTimeControl(selectedControl);
    await set(newRoomRef, {
      roomName: roomName.trim(),
      password: password.trim(),
      playerCount: 1,
      status: 'waiting',
      players: {
        white: userId,
      },
      timeControl: selectedControl,
      clocks: {
        white: config.time,
        black: config.time,
        lastMoveTime: Date.now()
      },
      gameState: {
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        turn: 'w',
        lastMove: null,
      },
    });

    setShowCreateModal(false);
    setRoomName('');
    setPassword('');
    onJoinRoom(roomId, 'w');
  };

  const handleJoinRoom = async () => {
    if (!selectedRoom || !joinPassword.trim()) {
      alert(t.lobby.alert_enter_password);
      return;
    }

    const roomRef = ref(database, `rooms/${selectedRoom.id}`);
    const snapshot = await get(roomRef);
    const roomData = snapshot.val();

    if (!roomData) {
      alert(t.lobby.alert_room_not_found);
      return;
    }

    if (roomData.password !== joinPassword.trim()) {
      alert(t.lobby.alert_wrong_password);
      setJoinPassword('');
      return;
    }

    if (roomData.playerCount >= 2) {
      alert(t.lobby.alert_room_full);
      return;
    }

    await update(roomRef, {
      playerCount: 2,
      'players/black': userId,
      status: 'playing',
      'clocks/lastMoveTime': Date.now()
    });

    setShowJoinModal(false);
    setShowSearchModal(false);
    setJoinPassword('');
    onJoinRoom(selectedRoom.id, 'b');
  };

  const handleDirectJoin = async (room: Room) => {
    if (room.playerCount >= 2) {
      alert(t.lobby.alert_room_full);
      return;
    }
    try {
      const roomRef = ref(database, `rooms/${room.id}`);
      await update(roomRef, {
        playerCount: 2,
        'players/black': userId,
        status: 'playing',
        'clocks/lastMoveTime': Date.now()
      });
      onJoinRoom(room.id, 'b');
    } catch (e) {
      console.error('Lỗi khi vào phòng:', e);
      alert(t.lobby.alert_join_error);
    }
  };

  const handlePlayNow = async () => {
    const roomsRef = ref(database, 'rooms');
    try {
      const snapshot = await get(roomsRef);
      const data = snapshot.val();

      let matchedRoom: Room | null = null;
      if (data) {
        const roomsList: Room[] = Object.entries(data).map(([id, r]: [string, any]) => ({
          id,
          ...r,
        }));

        // Find public room with same mode, only 1 player, waiting
        matchedRoom = roomsList.find((r) =>
          r.status === 'waiting' &&
          r.playerCount === 1 &&
          r.timeControl === selectedControl &&
          (!r.password || r.password.trim() === '') &&
          r.players?.white !== userId
        ) || null;
      }

      if (matchedRoom) {
        await handleDirectJoin(matchedRoom);
      } else {
        setShowNoRoomModal(true);
      }
    } catch (error) {
      console.error('Lỗi matchmaking:', error);
      alert(t.lobby.alert_join_error);
    }
  };

  const handleAutoCreateRoom = async () => {
    const roomsRef = ref(database, 'rooms');
    const newRoomRef = push(roomsRef);
    const roomId = newRoomRef.key!;
    const config = parseTimeControl(selectedControl);

    try {
      await set(newRoomRef, {
        roomName: `Quick Match ${selectedControl}`,
        password: '',
        playerCount: 1,
        status: 'waiting',
        players: {
          white: userId,
        },
        timeControl: selectedControl,
        clocks: {
          white: config.time,
          black: config.time,
          lastMoveTime: Date.now()
        },
        gameState: {
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          turn: 'w',
          lastMove: null,
        },
      });

      setShowNoRoomModal(false);
      onJoinRoom(roomId, 'w');
    } catch (error) {
      console.error('Lỗi tự động tạo phòng:', error);
      alert(t.lobby.alert_create_error);
    }
  };

  const handleJoinByCode = async () => {
    const code = roomCodeInput.trim();
    if (!code) {
      alert(t.lobby.alert_enter_room_name);
      return;
    }

    try {
      const roomRef = ref(database, `rooms/${code}`);
      const snapshot = await get(roomRef);
      const roomData = snapshot.val();

      if (!roomData) {
        alert(t.lobby.alert_room_not_found);
        return;
      }

      if (roomData.playerCount >= 2) {
        alert(t.lobby.alert_room_full);
        return;
      }

      // Join room directly without password check!
      await update(roomRef, {
        playerCount: 2,
        'players/black': userId,
        status: 'playing',
        'clocks/lastMoveTime': Date.now()
      });

      setShowSearchModal(false);
      setRoomCodeInput('');
      onJoinRoom(code, 'b');
    } catch (error) {
      console.error('Lỗi khi vào phòng bằng mã:', error);
      alert(t.lobby.alert_join_error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c141a] text-[#dbe3ec] font-sans overflow-hidden w-full relative">

      {/* Styles Injected to ensure exact styling behavior */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=JetBrains+Mono:wght@500&display=swap');

        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            display: inline-block;
            line-height: 1;
        }
        .wood-texture {
            background-image: url("https://www.transparenttextures.com/patterns/wood-pattern.png");
            opacity: 0.05;
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #414942;
            border-radius: 10px;
        }
        @keyframes slow-rotate {
            from { transform: perspective(1000px) rotateY(0deg); }
            to { transform: perspective(1000px) rotateY(360deg); }
        }
        .animate-slow-rotate {
            animation: slow-rotate 20s linear infinite;
        }
        @keyframes scaleUp {
            from { transform: scale(0.9) translateY(10px); opacity: 0; }
            to { transform: scale(1) translateY(0); opacity: 1; }
        }
        .animate-scaleUp {
            animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .mode-card {
            background: rgba(21, 28, 35, 0.6);
            border: 1px solid #414942;
            transition: all 0.2s ease;
        }
        .mode-card:hover {
            border-color: #a8d638;
            background: rgba(168, 214, 56, 0.05);
        }
        .mode-card.active {
            border-color: #a8d638;
            background: rgba(168, 214, 56, 0.1);
            box-shadow: 0 0 15px rgba(168, 214, 56, 0.2);
        }
        
        /* Local Tailwind Color fallbacks */
        .bg-background { background-color: #0c141a; }
        .bg-surface-container-lowest { background-color: #070f15; }
        .bg-surface-container-highest { background-color: #2e363c; }
        .bg-surface-container-high { background-color: #232b31; }
        .bg-secondary { background-color: #a8d638; }
        .bg-secondary-container-20 { background-color: rgba(168, 214, 56, 0.2); }
        .text-secondary { color: #a8d638; }
        .text-on-secondary { color: #263500; }
        .text-on-surface { color: #dbe3ec; }
        .text-on-surface-variant { color: #c1c9c0; }
        .border-outline-variant { border-color: #414942; }
      ` }} />

      {/* Persistent SideNavBar */}
      <aside className="h-screen w-64 fixed left-0 top-0 flex flex-col py-6 px-4 bg-surface-container-lowest border-r border-outline-variant z-30">
        <div className="mb-12 px-2">
          <h1 className="text-2xl font-black text-secondary tracking-wide">{t.lobby.brand}</h1>
        </div>
        <nav className="flex-1 space-y-1">
          <a
            className={`flex items-center gap-3 px-3 py-2 rounded font-bold transition-all duration-200 cursor-pointer ${currentTab === 'play' ? 'text-secondary border-l-4 border-secondary bg-secondary-container-20' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'}`}
            onClick={() => setCurrentTab('play')}
          >
            <span className="material-symbols-outlined">videogame_asset</span>
            <span className="text-xs font-medium tracking-wide">{t.lobby.nav_play}</span>
          </a>
          <a className={`flex items-center gap-3 px-3 py-2 rounded font-medium transition-colors duration-200 ${currentTab === 'ai' ? 'bg-secondary/10 text-secondary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'}`} href="#" onClick={(e) => { e.preventDefault(); setCurrentTab('ai'); }}>
            <span className="material-symbols-outlined">smart_toy</span>
            <span className="text-xs font-medium tracking-wide">{t.lobby.nav_play_ai}</span>
          </a>
          <a className={`flex items-center gap-3 px-3 py-2 rounded font-medium transition-colors duration-200 ${currentTab === 'leaderboard' ? 'bg-secondary/10 text-secondary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'}`} href="#" onClick={(e) => { e.preventDefault(); setCurrentTab('leaderboard'); }}>
            <span className="material-symbols-outlined">leaderboard</span>
            <span className="text-xs font-medium tracking-wide">{t.lobby.nav_leaderboard}</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 rounded text-on-surface-variant font-medium hover:text-on-surface hover:bg-surface-container-highest transition-colors duration-200" href="#" onClick={(e) => { e.preventDefault(); alert(t.lobby.coming_soon_tutorials); }}>
            <span className="material-symbols-outlined">school</span>
            <span className="text-xs font-medium tracking-wide">{t.lobby.nav_learn}</span>
          </a>
          <a className={`flex items-center gap-3 px-3 py-2 rounded font-medium transition-colors duration-200 ${currentTab === 'watch' ? 'bg-secondary/10 text-secondary' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'}`} href="#" onClick={(e) => { e.preventDefault(); setCurrentTab('watch'); }}>
            <span className="material-symbols-outlined">visibility</span>
            <span className="text-xs font-medium tracking-wide">{t.lobby.nav_watch}</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 rounded text-on-surface-variant font-medium hover:text-on-surface hover:bg-surface-container-highest transition-colors duration-200" href="#" onClick={(e) => { e.preventDefault(); alert(t.lobby.coming_soon_news); }}>
            <span className="material-symbols-outlined">newspaper</span>
            <span className="text-xs font-medium tracking-wide">{t.lobby.nav_news}</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 rounded text-on-surface-variant font-medium hover:text-on-surface hover:bg-surface-container-highest transition-colors duration-200" href="#" onClick={(e) => { e.preventDefault(); alert(t.lobby.coming_soon_social); }}>
            <span className="material-symbols-outlined">group</span>
            <span className="text-xs font-medium tracking-wide">{t.lobby.nav_social}</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 rounded text-on-surface-variant font-medium hover:text-on-surface hover:bg-surface-container-highest transition-colors duration-200" href="#" onClick={(e) => { e.preventDefault(); alert(t.lobby.coming_soon_settings); }}>
            <span className="material-symbols-outlined">settings</span>
            <span className="text-xs font-medium tracking-wide">{t.lobby.nav_settings}</span>
          </a>
        </nav>

        <div className="mt-auto space-y-4">
          <div className="flex justify-center px-2">
            <LanguageSwitcher />
          </div>
          <button
            onClick={() => setShowDonateModal(true)}
            className="w-full py-3 bg-secondary text-on-secondary rounded-lg font-bold hover:brightness-110 transition-all shadow-[0_0_20px_rgba(168,214,56,0.3)] text-sm flex items-center justify-center gap-1.5"
          >
            <span>{t.lobby.donate}</span>
            <span>{t.lobby.donate_heart}</span>
          </button>

          <div className="flex flex-col gap-2 pt-4 border-t border-outline-variant">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant overflow-hidden">
                <img className="w-full h-full object-cover" alt="User Avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOwVmu_Iye4ORXrmbBTLClBuINeL-HKT7YJg5NYxzROjWif2eZLktNTI2it43ZmL2jKywk2rrWh05kK_AAI6ngV2jLRPIP8pHdfHPdXyD1tQkVasxnclFUCjen9B0u2zHxJQKxBGC1rBeq8Yw0iq9W50-EJmANKV6VxhR0rUA6pQIoncd7g3u1yk04GHGKp3Z2xDc9DAGl5Qc5BV8kLk0G1mcF1YotKWv4f7lJ-Lss9aqnaXeCHJjFtg" />
              </div>
              <div>
                <p className="text-sm font-semibold truncate w-32">Pro hacker</p>
                <p className="text-[10px] font-mono text-secondary">{t.lobby.user_elo.replace('{elo}', '69696')}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {currentTab === 'leaderboard' ? (
        <main className="ml-64 h-screen overflow-hidden relative z-10">
          <Leaderboard />
        </main>
      ) : currentTab === 'ai' ? (
        <PlayWithAI onPlayBot={(botId, elo) => {
          onPlayBot?.(botId, elo);
        }} />
      ) : currentTab === 'watch' ? (
        <main className="ml-64 h-screen overflow-hidden relative z-10">
          <LiveStreamers />
        </main>
      ) : (
        <>
          {/* Main Content Area */}
          <main className="ml-64 mr-[400px] h-screen flex flex-col p-16 gap-10 items-center justify-center relative">
            {/* Center: 3D Chess Set Showcase */}
            <div className="relative w-full max-w-3xl aspect-square flex items-center justify-center select-none">
              <div className="absolute inset-0 bg-secondary/5 rounded-full blur-[120px] pointer-events-none"></div>
              <div className="w-full h-full relative z-10">
                <LobbyModel />
              </div>
            </div>

            <div className="text-center z-10">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">{t.lobby.welcome_title}</h2>
              <p className="text-on-surface-variant font-medium opacity-70">{t.lobby.welcome_subtitle}</p>
            </div>
          </main>

          {/* Right Sidebar: Lobby & Game Modes */}
          {currentTab === 'play' && (
            <aside className="w-[400px] fixed right-0 top-0 h-screen bg-surface-container-lowest border-l border-outline-variant p-6 flex flex-col gap-6 z-20 overflow-y-auto custom-scrollbar">
              {/* Mode Selection Grid */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <h3 className="text-[20px] font-black uppercase tracking-widest text-secondary">{t.lobby.select_mode}</h3>
                  <span className="material-symbols-outlined text-sm text-secondary">schedule</span>
                </div>

                {/* Bullet */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-secondary/70">
                    <span className="material-symbols-outlined text-sm">rocket_launch</span>
                    <span className="text-[10px] font-black uppercase tracking-wider">{t.lobby.bullet}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div
                      className={`mode-card rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer ${selectedControl === '1 min' ? 'active' : ''}`}
                      onClick={() => setSelectedControl('1 min')}
                    >
                      <span className="material-symbols-outlined text-secondary text-lg mb-1">rocket_launch</span>
                      <p className="font-bold text-sm">{t.lobby.time_1min}</p>
                      <p className="text-[10px] opacity-50">{t.lobby.bullet}</p>
                    </div>
                    <div
                      className={`mode-card rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer ${selectedControl === '1 | 1' ? 'active' : ''}`}
                      onClick={() => setSelectedControl('1 | 1')}
                    >
                      <span className="material-symbols-outlined text-secondary text-lg mb-1">rocket_launch</span>
                      <p className="font-bold text-sm">{t.lobby.time_1_1}</p>
                      <p className="text-[10px] opacity-50">{t.lobby.bullet}</p>
                    </div>
                    <div
                      className={`mode-card rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer ${selectedControl === '2 | 1' ? 'active' : ''}`}
                      onClick={() => setSelectedControl('2 | 1')}
                    >
                      <span className="material-symbols-outlined text-secondary text-lg mb-1">rocket_launch</span>
                      <p className="font-bold text-sm">{t.lobby.time_2_1}</p>
                      <p className="text-[10px] opacity-50">{t.lobby.bullet}</p>
                    </div>
                  </div>
                </div>

                {/* Blitz */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-secondary/70">
                    <span className="material-symbols-outlined text-sm">bolt</span>
                    <span className="text-[10px] font-black uppercase tracking-wider">{t.lobby.blitz}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div
                      className={`mode-card rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer h-20 ${selectedControl === '3 min' ? 'active' : ''}`}
                      onClick={() => setSelectedControl('3 min')}
                    >
                      <span className="material-symbols-outlined text-secondary text-lg mb-1">bolt</span>
                      <p className="font-bold text-sm">{t.lobby.time_3min}</p>
                      <p className="text-[10px] opacity-50">{t.lobby.blitz}</p>
                    </div>
                    <div
                      className={`mode-card rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer h-20 ${selectedControl === '3 | 2' ? 'active' : ''}`}
                      onClick={() => setSelectedControl('3 | 2')}
                    >
                      <span className="material-symbols-outlined text-secondary text-lg mb-1">bolt</span>
                      <p className="font-bold text-sm">{t.lobby.time_3_2}</p>
                      <p className="text-[10px] opacity-50">{t.lobby.blitz}</p>
                    </div>
                    <div
                      className={`mode-card rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer h-20 ${selectedControl === '5 min' ? 'active' : ''}`}
                      onClick={() => setSelectedControl('5 min')}
                    >
                      <span className="material-symbols-outlined text-secondary text-lg mb-1">bolt</span>
                      <p className="font-bold text-sm">{t.lobby.time_5min}</p>
                      <p className="text-[10px] opacity-50">{t.lobby.blitz}</p>
                    </div>
                    <div
                      className={`mode-card rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer h-20 ${selectedControl === '5 | 5' ? 'active' : ''}`}
                      onClick={() => setSelectedControl('5 | 5')}
                    >
                      <span className="material-symbols-outlined text-secondary text-lg mb-1">bolt</span>
                      <p className="font-bold text-sm">{t.lobby.time_5_5}</p>
                      <p className="text-[10px] opacity-50">{t.lobby.blitz}</p>
                    </div>
                  </div>
                </div>

                {/* Rapid */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-secondary/70">
                    <span className="material-symbols-outlined text-sm">pace</span>
                    <span className="text-[10px] font-black uppercase tracking-wider">{t.lobby.rapid}</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <div
                      className={`mode-card rounded-lg p-3 flex items-center justify-between cursor-pointer px-4 ${selectedControl === '10 min' ? 'active' : ''}`}
                      onClick={() => setSelectedControl('10 min')}
                    >
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-secondary">pace</span>
                        <p className="font-bold text-sm">{t.lobby.time_10min}</p>
                      </div>
                      <p className="text-[10px] opacity-50">{t.lobby.rapid}</p>
                    </div>
                    <div
                      className={`mode-card rounded-lg p-3 flex items-center justify-between cursor-pointer px-4 ${selectedControl === '15 | 10' ? 'active' : ''}`}
                      onClick={() => setSelectedControl('15 | 10')}
                    >
                      <div className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-secondary">pace</span>
                        <p className="font-bold text-sm">{t.lobby.time_15_10}</p>
                      </div>
                      <p className="text-[10px] opacity-50">{t.lobby.rapid}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Functional Lobby Buttons */}
              <section className="mt-4 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mode-card flex flex-col items-center justify-center gap-1 py-3 border border-outline-variant text-on-surface rounded-xl hover:bg-surface-container-highest transition-all group"
                  >
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-secondary">add_circle</span>
                    <span className="text-[11px] font-bold">{t.lobby.create_room}</span>
                  </button>

                  <button
                    onClick={() => setShowSearchModal(true)}
                    className="mode-card flex flex-col items-center justify-center gap-1 py-3 border border-outline-variant text-on-surface rounded-xl hover:bg-surface-container-highest transition-all group"
                  >
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-secondary">search</span>
                    <span className="text-[11px] font-bold">{t.lobby.find_room}</span>
                  </button>
                </div>

                <button
                  onClick={() => setCurrentTab('ai')}
                  className="mode-card w-full flex items-center justify-center gap-4 py-3 bg-surface-container-high border border-outline-variant text-on-surface rounded-xl hover:bg-surface-container-highest transition-all group"
                >
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-secondary">smart_toy</span>
                  <span className="text-sm font-bold">{t.lobby.play_ai}</span>
                </button>

                <button
                  onClick={() => onStartOffline?.(selectedControl)}
                  className="mode-card w-full flex items-center justify-center gap-4 py-3 bg-surface-container-high border border-outline-variant text-on-surface rounded-xl hover:bg-surface-container-highest transition-all group"
                >
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-secondary">groups</span>
                  <span className="text-sm font-bold">{t.lobby.offline_2p}</span>
                </button>

                <button
                  onClick={() => {
                    import('@/store/useChessStore').then(module => {
                      module.useChessStore.getState().startRandomPuzzle();
                    });
                  }}
                  className="mode-card w-full flex items-center justify-center gap-4 py-3 bg-secondary/10 border border-secondary/30 text-secondary rounded-xl hover:bg-secondary/20 transition-all group shadow-[0_0_15px_rgba(168,214,56,0.1)]"
                >
                  <span className="material-symbols-outlined text-secondary group-hover:scale-110 transition-transform">extension</span>
                  <span className="text-sm font-black tracking-wide">{t.lobby.random_puzzle}</span>
                </button>
              </section>

              {/* Quick Action Play Now */}
              <section>
                <button
                  onClick={handlePlayNow}
                  className="w-full py-6 bg-secondary text-on-secondary rounded-xl font-black text-xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_30px_rgba(168,214,56,0.2)] flex flex-col items-center gap-1"
                >
                  <span>{t.lobby.play_now}</span>
                  <span className="text-[10px] font-mono opacity-80 font-medium tracking-wider">{t.lobby.mode_label.replace('{mode}', selectedControl)}</span>
                </button>
              </section>

              {/* Promo Widget */}
              <section className="mt-auto pt-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-secondary/20 to-primary/10 border border-secondary/30">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="material-symbols-outlined text-secondary text-sm">trophy</span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-secondary">{t.lobby.grand_prix}</p>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mb-3 leading-relaxed">{t.lobby.arena_starts}</p>
                  <button className="w-full py-2 bg-white text-slate-900 rounded-lg font-bold text-xs hover:bg-secondary hover:text-on-secondary transition-colors">
                    {t.lobby.register_now}
                  </button>
                </div>
              </section>
            </aside>
          )}

          {/* Footer */}
          <footer className={`fixed bottom-0 left-64 ${currentTab === 'play' ? 'right-[400px]' : 'right-0'} py-2 bg-surface-container-lowest/50 backdrop-blur-sm border-t border-outline-variant z-10`}>
            <div className="flex justify-between items-center max-w-7xl mx-auto px-10">
              <span className="font-mono text-[10px] text-secondary">{t.lobby.copyright}</span>
              <div className="flex gap-4">
                <a className="text-[11px] text-on-surface-variant hover:text-secondary transition-all" href="#">{t.lobby.footer_language}</a>
                <a className="text-[11px] text-on-surface-variant hover:text-secondary transition-all" href="#">{t.lobby.footer_help}</a>
                <a className="text-[11px] text-on-surface-variant hover:text-secondary transition-all" href="#">{t.lobby.footer_about}</a>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* --- MODAL: CREATE ROOM --- */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-[#070f15]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#0c141a] border border-[#414942] rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <h2 className="text-xl font-bold mb-4 text-[#dbe3ec] flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">add_circle</span>
              {t.lobby.create_room_title}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#c1c9c0] mb-1.5">{t.lobby.room_name_label}</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#070f15]/50 border border-[#414942] rounded-xl focus:outline-none focus:border-secondary text-[#dbe3ec] text-sm transition-all"
                  placeholder={t.lobby.room_name_placeholder}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#c1c9c0] mb-1.5">{t.lobby.password_label}</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3 text-[#c1c9c0]">lock</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#070f15]/50 border border-[#414942] rounded-xl focus:outline-none focus:border-secondary text-[#dbe3ec] text-sm transition-all"
                    placeholder={t.lobby.password_placeholder}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-2">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setRoomName('');
                    setPassword('');
                  }}
                  className="flex-1 py-2.5 bg-[#232b31] hover:bg-[#2e363c] text-[#dbe3ec] font-bold rounded-xl transition-all text-sm"
                >
                  {t.lobby.cancel}
                </button>
                <button
                  onClick={handleCreateRoom}
                  className="flex-1 py-2.5 bg-secondary hover:brightness-110 text-on-secondary font-bold rounded-xl transition-all text-sm shadow-[0_0_15px_rgba(168,214,56,0.2)]"
                >
                  {t.lobby.create}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: SEARCH/LIST ROOMS --- */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-[#070f15]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#0c141a] border border-[#414942] rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#dbe3ec] flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">search</span>
                {t.lobby.room_list_title}
              </h2>
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-on-surface-variant hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Quick Join via Room Code */}
            <div className="mb-6 pb-6 border-b border-[#414942]">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#c1c9c0] mb-2">{t.lobby.join_by_code}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value)}
                  className="flex-1 px-4 py-2 bg-[#070f15]/50 border border-[#414942] rounded-xl focus:outline-none focus:border-secondary text-[#dbe3ec] text-sm transition-all"
                  placeholder={t.lobby.room_code_placeholder}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinByCode()}
                />
                <button
                  onClick={handleJoinByCode}
                  className="px-4 py-2 bg-secondary text-on-secondary font-bold rounded-xl hover:brightness-110 active:scale-95 transition-all text-sm shadow-[0_0_10px_rgba(168,214,56,0.2)]"
                >
                  {t.lobby.join_now}
                </button>
              </div>
            </div>

            <div className="max-h-[220px] overflow-y-auto custom-scrollbar space-y-2.5 pr-2">
              {rooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <span className="material-symbols-outlined text-3xl opacity-40 mb-2">groups</span>
                  <p className="text-sm">{t.lobby.no_rooms}</p>
                  <p className="text-xs opacity-75 mt-1">{t.lobby.create_one}</p>
                </div>
              ) : (
                rooms.map((room) => (
                  <div
                    key={room.id}
                    className="bg-[#151c23] border border-[#414942] p-4 rounded-xl flex justify-between items-center hover:border-secondary hover:bg-[#192027]/80 transition-all cursor-pointer group"
                    onClick={() => {
                      if (!room.password || room.password.trim() === '') {
                        handleDirectJoin(room);
                      } else {
                        setSelectedRoom(room);
                        setShowJoinModal(true);
                      }
                    }}
                  >
                    <div>
                      <h3 className="font-bold text-[#dbe3ec] group-hover:text-secondary transition-colors">
                        {room.roomName}
                        <span className="ml-2 text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono font-medium">
                          ⏱️ {room.timeControl || '10 min'}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">{t.lobby.players_count.replace('{count}', String(room.playerCount))}</p>
                    </div>
                    <div className="flex items-center gap-1 text-secondary font-bold text-sm">
                      <span>{t.lobby.enter_room}</span>
                      <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-0.5">chevron_right</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: JOIN ROOM --- */}
      {showJoinModal && selectedRoom && (
        <div className="fixed inset-0 bg-[#070f15]/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#0c141a] border border-[#414942] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-2 text-[#dbe3ec]">{t.lobby.join_room_title}</h2>
            <p className="text-sm text-[#c1c9c0] mb-4">
              {t.lobby.joining_room} <span className="text-secondary font-semibold">{selectedRoom.roomName}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#c1c9c0] mb-1.5">{t.lobby.room_password}</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-3 text-[#c1c9c0]">lock</span>
                  <input
                    type="password"
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#070f15]/50 border border-[#414942] rounded-xl focus:outline-none focus:border-secondary text-[#dbe3ec] text-sm transition-all"
                    placeholder={t.lobby.password_input_placeholder}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-2">
                <button
                  onClick={() => {
                    setShowJoinModal(false);
                    setJoinPassword('');
                    setSelectedRoom(null);
                  }}
                  className="flex-1 py-2.5 bg-[#232b31] hover:bg-[#2e363c] text-[#dbe3ec] font-bold rounded-xl transition-all text-sm"
                >
                  {t.lobby.cancel}
                </button>
                <button
                  onClick={handleJoinRoom}
                  className="flex-1 py-2.5 bg-secondary hover:brightness-110 text-on-secondary font-bold rounded-xl transition-all text-sm"
                >
                  {t.lobby.join_play}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: DONATE US --- */}
      {showDonateModal && (
        <div className="fixed inset-0 bg-[#070f15]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#0c141a] border border-[#414942] rounded-3xl p-8 w-full max-w-md shadow-2xl relative text-center animate-scaleUp">
            {/* Close Button on top right */}
            <button
              onClick={() => setShowDonateModal(false)}
              className="absolute top-4 right-4 text-[#c1c9c0] hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h2 className="text-2xl font-black mb-4 text-[#dbe3ec] flex items-center justify-center gap-2 mt-2">
              <span className="material-symbols-outlined text-red-500">favorite</span>
              {t.lobby.donate_title}
            </h2>

            {/* QR Image wrapper */}
            <div className="bg-white p-4 rounded-3xl inline-block mb-5 shadow-inner">
              <img
                src="/images/donate-qr-code.png"
                alt={t.lobby.donate_qr_alt}
                className="w-64 h-64 object-contain"
              />
            </div>

            {/* Thank you note */}
            <p className="text-sm text-[#c1c9c0] leading-relaxed max-w-xs mx-auto">
              {t.lobby.donate_message}
            </p>
          </div>
        </div>
      )}

      {/* --- MODAL: NO ROOM FOUND (MATCHMAKING AUTO CREATE) --- */}
      {showNoRoomModal && (
        <div className="fixed inset-0 bg-[#070f15]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#0c141a] border border-[#414942] rounded-3xl p-6 w-full max-w-sm shadow-2xl relative text-center animate-scaleUp">
            <h2 className="text-xl font-bold mb-4 text-[#dbe3ec] flex items-center justify-center gap-2 mt-2">
              <span className="material-symbols-outlined text-secondary">explore</span>
              {t.lobby.no_room_title}
            </h2>

            <p className="text-sm text-[#c1c9c0] leading-relaxed mb-6 max-w-xs mx-auto">
              {t.lobby.no_room_desc.replace('{mode}', selectedControl)}
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowNoRoomModal(false)}
                className="flex-1 py-2.5 bg-[#232b31] hover:bg-[#2e363c] text-[#dbe3ec] font-bold rounded-xl transition-all text-sm"
              >
                {t.lobby.cancel}
              </button>
              <button
                onClick={handleAutoCreateRoom}
                className="flex-1 py-2.5 bg-secondary hover:brightness-110 text-on-secondary font-bold rounded-xl transition-all text-sm shadow-[0_0_15px_rgba(168,214,56,0.3)]"
              >
                {t.lobby.create}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
