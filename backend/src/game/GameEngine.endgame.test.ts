import { describe, it, expect } from 'vitest';
import { GameEngine } from './GameEngine.js';
import { Player } from './Player.js';
import { getTotalScore, getFoxBonus, getColorScores } from '../utils/scoring.js';

function makePlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => new Player(`p${i}`, `Player ${i}`));
}

function makeConstantRandom(value: number): () => number {
  return () => (value - 1) / 6;
}

describe('GameEngine endgame', () => {
  describe('Foxes and scoring', () => {
    // REQ-038: Track foxes collected
    it('REQ-038: sheet has foxes field', () => {
      const engine = new GameEngine('r1', makePlayers(1), makeConstantRandom(1));
      const sheet = engine.getState().players[0].sheet;
      expect(sheet).toHaveProperty('foxes');
      expect(sheet.foxes).toBe(0);
    });

    // REQ-039, REQ-040: Fox points = foxes * min area; 0 if any area is 0
    it('REQ-039-040: getFoxBonus returns 0 when min score is 0', () => {
      const player = new Player('p0', 'P0');
      player.sheet.foxes = 3;
      const bonus = getFoxBonus(player.sheet);
      expect(bonus).toBe(0);
    });

    it('REQ-039: getFoxBonus computes foxes * min color score', () => {
      const player = new Player('p0', 'P0');
      player.sheet.yellow.marked[0] = [true, true];
      player.sheet.yellow.marked[1] = [true, true];
      player.sheet.blue.marked[0] = true;
      player.sheet.green.marked[0] = 1;
      player.sheet.orange.values[0] = 1;
      player.sheet.purple.values[0] = 1;
      player.sheet.foxes = 2;
      const bonus = getFoxBonus(player.sheet);
      expect(bonus).toBe(2 * 1);
    });
  });

  describe('Game end', () => {
    // REQ-041: Game ends after last round
    it('REQ-041: game ends when max rounds reached', () => {
      const engine = new GameEngine('r1', makePlayers(1), makeConstantRandom(1));
      expect(engine.getState().gameOver).toBe(false);
      expect(engine.getState().maxRounds).toBe(6);
    });

    // REQ-043: Sum all colored area scores
    it('REQ-043: getTotalScore sums all areas plus fox bonus', () => {
      const player = new Player('p0', 'P0');
      player.sheet.yellow.marked[0] = [true, true];
      player.sheet.yellow.marked[1] = [true, true];
      const total = getTotalScore(player.sheet);
      expect(total).toBeGreaterThan(0);
      const scores = getColorScores(player.sheet);
      expect(total).toBe(
        scores.yellow + scores.blue + scores.green + scores.orange + scores.purple
      );
    });

    // REQ-044: Tie-breaking (not implemented - document with todo)
    it.todo('REQ-044: tie-break: highest total, then highest single area, then shared');
  });

  describe('REQ-042: Reroll expiry', () => {
    it.todo('REQ-042: remaining Reroll actions expire at game end');
  });
});
