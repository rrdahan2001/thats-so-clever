// Shared types for That's So Clever - used by both frontend and backend

export type DieColor = 'white' | 'yellow' | 'blue' | 'green' | 'orange' | 'purple';

export interface Die {
  color: DieColor;
  value: number;
  available: boolean; // false if on silver tray
}

// Yellow: 6 values (1-6), each has 2 boxes to mark
export interface YellowArea {
  marked: boolean[][]; // [value-1][slot], 6x2 grid - each number has 2 boxes
}

// Blue: spaces 2-12, mark based on blue+white sum
export interface BlueArea {
  marked: boolean[]; // indices 0-10 for sums 2-12
}

// Green: 6 spaces left-to-right with minimum values [1,2,3,4,5,6]
export interface GreenArea {
  marked: (number | null)[]; // value placed or null
}

// Orange: 6 spaces, some double/triple multipliers
export interface OrangeArea {
  values: (number | null)[]; // 6 spaces, multipliers: 1x,1x,1x,2x,1x,3x
}

// Purple: 6 spaces, ascending sequence (6 resets)
export interface PurpleArea {
  values: (number | null)[]; // 6 spaces
}

export interface ScoringSheet {
  yellow: YellowArea;
  blue: BlueArea;
  green: GreenArea;
  orange: OrangeArea;
  purple: PurpleArea;
  foxes: number; // total foxes earned
}

export interface Player {
  id: string;
  name: string;
  sheet: ScoringSheet;
  isConnected: boolean;
}

export type TurnPhase = 'rolling' | 'selecting' | 'placing' | 'passive' | 'ended';

export interface GameState {
  roomId: string;
  players: Player[];
  currentPlayerIndex: number;
  currentRound: number;
  maxRounds: number;
  phase: TurnPhase;
  dice: Die[];
  silverTray?: Die[];
  blueDieValue?: number;
  whiteDieValue?: number;
  rollsThisTurn: number;
  selectedDie: Die | null;
  gameOver: boolean;
  winnerId: string | null;
}

export type ColorAreaType = 'yellow' | 'blue' | 'green' | 'orange' | 'purple';
