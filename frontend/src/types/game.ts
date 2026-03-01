// Game types - mirrors shared/types for frontend

export type DieColor = 'white' | 'yellow' | 'blue' | 'green' | 'orange' | 'purple';

export interface Die {
  color: DieColor;
  value: number;
  available: boolean;
}

export interface YellowArea {
  marked: boolean[][];
}

export interface BlueArea {
  marked: boolean[];
}

export interface GreenArea {
  marked: (number | null)[];
}

export interface OrangeArea {
  values: (number | null)[];
}

export interface PurpleArea {
  values: (number | null)[];
}

export interface ScoringSheet {
  yellow: YellowArea;
  blue: BlueArea;
  green: GreenArea;
  orange: OrangeArea;
  purple: PurpleArea;
  foxes: number;
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
