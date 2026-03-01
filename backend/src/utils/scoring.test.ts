import { describe, it, expect } from 'vitest';
import {
  getYellowScore,
  getBlueScore,
  getGreenScore,
  getOrangeScore,
  getPurpleScore,
  getColorScores,
  getFoxBonus,
  getTotalScore,
} from './scoring.js';
import type { ScoringSheet } from '../types/game.js';

function createEmptySheet(): ScoringSheet {
  return {
    yellow: {
      marked: Array(6)
        .fill(null)
        .map(() => Array(2).fill(false)),
    },
    blue: { marked: Array(11).fill(false) },
    green: { marked: Array(6).fill(null) },
    orange: { values: Array(6).fill(null) },
    purple: { values: Array(6).fill(null) },
    foxes: 0,
  };
}

describe('scoring', () => {
  describe('getYellowScore', () => {
    // REQ-018, REQ-019: Yellow area - any order, column completion triggers bonus
    it('returns 0 for empty sheet', () => {
      expect(getYellowScore(createEmptySheet())).toBe(0);
    });

    it('returns 10 when pair 0-1 (values 1-2) columns complete', () => {
      const sheet = createEmptySheet();
      sheet.yellow.marked[0] = [true, true]; // value 1 both slots
      sheet.yellow.marked[1] = [true, true]; // value 2 both slots
      expect(getYellowScore(sheet)).toBe(10);
    });

    it('returns 14 when pair 2-3 (values 3-4) columns complete', () => {
      const sheet = createEmptySheet();
      sheet.yellow.marked[2] = [true, true];
      sheet.yellow.marked[3] = [true, true];
      expect(getYellowScore(sheet)).toBe(14);
    });

    it('returns 20 when pair 4-5 (values 5-6) columns complete', () => {
      const sheet = createEmptySheet();
      sheet.yellow.marked[4] = [true, true];
      sheet.yellow.marked[5] = [true, true];
      expect(getYellowScore(sheet)).toBe(20);
    });

    it('sums multiple completed column pairs', () => {
      const sheet = createEmptySheet();
      sheet.yellow.marked[0] = [true, true];
      sheet.yellow.marked[1] = [true, true];
      sheet.yellow.marked[2] = [true, true];
      sheet.yellow.marked[3] = [true, true];
      expect(getYellowScore(sheet)).toBe(10 + 14);
    });

    it('does not score incomplete pairs', () => {
      const sheet = createEmptySheet();
      sheet.yellow.marked[0] = [true, false];
      sheet.yellow.marked[1] = [true, true];
      expect(getYellowScore(sheet)).toBe(0);
    });
  });

  describe('getBlueScore', () => {
    it('returns 0 for no marks', () => {
      expect(getBlueScore(createEmptySheet())).toBe(0);
    });

    it('returns 1 for 1 mark', () => {
      const sheet = createEmptySheet();
      sheet.blue.marked[0] = true;
      expect(getBlueScore(sheet)).toBe(1);
    });

    it('returns 3 for 2 marks', () => {
      const sheet = createEmptySheet();
      sheet.blue.marked[0] = true;
      sheet.blue.marked[1] = true;
      expect(getBlueScore(sheet)).toBe(3);
    });

    it('returns 56 for 11 marks', () => {
      const sheet = createEmptySheet();
      sheet.blue.marked = Array(11).fill(true);
      expect(getBlueScore(sheet)).toBe(56);
    });
  });

  describe('getGreenScore', () => {
    // REQ-024, REQ-025: Green left-to-right, minimum values per space
    it('returns 0 for no marks', () => {
      expect(getGreenScore(createEmptySheet())).toBe(0);
    });

    it('returns 1 for 1 mark', () => {
      const sheet = createEmptySheet();
      sheet.green.marked[0] = 1;
      expect(getGreenScore(sheet)).toBe(1);
    });

    it('returns 3 for 2 marks', () => {
      const sheet = createEmptySheet();
      sheet.green.marked[0] = 1;
      sheet.green.marked[1] = 2;
      expect(getGreenScore(sheet)).toBe(3);
    });

    it('returns 21 for 6 marks', () => {
      const sheet = createEmptySheet();
      sheet.green.marked = [1, 2, 3, 4, 5, 6];
      expect(getGreenScore(sheet)).toBe(21);
    });
  });

  describe('getOrangeScore', () => {
    // REQ-028: Orange multiplies die value by space multiplier
    it('returns 0 for no values', () => {
      expect(getOrangeScore(createEmptySheet())).toBe(0);
    });

    it('applies x1 multiplier to first three spaces', () => {
      const sheet = createEmptySheet();
      sheet.orange.values[0] = 4;
      sheet.orange.values[1] = 3;
      sheet.orange.values[2] = 5;
      expect(getOrangeScore(sheet)).toBe(4 + 3 + 5);
    });

    it('applies x2 multiplier to fourth space', () => {
      const sheet = createEmptySheet();
      sheet.orange.values[3] = 4;
      expect(getOrangeScore(sheet)).toBe(8);
    });

    it('applies x3 multiplier to sixth space', () => {
      const sheet = createEmptySheet();
      sheet.orange.values[5] = 4;
      expect(getOrangeScore(sheet)).toBe(12);
    });

    it('sums all values with correct multipliers', () => {
      const sheet = createEmptySheet();
      sheet.orange.values = [2, 3, 1, 4, 5, 6]; // 1x,1x,1x,2x,1x,3x
      expect(getOrangeScore(sheet)).toBe(2 + 3 + 1 + 8 + 5 + 18);
    });
  });

  describe('getPurpleScore', () => {
    // REQ-029, REQ-030: Purple left-to-right, ascending (6 resets)
    it('returns 0 for no values', () => {
      expect(getPurpleScore(createEmptySheet())).toBe(0);
    });

    it('returns sum of values', () => {
      const sheet = createEmptySheet();
      sheet.purple.values = [1, 3, 5, 6, 2, 4];
      expect(getPurpleScore(sheet)).toBe(1 + 3 + 5 + 6 + 2 + 4);
    });
  });

  describe('getFoxBonus', () => {
    // REQ-039: Fox points = foxes * lowest colored area
    // REQ-040: Foxes = 0 if any area scores 0
    it('returns 0 when foxes is 0', () => {
      const sheet = createEmptySheet();
      sheet.yellow.marked[0] = [true, true];
      sheet.yellow.marked[1] = [true, true];
      expect(getFoxBonus(sheet)).toBe(0);
    });

    it('returns 0 when any color area scores 0', () => {
      const sheet = createEmptySheet();
      sheet.foxes = 3;
      sheet.yellow.marked[0] = [true, true];
      sheet.yellow.marked[1] = [true, true]; // yellow = 10
      // blue, green, orange, purple all 0
      expect(getFoxBonus(sheet)).toBe(0);
    });

    it('returns foxes * min color score when all areas have points', () => {
      const sheet = createEmptySheet();
      sheet.foxes = 2;
      sheet.yellow.marked[0] = [true, true];
      sheet.yellow.marked[1] = [true, true]; // 10
      sheet.blue.marked[0] = true; // 1
      sheet.green.marked[0] = 1; // 1
      sheet.orange.values[0] = 1; // 1
      sheet.purple.values[0] = 1; // 1
      expect(getFoxBonus(sheet)).toBe(2 * 1);
    });
  });

  describe('getTotalScore', () => {
    // REQ-043: Sum all colored area scores + fox bonus
    it('returns 0 for empty sheet', () => {
      expect(getTotalScore(createEmptySheet())).toBe(0);
    });

    it('sums all color scores and fox bonus', () => {
      const sheet = createEmptySheet();
      sheet.yellow.marked[0] = [true, true];
      sheet.yellow.marked[1] = [true, true]; // 10
      sheet.blue.marked[0] = true; // 1
      sheet.green.marked[0] = 1; // 1
      sheet.orange.values[0] = 1; // 1
      sheet.purple.values[0] = 1; // 1
      sheet.foxes = 1;
      const colorTotal = 10 + 1 + 1 + 1 + 1;
      const foxBonus = 1 * 1;
      expect(getTotalScore(sheet)).toBe(colorTotal + foxBonus);
    });
  });

  describe('getColorScores', () => {
    it('returns all color scores', () => {
      const sheet = createEmptySheet();
      const scores = getColorScores(sheet);
      expect(scores).toEqual({
        yellow: 0,
        blue: 0,
        green: 0,
        orange: 0,
        purple: 0,
      });
    });
  });
});
