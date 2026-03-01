// Scoring calculations for That's So Clever
// Based on physical game: yellow columns 10-20, blue scale, green/orange/purple sums

import type { ScoringSheet } from '../types/game.js';

// Yellow: Each of 4 "columns" (pairs of value groups) can complete - simplified: 6 value rows, 2 slots each.
// When both slots of values 1-2, 3-4, 5-6 etc are filled we score. Use: pairs (1,2), (3,4), (5,6) = 10, 14, 16
const YELLOW_PAIR_SCORES: Record<number, number> = { 0: 10, 1: 14, 2: 20 }; // pairs 0-1, 2-3, 4-5

export function getYellowScore(sheet: ScoringSheet): number {
  let score = 0;
  for (let pair = 0; pair < 3; pair++) {
    const r1 = pair * 2;
    const r2 = pair * 2 + 1;
    const bothRowsComplete =
      (sheet.yellow.marked[r1]?.[0] && sheet.yellow.marked[r1]?.[1]) &&
      (sheet.yellow.marked[r2]?.[0] && sheet.yellow.marked[r2]?.[1]);
    if (bothRowsComplete) {
      score += YELLOW_PAIR_SCORES[pair] ?? 0;
    }
  }
  return score;
}

// Blue: points based on count of marks (scale: 1=1, 2=3, 3=6, 4=7, 5=10, 6=15, 7=21, 8=28, 9=37, 10=46, 11=56)
const BLUE_MARK_SCORES: Record<number, number> = {
  1: 1, 2: 3, 3: 6, 4: 7, 5: 10, 6: 15, 7: 21, 8: 28, 9: 37, 10: 46, 11: 56,
};

export function getBlueScore(sheet: ScoringSheet): number {
  const count = sheet.blue.marked.filter(Boolean).length;
  return BLUE_MARK_SCORES[count] ?? 0;
}

// Green: score from last marked space (positions have values 1-21 typically)
const GREEN_SPACE_SCORES = [0, 1, 3, 6, 10, 15, 21]; // index = marks count

export function getGreenScore(sheet: ScoringSheet): number {
  const count = sheet.green.marked.filter((v) => v !== null).length;
  return GREEN_SPACE_SCORES[count] ?? 0;
}

// Orange: sum of values, some have x2 x3
const ORANGE_MULTIPLIERS = [1, 1, 1, 2, 1, 3];

export function getOrangeScore(sheet: ScoringSheet): number {
  let score = 0;
  for (let i = 0; i < 6; i++) {
    const v = sheet.orange.values[i];
    if (v !== null) {
      score += v * (ORANGE_MULTIPLIERS[i] ?? 1);
    }
  }
  return score;
}

// Purple: sum of values
export function getPurpleScore(sheet: ScoringSheet): number {
  return sheet.purple.values.reduce((s: number, v) => s + (v ?? 0), 0);
}

export function getColorScores(sheet: ScoringSheet): Record<string, number> {
  return {
    yellow: getYellowScore(sheet),
    blue: getBlueScore(sheet),
    green: getGreenScore(sheet),
    orange: getOrangeScore(sheet),
    purple: getPurpleScore(sheet),
  };
}

export function getFoxBonus(sheet: ScoringSheet): number {
  const scores = getColorScores(sheet);
  const minScore = Math.min(...Object.values(scores));
  if (minScore === 0) return 0;
  return sheet.foxes * minScore;
}

export function getTotalScore(sheet: ScoringSheet): number {
  const scores = getColorScores(sheet);
  const colorTotal = Object.values(scores).reduce((a, b) => a + b, 0);
  return colorTotal + getFoxBonus(sheet);
}
