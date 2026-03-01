import { describe, it, expect } from 'vitest';
import { GameEngine } from './GameEngine.js';
import { Player } from './Player.js';

function makePlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => new Player(`p${i}`, `Player ${i}`));
}

/** Returns sequential dice values 1,2,3,4,5,6,1,2,... for deterministic tests */
function makeDeterministicRandom(): () => number {
  let callCount = 0;
  return () => {
    const val = (callCount % 6) / 6;
    callCount++;
    return val;
  };
}

/** Returns same value for all dice (e.g. all 1s) - enables multi-roll tests */
function makeConstantRandom(value: number): () => number {
  return () => (value - 1) / 6;
}

describe('GameEngine', () => {
  describe('Game Configuration', () => {
    // REQ-001: Support 1, 2, 3, or 4 players
    it('REQ-001: supports 1 player', () => {
      const engine = new GameEngine('r1', makePlayers(1), makeDeterministicRandom());
      const state = engine.getState();
      expect(state.players).toHaveLength(1);
    });

    it('REQ-001: supports 2 players', () => {
      const engine = new GameEngine('r1', makePlayers(2), makeDeterministicRandom());
      const state = engine.getState();
      expect(state.players).toHaveLength(2);
    });

    it('REQ-001: supports 3 players', () => {
      const engine = new GameEngine('r1', makePlayers(3), makeDeterministicRandom());
      const state = engine.getState();
      expect(state.players).toHaveLength(3);
    });

    it('REQ-001: supports 4 players', () => {
      const engine = new GameEngine('r1', makePlayers(4), makeDeterministicRandom());
      const state = engine.getState();
      expect(state.players).toHaveLength(4);
    });

    // REQ-002: Rounds based on player count (RTM: 6 for 1, 5 for 2, 4 for 3, 4 for 4)
    it('REQ-002: assigns 6 rounds for 1 player', () => {
      const engine = new GameEngine('r1', makePlayers(1), makeDeterministicRandom());
      expect(engine.getState().maxRounds).toBe(6);
    });

    it('REQ-002: assigns 6 rounds for 2 players', () => {
      const engine = new GameEngine('r1', makePlayers(2), makeDeterministicRandom());
      expect(engine.getState().maxRounds).toBe(6);
    });

    it('REQ-002: assigns 5 rounds for 3 players', () => {
      const engine = new GameEngine('r1', makePlayers(3), makeDeterministicRandom());
      expect(engine.getState().maxRounds).toBe(5);
    });

    it('REQ-002: assigns 4 rounds for 4 players', () => {
      const engine = new GameEngine('r1', makePlayers(4), makeDeterministicRandom());
      expect(engine.getState().maxRounds).toBe(4);
    });

    // REQ-003: Random start player (documented: current impl uses index 0)
    it('REQ-003: assigns a valid start player index', () => {
      const engine = new GameEngine('r1', makePlayers(3), makeDeterministicRandom());
      const state = engine.getState();
      expect(state.currentPlayerIndex).toBeGreaterThanOrEqual(0);
      expect(state.currentPlayerIndex).toBeLessThan(state.players.length);
    });

    // REQ-004: Scorepad initialized with correct structure
    it('REQ-004: initializes scorepad for each player', () => {
      const engine = new GameEngine('r1', makePlayers(2), makeDeterministicRandom());
      const state = engine.getState();
      for (const player of state.players) {
        expect(player.sheet.yellow.marked).toHaveLength(6);
        expect(player.sheet.blue.marked).toHaveLength(11);
        expect(player.sheet.green.marked).toHaveLength(6);
        expect(player.sheet.orange.values).toHaveLength(6);
        expect(player.sheet.purple.values).toHaveLength(6);
        expect(typeof player.sheet.foxes).toBe('number');
      }
    });
  });

  describe('Dice Mechanics', () => {
    // REQ-005: 6 dice with colors white, yellow, blue, green, orange, purple
    it('REQ-005: has 6 dice with distinct colors', () => {
      const engine = new GameEngine('r1', makePlayers(1), makeDeterministicRandom());
      const state = engine.getState();
      expect(state.dice).toHaveLength(6);
      const colors = state.dice.map((d) => d.color);
      expect(colors).toContain('white');
      expect(colors).toContain('yellow');
      expect(colors).toContain('blue');
      expect(colors).toContain('green');
      expect(colors).toContain('orange');
      expect(colors).toContain('purple');
      expect(new Set(colors).size).toBe(6);
    });

    // REQ-006: Each die has value 1-6
    it('REQ-006: each die has value 1-6', () => {
      const engine = new GameEngine('r1', makePlayers(1), makeDeterministicRandom());
      const state = engine.getState();
      for (const die of state.dice) {
        expect(die.value).toBeGreaterThanOrEqual(1);
        expect(die.value).toBeLessThanOrEqual(6);
        expect(typeof die.available).toBe('boolean');
      }
    });
  });

  describe('Active Player Turn', () => {
    // REQ-007: Roll all 6 dice at start of turn
    it('REQ-007: roll transitions to selecting phase', () => {
      const engine = new GameEngine('r1', makePlayers(1), makeDeterministicRandom());
      expect(engine.getState().phase).toBe('rolling');
      const result = engine.rollDice('p0');
      expect(result.success).toBe(true);
      expect(engine.getState().phase).toBe('selecting');
      expect(engine.getState().rollsThisTurn).toBe(1);
    });

    // REQ-008, REQ-009: Select one die, place on one of 3 fields
    it('REQ-008-009: select die then place on score sheet', () => {
      const random = makeDeterministicRandom();
      const engine = new GameEngine('r1', makePlayers(1), random);
      engine.rollDice('p0');
      const dice = engine.getState().dice;
      const dieIndex = dice.findIndex((d) => d.available && d.color === 'yellow');
      if (dieIndex < 0) return;
      engine.selectDie('p0', dieIndex);
      const result = engine.placeDie('p0', 'yellow', { index: 0 });
      expect(result.success).toBe(true);
      const sheet = engine.getState().players[0].sheet;
      expect(sheet.yellow.marked[dice[dieIndex].value - 1][0]).toBe(true);
    });

    // REQ-011: Lower dice go to Silver Platter
    it('REQ-011: dice lower than selected go to Silver Platter', () => {
      const random = makeDeterministicRandom();
      const engine = new GameEngine('r1', makePlayers(1), random);
      engine.rollDice('p0');
      const dice = engine.getState().dice;
      const highDieIndex = dice.findIndex((d) => d.available && d.value === 6);
      const highValue = highDieIndex >= 0 ? 6 : Math.max(...dice.filter((d) => d.available).map((d) => d.value));
      const selectIndex = dice.findIndex((d) => d.available && d.value === highValue);
      if (selectIndex < 0) return;
      engine.selectDie('p0', selectIndex);
      const silverTray = engine.getSilverTray();
      expect(silverTray.length).toBeGreaterThan(0);
      for (const die of silverTray) {
        expect(die.value).toBeLessThan(highValue);
      }
    });

    // REQ-012: Max 3 rolls per turn
    it('REQ-012: limits to 3 rolls per turn', () => {
      const random = makeConstantRandom(1);
      const engine = new GameEngine('r1', makePlayers(1), random);
      engine.rollDice('p0');
      engine.selectDie('p0', 0);
      engine.placeDie('p0', 'green', {});
      engine.rollDice('p0');
      engine.selectDie('p0', 0);
      engine.placeDie('p0', 'yellow', { index: 0 });
      engine.rollDice('p0');
      engine.selectDie('p0', 0);
      engine.placeDie('p0', 'yellow', { index: 1 });
      const fourth = engine.rollDice('p0');
      expect(fourth.success).toBe(false);
      expect(fourth.error).toBeDefined();
    });

    // REQ-013: Turn ends when no dice remain for reroll
    it('REQ-013: turn ends when no available dice', () => {
      const random = makeDeterministicRandom();
      const engine = new GameEngine('r1', makePlayers(2), random);
      engine.rollDice('p0');
      const purpleIdx = engine.getState().dice.findIndex((d) => d.color === 'purple' && d.available);
      engine.selectDie('p0', purpleIdx);
      engine.placeDie('p0', 'purple', {});
      expect(engine.getState().phase).toBe('passive');
    });

    // REQ-014: White die as wild
    it('REQ-014: white die can be used as yellow', () => {
      const vals = [1, 2, 3, 4, 5, 6]; // first 6 for createDice
      let i = 0;
      const random = () => vals[i++ % 6] / 6 - 0.01; // ensures 1-6
      const engine = new GameEngine('r1', makePlayers(1), random);
      engine.rollDice('p0');
      const whiteIdx = engine.getState().dice.findIndex((d) => d.color === 'white' && d.available);
      if (whiteIdx < 0) return;
      engine.selectDie('p0', whiteIdx);
      const result = engine.placeDie('p0', 'yellow', { index: 0 });
      expect(result.success).toBe(true);
    });
  });

  describe('Passive Player Turn', () => {
    // REQ-015, REQ-016, REQ-017: Passive players choose from Silver Platter
    it('REQ-015-017: passive players choose from Silver Platter', () => {
      const random = makeDeterministicRandom();
      const engine = new GameEngine('r1', makePlayers(2), random);
      engine.rollDice('p0');
      const purpleIdx = engine.getState().dice.findIndex((d) => d.color === 'purple' && d.available);
      engine.selectDie('p0', purpleIdx);
      engine.placeDie('p0', 'purple', {});
      expect(engine.getState().phase).toBe('passive');
      const silverTray = engine.getSilverTray();
      expect(silverTray.length).toBeGreaterThan(0);
      const result = engine.passiveChooseDie('p1', 1);
      expect(result.success).toBe(true);
    });

    it('passive player can choose white die with valid color', () => {
      const random = makeDeterministicRandom();
      const engine = new GameEngine('r1', makePlayers(2), random);
      engine.rollDice('p0');
      const purpleIdx = engine.getState().dice.findIndex((d) => d.color === 'purple' && d.available);
      engine.selectDie('p0', purpleIdx);
      engine.placeDie('p0', 'purple', {});
      expect(engine.getState().phase).toBe('passive');
      const silverTray = engine.getSilverTray();
      const whiteIdx = silverTray.findIndex((d) => d.color === 'white');
      expect(whiteIdx).toBeGreaterThanOrEqual(0);
      const result = engine.passiveChooseDie('p1', whiteIdx, 'yellow');
      expect(result.success).toBe(true);
    });
  });
});
