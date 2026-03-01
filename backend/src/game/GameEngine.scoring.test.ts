import { describe, it, expect } from 'vitest';
import { GameEngine } from './GameEngine.js';
import { Player } from './Player.js';

function makePlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => new Player(`p${i}`, `Player ${i}`));
}

/** Dice values 1,2,3,4,5,6 for white,yellow,blue,green,orange,purple */
function makeSequentialRandom(): () => number {
  let i = 0;
  return () => (i++ % 6) / 6;
}

describe('GameEngine scoring and placement', () => {
  describe('Yellow Area', () => {
    // REQ-018: Values can be marked in any order
    it('REQ-018: allows marking yellow in any order', () => {
      const random = makeSequentialRandom();
      const engine = new GameEngine('r1', makePlayers(2), random);
      engine.rollDice('p0');
      engine.selectDie('p0', 0);
      const result = engine.placeDie('p0', 'yellow', { index: 0 });
      expect(result.success).toBe(true);
    });

    // REQ-019: Column completion triggers bonus (validated in scoring.test.ts)
    it('REQ-019: allows marking both slots in a row', () => {
      let callCount = 0;
      const random = () => (callCount++ < 6 ? 0 : 0);
      const engine = new GameEngine('r1', makePlayers(2), random);
      engine.rollDice('p0');
      engine.selectDie('p0', 0);
      engine.placeDie('p0', 'yellow', { index: 0 });
      engine.rollDice('p0');
      engine.selectDie('p0', 1);
      const result = engine.placeDie('p0', 'yellow', { index: 1 });
      expect(result.success).toBe(true);
    });
  });

  describe('Blue Area', () => {
    // REQ-020, REQ-021, REQ-022: Blue uses blue+white sum
    // REQ-023: Cannot mark with single die (e.g. sum 2 needs both 1+1)
    it('REQ-020-022: places blue when sum matches', () => {
      const random = makeSequentialRandom();
      const engine = new GameEngine('r1', makePlayers(1), random);
      engine.rollDice('p0');
      const blueIdx = engine.getState().dice.findIndex((d) => d.color === 'blue');
      const whiteIdx = engine.getState().dice.findIndex((d) => d.color === 'white');
      const sum = engine.getState().dice[blueIdx].value + engine.getState().dice[whiteIdx].value;
      engine.selectDie('p0', blueIdx);
      const result = engine.placeDie('p0', 'blue', { index: sum - 2 });
      expect(result.success).toBe(true);
    });

    it('REQ-023: rejects blue placement when sum does not match', () => {
      const random = makeSequentialRandom();
      const engine = new GameEngine('r1', makePlayers(1), random);
      engine.rollDice('p0');
      engine.selectDie('p0', 2);
      const result = engine.placeDie('p0', 'blue', { index: 9 });
      expect(result.success).toBe(false);
    });
  });

  describe('Green Area', () => {
    // REQ-024, REQ-025: Left-to-right, minimum values per space
    it('REQ-024-025: enforces minimum value for first space', () => {
      const random = () => 0;
      const engine = new GameEngine('r1', makePlayers(1), random);
      engine.rollDice('p0');
      engine.selectDie('p0', 0);
      const result = engine.placeDie('p0', 'green', {});
      expect(result.success).toBe(true);
    });

    it('REQ-025: rejects value below minimum for space', () => {
      const player = new Player('p0', 'P0');
      player.sheet.green.marked = [1, 2, null, null, null, null];
      const engine = new GameEngine('r1', [player, new Player('p1', 'P1')], () => 0);
      engine.rollDice('p0');
      engine.selectDie('p0', 0);
      const result = engine.placeDie('p0', 'green', {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('low');
    });
  });

  describe('Orange Area', () => {
    // REQ-027, REQ-028: Left-to-right, multiplier applied
    it('REQ-027-028: accepts value and applies multiplier', () => {
      const random = makeSequentialRandom();
      const engine = new GameEngine('r1', makePlayers(1), random);
      engine.rollDice('p0');
      engine.selectDie('p0', 3);
      const result = engine.placeDie('p0', 'orange', {});
      expect(result.success).toBe(true);
    });
  });

  describe('Purple Area', () => {
    // REQ-029, REQ-030: Left-to-right, ascending; after 6 any number allowed
    it('REQ-029-030: requires ascending values', () => {
      let i = 0;
      const vals = [5 / 6, 5 / 6, 5 / 6, 5 / 6, 5 / 6, 5 / 6, 4 / 6, 4 / 6, 4 / 6, 4 / 6, 4 / 6, 0, 0, 0, 0, 0];
      const random = () => vals[i++ % vals.length];
      const engine = new GameEngine('r1', makePlayers(2), random);
      engine.rollDice('p0');
      engine.selectDie('p0', 5);
      engine.placeDie('p0', 'purple', {});
      engine.rollDice('p0');
      const idx1 = engine.getState().dice.findIndex((d) => d.available && d.value === 1);
      engine.selectDie('p0', idx1 >= 0 ? idx1 : 0);
      const result = engine.placeDie('p0', 'purple', {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('higher');
    });

    it('REQ-030: purple accepts any value after a 6', () => {
      const player = new Player('p0', 'P0');
      player.sheet.purple.values = [1, 2, 3, 6, null, null];
      const engine = new GameEngine('r1', [player, new Player('p1', 'P1')], makeSequentialRandom());
      engine.rollDice('p0');
      engine.selectDie('p0', 0);
      const result = engine.placeDie('p0', 'purple', {});
      expect(result.success).toBe(true);
    });
  });

  describe('White die as wild', () => {
    // REQ-014: White as yellow, green, orange, purple, or blue
    it('REQ-014: white can be placed as green', () => {
      const random = makeSequentialRandom();
      const engine = new GameEngine('r1', makePlayers(1), random);
      engine.rollDice('p0');
      const whiteIdx = engine.getState().dice.findIndex((d) => d.color === 'white' && d.available);
      engine.selectDie('p0', whiteIdx);
      const result = engine.placeDie('p0', 'green', {});
      expect(result.success).toBe(true);
    });

    it('REQ-014: white can be placed as orange', () => {
      const random = makeSequentialRandom();
      const engine = new GameEngine('r1', makePlayers(1), random);
      engine.rollDice('p0');
      const whiteIdx = engine.getState().dice.findIndex((d) => d.color === 'white' && d.available);
      engine.selectDie('p0', whiteIdx);
      const result = engine.placeDie('p0', 'orange', {});
      expect(result.success).toBe(true);
    });
  });
});
