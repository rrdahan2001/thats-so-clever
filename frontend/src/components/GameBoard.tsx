import { useCallback } from 'react';
import type { Socket } from 'socket.io-client';
import type { GameState } from '../types/game';
import { DiceArea } from './DiceArea';
import { PlayerList } from './PlayerList';
import { ScoringSheetComponent } from './ScoringSheet';
import { getTotalScore } from '../utils/scoring';
import { ScoreBreakdown } from './ScoreBreakdown';

interface GameBoardProps {
  socket: Socket | null;
  gameState: GameState | null;
  playerId: string | null;
}

function computeBlueWhiteSum(
  gameState: GameState | null
): number {
  if (!gameState) return 0;
  if (gameState.blueDieValue !== undefined && gameState.whiteDieValue !== undefined) {
    return gameState.blueDieValue + gameState.whiteDieValue;
  }
  const all = [...(gameState.dice ?? []), ...(gameState.silverTray ?? [])];
  const blue = all.find((d) => d.color === 'blue');
  const white = all.find((d) => d.color === 'white');
  return (blue?.value ?? 0) + (white?.value ?? 0);
}

export function GameBoard({ socket, gameState, playerId }: GameBoardProps) {
  const handleRoll = useCallback(() => {
    socket?.emit('roll-dice');
  }, [socket]);

  const handleSelectDie = useCallback(
    (i: number) => {
      socket?.emit('select-die', i);
    },
    [socket]
  );

  const handlePlace = useCallback(
    (area: string, placement: Record<string, number>) => {
      socket?.emit('place-die', { area, placement });
    },
    [socket]
  );

  const handlePassiveChoose = useCallback(
    (i: number, asColor?: string) => {
      socket?.emit('passive-choose', asColor ? { dieIndex: i, asColor } : i);
    },
    [socket]
  );

  const handlePassTurn = useCallback(() => {
    socket?.emit('pass-turn');
  }, [socket]);

  if (!gameState) return null;
  const blueWhiteSum = computeBlueWhiteSum(gameState);
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === playerId;
  const isPassivePhase = gameState.phase === 'passive';
  const isSolo = gameState.players.length === 1;
  const isPassivePlayer =
    (!!playerId && currentPlayer?.id !== playerId) || (isSolo && isPassivePhase);

  if (gameState.gameOver) {
    const winner = gameState.players.find((p) => p.id === gameState.winnerId);
    return (
      <div className="game-board game-over">
        <h2>Game Over!</h2>
        <p>Winner: {winner?.name ?? 'Unknown'}</p>
        <div className="final-scores">
          {gameState.players.map((p) => (
            <div key={p.id}>
              {p.name}: {getTotalScore(p.sheet)} pts
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="game-board">
      <div className="game-header">
        <PlayerList gameState={gameState} currentPlayerId={playerId} />
        <p>
          Round {gameState.currentRound}/{gameState.maxRounds} – {currentPlayer?.name}&apos;s turn
        </p>
      </div>
      <DiceArea
        dice={gameState.dice}
        silverTray={gameState.silverTray ?? []}
        selectedDie={gameState.selectedDie}
        phase={gameState.phase}
        isMyTurn={isMyTurn}
        isPassivePhase={isPassivePhase}
        isPassivePlayer={isPassivePlayer}
        mySheet={gameState.players.find((p) => p.id === playerId)?.sheet ?? null}
        blueWhiteSum={blueWhiteSum}
        onSelectDie={handleSelectDie}
        onRoll={handleRoll}
        onPassiveChoose={handlePassiveChoose}
        onPassTurn={handlePassTurn}
      />
      <div className="sheets-container">
        {gameState.players.map((p) => (
          <div key={p.id} className="player-sheet">
            <h3>
              {p.name} {p.id === playerId ? '(You)' : ''} – {getTotalScore(p.sheet)} pts
            </h3>
            <ScoreBreakdown sheet={p.sheet} />
            <ScoringSheetComponent
              sheet={p.sheet}
              isActiveSheet={p.id === playerId}
              selectedDie={gameState.selectedDie}
              blueWhiteSum={blueWhiteSum}
              phase={gameState.phase}
              onPlace={handlePlace}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
