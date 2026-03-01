import { describe, it } from 'vitest';

describe('GameEngine actions', () => {
  describe('REQ-032: Action Points', () => {
    it.todo('REQ-032: system tracks Reroll and Extra Die action points');
  });

  describe('REQ-033: Reroll Action', () => {
    it.todo('REQ-033: Reroll action usable only by active player');
    it.todo('REQ-033: Reroll rerolls all dice on table');
    it.todo('REQ-033: Reroll consumes one Action Point');
  });

  describe('REQ-034-035: Extra Die Action', () => {
    it.todo('REQ-034: Extra Die usable only at end of turn');
    it.todo('REQ-034: Extra Die allows selecting any die including from Silver Platter');
    it.todo('REQ-035: Each die can only be chosen once per turn with Extra Die');
  });

  describe('REQ-036-037: Bonuses', () => {
    it.todo('REQ-036: Immediate bonuses on number background fields');
    it.todo('REQ-037: Chain bonuses execute second bonus immediately');
  });
});
