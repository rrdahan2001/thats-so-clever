import type { Player as IPlayer, ScoringSheet } from '../types/game.js';

function createEmptySheet(): ScoringSheet {
  return {
    yellow: {
      marked: Array(6)
        .fill(null)
        .map(() => Array(2).fill(false)),
    },
    blue: {
      marked: Array(11).fill(false), // indices 0-10 for sums 2-12
    },
    green: {
      marked: Array(6).fill(null),
    },
    orange: {
      values: Array(6).fill(null),
    },
    purple: {
      values: Array(6).fill(null),
    },
    foxes: 0,
  };
}

export class Player implements IPlayer {
  id: string;
  name: string;
  sheet: ScoringSheet;
  isConnected: boolean;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.sheet = createEmptySheet();
    this.isConnected = true;
  }

  toJSON(): IPlayer {
    return {
      id: this.id,
      name: this.name,
      sheet: this.sheet,
      isConnected: this.isConnected,
    };
  }
}
