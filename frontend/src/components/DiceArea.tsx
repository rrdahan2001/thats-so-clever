import { useState } from 'react';
import type { Die, ScoringSheet } from '../types/game';
import { getDieValidity, getValidColorsForWhite } from '../utils/dieValidity';
import { WhiteDieColorPicker } from './WhiteDieColorPicker';

interface DiceAreaProps {
  dice: Die[];
  silverTray: Die[];
  selectedDie: Die | null;
  phase: string;
  isMyTurn: boolean;
  isPassivePhase: boolean;
  isPassivePlayer: boolean;
  mySheet: ScoringSheet | null;
  blueWhiteSum: number;
  onSelectDie: (index: number) => void;
  onRoll: () => void;
  onPassiveChoose: (dieIndex: number, asColor?: string) => void;
  onPassTurn?: () => void;
}

const COLOR_MAP: Record<string, string> = {
  white: '#f0f0f0',
  yellow: '#f0e030',
  blue: '#3090f0',
  green: '#30c030',
  orange: '#f09030',
  purple: '#a030c0',
};

export function DiceArea({
  dice,
  silverTray,
  selectedDie,
  phase,
  isMyTurn,
  isPassivePhase,
  isPassivePlayer,
  mySheet,
  blueWhiteSum,
  onSelectDie,
  onRoll,
  onPassiveChoose,
  onPassTurn,
}: DiceAreaProps) {
  const [whitePicker, setWhitePicker] = useState<{ dieIndex: number; value: number } | null>(null);

  const available = phase === 'selecting' && isMyTurn;
  const tray = isPassivePhase && isPassivePlayer ? silverTray : [];

  const canRoll =
    (phase === 'rolling' || phase === 'placing') &&
    isMyTurn &&
    dice.some((d) => d.available) &&
    !selectedDie;
  const showRoll = canRoll;

  const handleTrayDieClick = (i: number) => {
    const die = tray[i];
    if (die?.color === 'white') {
      setWhitePicker({ dieIndex: i, value: die.value });
    } else {
      onPassiveChoose(i);
    }
  };

  const handleWhiteColorChoose = (color: string) => {
    if (whitePicker) {
      onPassiveChoose(whitePicker.dieIndex, color);
      setWhitePicker(null);
    }
  };

  return (
    <div className="dice-area">
      {whitePicker && (
        <WhiteDieColorPicker
          dieValue={whitePicker.value}
          validColors={mySheet ? getValidColorsForWhite(mySheet, whitePicker.value, blueWhiteSum) : undefined}
          onChoose={(c) => handleWhiteColorChoose(c)}
          onCancel={() => setWhitePicker(null)}
        />
      )}
      {showRoll && (
        <button className="roll-btn" onClick={onRoll}>
          Roll Dice
        </button>
      )}
      {selectedDie && (
        <div className="place-prompt-area">
          <p className="place-prompt">Place your {selectedDie.color} die ({selectedDie.value}) on the board</p>
          {mySheet && onPassTurn && !getDieValidity(mySheet, selectedDie, blueWhiteSum).valid && (
            <button type="button" className="pass-turn-btn" onClick={onPassTurn}>
              No playable moves — skip to next turn
            </button>
          )}
        </div>
      )}
      <div className="dice-row">
        {dice.map((die, i) => {
          const validity = mySheet ? getDieValidity(mySheet, die, blueWhiteSum) : { valid: true };
          const isInvalid = available && die.available && !validity.valid;
          return (
            <button
              key={`${die.color}-${i}`}
              className={`die ${die.color === 'white' ? 'die-white' : ''} ${!die.available ? 'used' : ''} ${available ? 'selectable' : ''} ${
                selectedDie?.color === die.color && selectedDie?.value === die.value ? 'selected' : ''
              } ${isInvalid ? 'invalid' : ''}`}
              style={{ backgroundColor: COLOR_MAP[die.color] ?? '#888' }}
              onClick={() => available && die.available && validity.valid && onSelectDie(i)}
              disabled={!available || !die.available || !validity.valid}
              title={isInvalid ? validity.reason : undefined}
            >
              {die.value}
            </button>
          );
        })}
      </div>
      {tray.length > 0 && (
        <div className="silver-tray">
          <span>Silver tray (choose one):</span>
          {tray.map((die, i) => {
            const validity = mySheet ? getDieValidity(mySheet, die, blueWhiteSum) : { valid: true };
            const isInvalid = !validity.valid;
            return (
              <button
                key={i}
                className={`tray-die ${die.color === 'white' ? 'die-white' : ''} ${isInvalid ? 'invalid' : ''}`}
                style={{ backgroundColor: COLOR_MAP[die.color] ?? '#888' }}
                onClick={() => !isInvalid && handleTrayDieClick(i)}
                disabled={isInvalid}
                title={isInvalid ? validity.reason : die.color === 'white' ? 'Click to choose color' : undefined}
              >
                {die.value}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
