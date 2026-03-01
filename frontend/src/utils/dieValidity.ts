import type { Die, ScoringSheet } from '../types/game';

export interface ValidityResult {
  valid: boolean;
  reason?: string;
}

export function getValidColorsForWhite(
  sheet: ScoringSheet,
  value: number,
  blueWhiteSum: number
): ('yellow' | 'blue' | 'green' | 'orange' | 'purple')[] {
  const colors: ('yellow' | 'blue' | 'green' | 'orange' | 'purple')[] = [];
  if (isYellowValid(sheet, value)) colors.push('yellow');
  if (isBlueValid(sheet, blueWhiteSum)) colors.push('blue');
  if (isGreenValid(sheet, value)) colors.push('green');
  if (isOrangeValid(sheet)) colors.push('orange');
  if (isPurpleValid(sheet, value)) colors.push('purple');
  return colors;
}

export function getDieValidity(
  sheet: ScoringSheet,
  die: Die,
  blueWhiteSum: number
): ValidityResult {
  const value = die.value;
  const color = die.color;

  if (color === 'white') {
    const anyValid =
      isYellowValid(sheet, value) ||
      isBlueValid(sheet, blueWhiteSum) ||
      isGreenValid(sheet, value) ||
      isOrangeValid(sheet) ||
      isPurpleValid(sheet, value);
    return anyValid ? { valid: true } : { valid: false, reason: 'No valid placement for white die (value ' + value + ') as any color' };
  }

  switch (color) {
    case 'yellow':
      return isYellowValid(sheet, value)
        ? { valid: true }
        : { valid: false, reason: 'No open slot for value ' + value };
    case 'blue':
      return isBlueValid(sheet, blueWhiteSum)
        ? { valid: true }
        : { valid: false, reason: 'Sum ' + blueWhiteSum + ' already marked or not in range 2–12' };
    case 'green':
      return isGreenValid(sheet, value)
        ? { valid: true }
        : { valid: false, reason: 'Value ' + value + ' too low for next green slot' };
    case 'orange':
      return isOrangeValid(sheet) ? { valid: true } : { valid: false, reason: 'Orange area full' };
    case 'purple':
      return isPurpleValid(sheet, value)
        ? { valid: true }
        : { valid: false, reason: 'Value ' + value + ' must be higher than previous (or previous is 6)' };
    default:
      return { valid: false, reason: 'Unknown die color' };
  }
}

function isYellowValid(sheet: ScoringSheet, value: number): boolean {
  const row = value - 1;
  if (row < 0 || row >= 6) return false;
  return sheet.yellow.marked[row]?.some((m) => !m) ?? false;
}

function isBlueValid(sheet: ScoringSheet, sum: number): boolean {
  if (sum < 2 || sum > 12) return false;
  const idx = sum - 2;
  return !sheet.blue.marked[idx];
}

function isGreenValid(sheet: ScoringSheet, value: number): boolean {
  const idx = sheet.green.marked.findIndex((v) => v === null);
  if (idx < 0) return false;
  const mins = [1, 2, 3, 4, 5, 6];
  return value >= (mins[idx] ?? 0);
}

function isOrangeValid(sheet: ScoringSheet): boolean {
  return sheet.orange.values.some((v) => v === null);
}

function isPurpleValid(sheet: ScoringSheet, value: number): boolean {
  const idx = sheet.purple.values.findIndex((v) => v === null);
  if (idx < 0) return false;
  const prev = idx === 0 ? 0 : (sheet.purple.values[idx - 1] ?? 0);
  return prev === 6 || value > prev;
}
