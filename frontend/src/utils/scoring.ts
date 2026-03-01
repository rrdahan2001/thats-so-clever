import type { ScoringSheet } from '../types/game';

const YELLOW_PAIR_SCORES: Record<number, number> = { 0: 10, 1: 14, 2: 20 };
const BLUE_MARK_SCORES: Record<number, number> = {
  1: 1, 2: 3, 3: 6, 4: 7, 5: 10, 6: 15, 7: 21, 8: 28, 9: 37, 10: 46, 11: 56,
};
const GREEN_SPACE_SCORES = [0, 1, 3, 6, 10, 15, 21];
const ORANGE_MULTIPLIERS = [1, 1, 1, 2, 1, 3];

export function getYellowScore(sheet: ScoringSheet): number {
  let score = 0;
  for (let pair = 0; pair < 3; pair++) {
    const r1 = pair * 2;
    const r2 = pair * 2 + 1;
    const both =
      (sheet.yellow.marked[r1]?.[0] && sheet.yellow.marked[r1]?.[1]) &&
      (sheet.yellow.marked[r2]?.[0] && sheet.yellow.marked[r2]?.[1]);
    if (both) score += YELLOW_PAIR_SCORES[pair] ?? 0;
  }
  return score;
}

export function getBlueScore(sheet: ScoringSheet): number {
  const count = sheet.blue.marked.filter(Boolean).length;
  return BLUE_MARK_SCORES[count] ?? 0;
}

export function getGreenScore(sheet: ScoringSheet): number {
  const count = sheet.green.marked.filter((v) => v !== null).length;
  return GREEN_SPACE_SCORES[count] ?? 0;
}

export function getOrangeScore(sheet: ScoringSheet): number {
  let score = 0;
  for (let i = 0; i < 6; i++) {
    const v = sheet.orange.values[i];
    if (v !== null) score += v * (ORANGE_MULTIPLIERS[i] ?? 1);
  }
  return score;
}

export function getPurpleScore(sheet: ScoringSheet): number {
  return sheet.purple.values.reduce((s: number, v) => s + (v ?? 0), 0);
}

export function getFoxBonus(sheet: ScoringSheet): number {
  const scores = {
    yellow: getYellowScore(sheet),
    blue: getBlueScore(sheet),
    green: getGreenScore(sheet),
    orange: getOrangeScore(sheet),
    purple: getPurpleScore(sheet),
  };
  const min = Math.min(...Object.values(scores));
  if (min === 0) return 0;
  return sheet.foxes * min;
}

export function getTotalScore(sheet: ScoringSheet): number {
  const colorTotal =
    getYellowScore(sheet) +
    getBlueScore(sheet) +
    getGreenScore(sheet) +
    getOrangeScore(sheet) +
    getPurpleScore(sheet);
  return colorTotal + getFoxBonus(sheet);
}
