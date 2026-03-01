import { useEffect, useState } from 'react';
import type { GameState } from '../types/game';
import type { Socket } from 'socket.io-client';

export function useGameState(socket: Socket | null, _playerId: string | null) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [lobbyPlayers, setLobbyPlayers] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;
    const onState = (state: GameState) => setGameState(state);
    const onLobby = (data: { players: { id: string; name: string }[] }) => setLobbyPlayers(data.players ?? []);
    const onErr = (msg: string) => setError(msg);
    const onInfo = (msg: string) => {
      setInfo(msg);
      setTimeout(() => setInfo(null), 5000);
    };
    socket.on('game-state', onState);
    socket.on('lobby-update', onLobby);
    socket.on('error', onErr);
    socket.on('info', onInfo);
    return () => {
      socket.off('game-state', onState);
      socket.off('lobby-update', onLobby);
      socket.off('error', onErr);
      socket.off('info', onInfo);
    };
  }, [socket]);

  return { gameState, lobbyPlayers, error, setError, info, setInfo };
}
