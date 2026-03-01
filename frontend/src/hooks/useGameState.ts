import { useEffect, useState } from 'react';
import type { GameState } from '../types/game';
import type { Socket } from 'socket.io-client';

export function useGameState(socket: Socket | null, _playerId: string | null) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [lobbyPlayers, setLobbyPlayers] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;
    const onState = (state: GameState) => setGameState(state);
    const onLobby = (data: { players: { id: string; name: string }[] }) => setLobbyPlayers(data.players ?? []);
    const onErr = (msg: string) => setError(msg);
    socket.on('game-state', onState);
    socket.on('lobby-update', onLobby);
    socket.on('error', onErr);
    return () => {
      socket.off('game-state', onState);
      socket.off('lobby-update', onLobby);
      socket.off('error', onErr);
    };
  }, [socket]);

  return { gameState, lobbyPlayers, error, setError };
}
