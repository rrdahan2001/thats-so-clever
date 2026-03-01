import type { GameState } from '../types/game';

interface PlayerListProps {
  gameState: GameState | null;
  currentPlayerId: string | null;
}

export function PlayerList({ gameState, currentPlayerId }: PlayerListProps) {
  if (!gameState) return null;
  return (
    <div className="player-list">
      {gameState.players.map((p, i) => (
        <div
          key={p.id}
          className={`player ${p.id === currentPlayerId ? 'me' : ''} ${i === gameState.currentPlayerIndex ? 'active' : ''}`}
        >
          <span className="name">{p.name}</span>
          {i === gameState.currentPlayerIndex && <span className="badge">Active</span>}
        </div>
      ))}
    </div>
  );
}
