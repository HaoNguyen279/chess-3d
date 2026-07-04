'use client';

import React, { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, push, set, update, get } from 'firebase/database';

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
}

interface LobbyProps {
  onJoinRoom: (roomId: string, color: 'w' | 'b') => void;
}

export function Lobby({ onJoinRoom }: LobbyProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomName, setRoomName] = useState('');
  const [password, setPassword] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [userId, setUserId] = useState('');

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
    if (!roomName.trim() || !password.trim()) {
      alert('Vui lòng nhập đầy đủ tên phòng và mật khẩu');
      return;
    }

    const roomsRef = ref(database, 'rooms');
    const newRoomRef = push(roomsRef);
    const roomId = newRoomRef.key!;

    await set(newRoomRef, {
      roomName: roomName.trim(),
      password: password.trim(),
      playerCount: 1,
      status: 'waiting',
      players: {
        white: userId,
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
      alert('Vui lòng nhập mật khẩu');
      return;
    }

    const roomRef = ref(database, `rooms/${selectedRoom.id}`);
    const snapshot = await get(roomRef);
    const roomData = snapshot.val();

    if (!roomData) {
      alert('Phòng không tồn tại');
      return;
    }

    if (roomData.password !== joinPassword.trim()) {
      alert('Mật khẩu không đúng');
      setJoinPassword('');
      return;
    }

    if (roomData.playerCount >= 2) {
      alert('Phòng đã đủ người');
      return;
    }

    await update(roomRef, {
      playerCount: 2,
      'players/black': userId,
      status: 'playing',
    });

    setShowJoinModal(false);
    setJoinPassword('');
    onJoinRoom(selectedRoom.id, 'b');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Chess Multiplayer Lobby</h1>

        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full mb-6 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
        >
          + Tạo Phòng Mới
        </button>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Phòng Đang Chờ</h2>

          {rooms.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Chưa có phòng nào. Hãy tạo phòng mới!</p>
          ) : (
            <div className="space-y-3">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-gray-700 p-4 rounded-lg flex justify-between items-center hover:bg-gray-600 transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedRoom(room);
                    setShowJoinModal(true);
                  }}
                >
                  <div>
                    <h3 className="font-semibold text-lg">{room.roomName}</h3>
                    <p className="text-sm text-gray-400">
                      Người chơi: {room.playerCount}/2
                    </p>
                  </div>
                  <div className="text-blue-400 font-medium">Vào phòng →</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Tạo Phòng Mới</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tên Phòng</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Nhập tên phòng..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Mật Khẩu</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Nhập mật khẩu..."
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setRoomName('');
                    setPassword('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateRoom}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
                >
                  Tạo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showJoinModal && selectedRoom && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Vào Phòng</h2>
            <p className="text-gray-300 mb-4">Phòng: {selectedRoom.roomName}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Mật Khẩu</label>
                <input
                  type="password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập mật khẩu phòng..."
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowJoinModal(false);
                    setJoinPassword('');
                    setSelectedRoom(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleJoinRoom}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
                >
                  Vào
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
