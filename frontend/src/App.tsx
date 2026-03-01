import { useState } from 'react';
import { useSocket } from './hooks/useSocket';
import { useGameState } from './hooks/useGameState';
import { Lobby } from './components/Lobby';
import { GameBoard } from './components/GameBoard';
import './App.css';

function App() {
  const { socket, connected } = useSocket();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { gameState, lobbyPlayers, error, setError, info } = useGameState(socket, playerId);

  const handleCopyRoomCode = async () => {
    if (roomId && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard API failed (e.g. permission denied)
      }
    }
  };

  const handleJoined = (r: string, p: string, _name: string) => {
    setRoomId(r);
    setPlayerId(p);
  };

  const handleStart = () => {
    socket?.emit('start-game');
  };

  if (!connected) {
    return (
      <div className="app">
        <p>Connecting to server...</p>
      </div>
    );
  }

  if (!roomId || !playerId) {
    return (
      <div className="app">
        <Lobby socket={socket} onJoined={handleJoined} />
        {error && (
          <p className="error" onClick={() => setError(null)}>
            {error}
          </p>
        )}
      </div>
    );
  }

  const showLobby = !gameState && roomId;
  return (
    <div className="app">
      {error && (
        <p className="error" onClick={() => setError(null)}>
          {error}
        </p>
      )}
      {info && <p className="info">{info}</p>}
      {showLobby ? (
        <div className="lobby-waiting">
          <p>Room: <strong>{roomId}</strong></p>
          <p>Share this code with friends to join.</p>
          <div className="copy-room-code">
            <button onClick={handleCopyRoomCode}>Copy room code</button>
            {copied && (
              <span className="copy-tooltip" role="status">
                Copied!
              </span>
            )}
          </div>
          {lobbyPlayers.length > 0 && (
            <ul className="lobby-players">
              {lobbyPlayers.map((p) => (
                <li key={p.id}>{p.name}</li>
              ))}
            </ul>
          )}
          <button onClick={handleStart}>Start Game</button>
        </div>
      ) : (
        <GameBoard
          socket={socket}
          gameState={gameState}
          playerId={playerId}
        />
      )}
    </div>
  );
}

export default App;
