import { useState } from 'react';
import type { Socket } from 'socket.io-client';

interface LobbyProps {
  socket: Socket | null;
  onJoined: (roomId: string, playerId: string, playerName: string) => void;
}

export function Lobby({ socket, onJoined }: LobbyProps) {
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [joining, setJoining] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !roomId.trim() || !playerName.trim()) return;
    setJoining(true);
    const playerId = `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    socket.emit('join-room', { roomId: roomId.trim(), playerId, playerName: playerName.trim() });
    socket.once('joined', () => {
      onJoined(roomId.trim(), playerId, playerName.trim());
      setJoining(false);
    });
    socket.once('error', (_msg: string) => {
      setJoining(false);
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !playerName.trim()) return;
    const newRoomId = `room-${Date.now().toString(36).slice(-6)}`;
    setRoomId(newRoomId);
    setJoining(true);
    const playerId = `p-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    socket.emit('join-room', { roomId: newRoomId, playerId, playerName: playerName.trim() });
    socket.once('joined', () => {
      onJoined(newRoomId, playerId, playerName.trim());
      setJoining(false);
    });
  };

  return (
    <div className="lobby">
      <h1>That&apos;s So Clever</h1>
      <form onSubmit={handleJoin}>
        <input
          type="text"
          placeholder="Room code"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          disabled={joining}
        />
        <input
          type="text"
          placeholder="Your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          disabled={joining}
        />
        <button type="submit" disabled={!roomId.trim() || !playerName.trim() || joining}>
          Join Room
        </button>
      </form>
      <form onSubmit={handleCreate}>
        <button type="submit" disabled={!playerName.trim() || joining}>
          Create New Room
        </button>
      </form>
    </div>
  );
}
