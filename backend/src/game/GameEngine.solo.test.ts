import { describe, it, expect } from 'vitest';
import { GameEngine } from './GameEngine.js';
import { Player } from './Player.js';

function makePlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => new Player(`p${i}`, `Player ${i}`));
}

function makeDeterministicRandom(): () => number {
  let callCount = 0;
  return () => {
    const val = (callCount % 6) / 6;
    callCount++;
    return val;
  };
}

describe('GameEngine solo mode', () => {
  describe('REQ-045: Active/Passive alternation', () => {
    it('REQ-045: solo player alternates between Active and Passive roles per round', () => {
      const random = makeDeterministicRandom();
      const engine = new GameEngine('r1', makePlayers(1), random);
      expect(engine.getState().maxRounds).toBe(6);

      // Round 1: Active phase
      expect(engine.getState().phase).toBe('rolling');
      engine.rollDice('p0');
      expect(engine.getState().phase).toBe('selecting');
      const purpleIdx = engine.getState().dice.findIndex((d) => d.color === 'purple' && d.available);
      if (purpleIdx < 0) return;
      engine.selectDie('p0', purpleIdx);
      engine.placeDie('p0', 'purple', {});
      // Solo: after active turn, player enters passive phase (not advanceTurn)
      expect(engine.getState().phase).toBe('passive');
      expect(engine.getState().currentRound).toBe(1);

      // Round 1: Passive phase — solo player chooses from silver tray
      const silverTray = engine.getSilverTray();
      expect(silverTray.length).toBeGreaterThan(0);
      const dieIdx = silverTray.findIndex((d) => d.color !== 'white');
      const idx = dieIdx >= 0 ? dieIdx : 0;
      const asColor = silverTray[idx]?.color === 'white' ? 'yellow' : undefined;
      const passiveResult = engine.passiveChooseDie('p0', idx, asColor);
      expect(passiveResult.success).toBe(true);
      // After passive choice, advance to next round
      expect(engine.getState().phase).toBe('rolling');
      expect(engine.getState().currentRound).toBe(2);
    });
  });

  describe('REQ-046: Passive role dice', () => {
    it.todo('REQ-046: in passive role, player rolls all 6 and places 3 lowest on Silver Platter');
  });

  describe('REQ-047: Tie priority', () => {
    it.todo('REQ-047: when dice values tied in passive role, prioritize die closest to Silver Platter');
  });
});
