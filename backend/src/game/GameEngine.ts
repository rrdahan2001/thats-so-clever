import type { Die, DieColor, GameState, ScoringSheet } from '../types/game.js';
import { Player } from './Player.js';
import { getTotalScore } from '../utils/scoring.js';
import {
  YELLOW_FOX_POSITIONS,
  BLUE_FOX_INDICES,
  GREEN_FOX_INDICES,
  ORANGE_FOX_INDICES,
  PURPLE_FOX_INDICES,
} from '../constants/foxes.js';

const DIE_COLORS: DieColor[] = ['white', 'yellow', 'blue', 'green', 'orange', 'purple'];

function getMaxRounds(playerCount: number): number {
  if (playerCount === 4) return 4;
  if (playerCount === 3) return 5;
  return 6; // 1 or 2 players
}

export class GameEngine {
  private state: GameState;
  private silverTray: Die[] = [];
  private passivePlayersChosen: Set<string> = new Set();
  private blueDieValue = 0;
  private whiteDieValue = 0;
  private randomSource: () => number;

  constructor(roomId: string, players: Player[], randomSource?: () => number) {
    this.randomSource = randomSource ?? (() => Math.random());
    const playerData = players.map((p) => p.toJSON());
    this.state = {
      roomId,
      players: playerData,
      currentPlayerIndex: 0,
      currentRound: 1,
      maxRounds: getMaxRounds(players.length),
      phase: 'rolling',
      dice: this.createDice(),
      rollsThisTurn: 0,
      selectedDie: null,
      gameOver: false,
      winnerId: null,
    };
  }

  getState(): GameState {
    return JSON.parse(JSON.stringify(this.state));
  }

  getSilverTray(): Die[] {
    return [...this.silverTray];
  }

  getBlueWhiteValues(): { blueDieValue: number; whiteDieValue: number } {
    return { blueDieValue: this.blueDieValue, whiteDieValue: this.whiteDieValue };
  }

  isMyTurn(playerId: string): boolean {
    const idx = this.state.players.findIndex((p) => p.id === playerId);
    return idx === this.state.currentPlayerIndex && this.state.phase !== 'ended';
  }

  private getCurrentPlayer() {
    return this.state.players[this.state.currentPlayerIndex];
  }

  private rollDie(): number {
    return Math.floor(this.randomSource() * 6) + 1;
  }

  private createDice(): Die[] {
    return DIE_COLORS.map((color) => ({
      color,
      value: this.rollDie(),
      available: true,
    }));
  }

  private advanceTurn(): void {
    this.state.rollsThisTurn = 0;
    this.state.selectedDie = null;
    this.state.dice = this.createDice();
    this.silverTray = [];
    this.blueDieValue = this.state.dice.find((d) => d.color === 'blue')?.value ?? 0;
    this.whiteDieValue = this.state.dice.find((d) => d.color === 'white')?.value ?? 0;
    this.passivePlayersChosen = new Set();
    this.state.phase = 'rolling';

    const nextIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;
    if (nextIndex === 0) {
      this.state.currentRound++;
      if (this.state.currentRound > this.state.maxRounds) {
        this.endGame();
        return;
      }
    }
    this.state.currentPlayerIndex = nextIndex;
  }

  private endGame(): void {
    this.state.gameOver = true;
    this.state.phase = 'ended';
    let maxScore = -1;
    let winnerId: string | null = null;
    for (const p of this.state.players) {
      const score = getTotalScore(p.sheet);
      if (score > maxScore) {
        maxScore = score;
        winnerId = p.id;
      }
    }
    this.state.winnerId = winnerId;
  }

  rollDice(playerId: string): { success: boolean; error?: string; skipped?: boolean } {
    if (!this.isMyTurn(playerId)) {
      return { success: false, error: 'Not your turn' };
    }
    if (this.state.phase !== 'rolling' && this.state.phase !== 'placing') {
      return { success: false, error: 'Invalid phase' };
    }
    if (this.state.rollsThisTurn >= 3) {
      return { success: false, error: 'Already rolled 3 times' };
    }
    const available = this.state.dice.filter((d) => d.available);
    if (available.length === 0) {
      this.finishActiveTurn();
      return { success: true };
    }
    for (let i = 0; i < this.state.dice.length; i++) {
      if (this.state.dice[i].available) {
        this.state.dice[i].value = this.rollDie();
      }
    }
    this.blueDieValue = this.state.dice.find((d) => d.color === 'blue')?.value ?? 0;
    this.whiteDieValue = this.state.dice.find((d) => d.color === 'white')?.value ?? 0;
    this.state.rollsThisTurn++;
    this.state.phase = 'selecting';
    this.state.selectedDie = null;

    const sheet = this.getCurrentPlayer()?.sheet;
    if (sheet && !available.some((d) => this.hasValidPlacementForDie(sheet, d))) {
      this.finishActiveTurn();
      return { success: true, skipped: true };
    }
    return { success: true };
  }

  selectDie(playerId: string, dieIndex: number): { success: boolean; error?: string; skipped?: boolean } {
    if (!this.isMyTurn(playerId)) {
      return { success: false, error: 'Not your turn' };
    }
    if (this.state.phase !== 'selecting') {
      return { success: false, error: 'Must select a die' };
    }
    const die = this.state.dice[dieIndex];
    if (!die || !die.available) {
      return { success: false, error: 'Invalid die' };
    }
    this.state.selectedDie = { ...die };
    const b = this.state.dice.find((d) => d.color === 'blue');
    const w = this.state.dice.find((d) => d.color === 'white');
    if (b) this.blueDieValue = b.value;
    if (w) this.whiteDieValue = w.value;
    const value = die.value;
    for (let i = 0; i < this.state.dice.length; i++) {
      if (this.state.dice[i].available && this.state.dice[i].value < value) {
        this.state.dice[i].available = false;
        this.silverTray.push({ ...this.state.dice[i] });
      }
    }
    this.state.dice[dieIndex].available = false;
    this.state.phase = 'placing';

    const sheet = this.getCurrentPlayer()?.sheet;
    if (sheet && !this.hasValidPlacementForDie(sheet, this.state.selectedDie)) {
      this.finishActiveTurn();
      return { success: true, skipped: true };
    }
    return { success: true };
  }

  placeDie(
    playerId: string,
    area: keyof ScoringSheet,
    placement: { index?: number; row?: number; col?: number; value?: number }
  ): { success: boolean; error?: string } {
    if (!this.isMyTurn(playerId)) {
      return { success: false, error: 'Not your turn' };
    }
    if (this.state.phase !== 'placing' || !this.state.selectedDie) {
      return { success: false, error: 'No die selected' };
    }
    if (area === 'foxes') {
      return { success: false, error: 'Cannot place on foxes' };
    }
    const player = this.getCurrentPlayer();
    const sheet = player.sheet;
    const die = this.state.selectedDie;
    const color = die.color === 'white' ? (area as DieColor) : die.color;
    const value = die.value;

    const result = this.validatePlacement(sheet, area, color, value, placement);
    if (!result.valid) {
      return { success: false, error: result.error };
    }

    this.applyPlacement(sheet, area, color, value, placement);
    this.state.selectedDie = null;
    this.state.phase = this.state.rollsThisTurn >= 3 ? 'placing' : 'rolling';
    const available = this.state.dice.filter((d) => d.available);
    if (available.length === 0 || this.state.rollsThisTurn >= 3) {
      this.finishActiveTurn();
    }
    return { success: true };
  }

  private validatePlacement(
    sheet: ScoringSheet,
    area: string,
    color: DieColor,
    value: number,
    placement: { index?: number; row?: number; col?: number; value?: number }
  ): { valid: boolean; error?: string } {
    if (area === 'yellow') {
      const row = value - 1;
      if (placement.index !== undefined) {
        const col = placement.index;
        if (row < 0 || row >= 6 || col < 0 || col >= 2) return { valid: false, error: 'Out of bounds' };
        if (sheet.yellow.marked[row]?.[col]) return { valid: false, error: 'Already marked' };
        return { valid: true };
      }
      const col = placement.col ?? 0;
      if (row < 0 || row >= 6 || col < 0 || col >= 2) return { valid: false, error: 'Out of bounds' };
      if (sheet.yellow.marked[row]?.[col]) return { valid: false, error: 'Already marked' };
      return { valid: true };
    }
    if (area === 'blue') {
      const sum = this.getBlueWhiteSum();
      if (placement.index === undefined) return { valid: false, error: 'Need index 0-10 for sum 2-12' };
      const targetSum = placement.index + 2;
      if (sum !== targetSum) return { valid: false, error: `Sum must be ${targetSum} (blue+white), got ${sum}` };
      if (placement.index < 0 || placement.index > 10) return { valid: false, error: 'Index must be 0-10' };
      if (sheet.blue.marked[placement.index]) return { valid: false, error: 'Already marked' };
      return { valid: true };
    }
    if (area === 'green') {
      const idx = sheet.green.marked.findIndex((v) => v === null);
      if (idx < 0) return { valid: false, error: 'Green area full' };
      const minValues = [1, 2, 3, 4, 5, 6];
      if (value < (minValues[idx] ?? 0)) return { valid: false, error: 'Value too low' };
      return { valid: true };
    }
    if (area === 'orange') {
      const idx = sheet.orange.values.findIndex((v) => v === null);
      if (idx < 0) return { valid: false, error: 'Orange area full' };
      return { valid: true };
    }
    if (area === 'purple') {
      const idx = sheet.purple.values.findIndex((v) => v === null);
      if (idx < 0) return { valid: false, error: 'Purple area full' };
      const prev = idx === 0 ? 0 : (sheet.purple.values[idx - 1] ?? 0);
      if (prev === 6) return { valid: true };
      if (value <= prev) return { valid: false, error: 'Must be higher than previous' };
      return { valid: true };
    }
    return { valid: false, error: 'Unknown area' };
  }

  private getBlueWhiteSum(): number {
    const blue = this.state.dice.find((d) => d.color === 'blue');
    const white = this.state.dice.find((d) => d.color === 'white');
    const b = blue?.available ? blue.value : this.blueDieValue;
    const w = white?.available ? white.value : this.whiteDieValue;
    return b + w;
  }

  /** Returns true if the die has at least one valid placement on the current player's sheet */
  private hasValidPlacementForDie(sheet: ScoringSheet, die: Die): boolean {
    const value = die.value;
    const sum = this.getBlueWhiteSum();

    if (die.color === 'white') {
      return (
        this.canPlaceYellow(sheet, value) ||
        this.canPlaceBlue(sheet, sum) ||
        this.canPlaceGreen(sheet, value) ||
        this.canPlaceOrange(sheet) ||
        this.canPlacePurple(sheet, value)
      );
    }

    switch (die.color) {
      case 'yellow':
        return this.canPlaceYellow(sheet, value);
      case 'blue':
        return this.canPlaceBlue(sheet, sum);
      case 'green':
        return this.canPlaceGreen(sheet, value);
      case 'orange':
        return this.canPlaceOrange(sheet);
      case 'purple':
        return this.canPlacePurple(sheet, value);
      default:
        return false;
    }
  }

  private canPlaceYellow(sheet: ScoringSheet, value: number): boolean {
    const row = value - 1;
    if (row < 0 || row >= 6) return false;
    return sheet.yellow.marked[row]?.some((m) => !m) ?? false;
  }

  private canPlaceBlue(sheet: ScoringSheet, sum: number): boolean {
    if (sum < 2 || sum > 12) return false;
    const idx = sum - 2;
    return !sheet.blue.marked[idx];
  }

  private canPlaceGreen(sheet: ScoringSheet, value: number): boolean {
    const idx = sheet.green.marked.findIndex((v) => v === null);
    if (idx < 0) return false;
    const mins = [1, 2, 3, 4, 5, 6];
    return value >= (mins[idx] ?? 0);
  }

  private canPlaceOrange(sheet: ScoringSheet): boolean {
    return sheet.orange.values.some((v) => v === null);
  }

  private canPlacePurple(sheet: ScoringSheet, value: number): boolean {
    const idx = sheet.purple.values.findIndex((v) => v === null);
    if (idx < 0) return false;
    const prev = idx === 0 ? 0 : (sheet.purple.values[idx - 1] ?? 0);
    return prev === 6 || value > prev;
  }

  private applyPlacement(
    sheet: ScoringSheet,
    area: string,
    _color: DieColor,
    value: number,
    placement: { index?: number; row?: number; col?: number }
  ): void {
    if (area === 'yellow') {
      const row = value - 1;
      const col = placement.index ?? placement.col ?? 0;
      if (row >= 0 && row < 6 && col >= 0 && col < 2) {
        sheet.yellow.marked[row] = sheet.yellow.marked[row] ?? [false, false];
        sheet.yellow.marked[row][col] = true;
        this.maybeAwardFox(sheet, 'yellow', { row, col });
      }
    } else if (area === 'blue' && placement.index !== undefined) {
      sheet.blue.marked[placement.index] = true;
      this.maybeAwardFox(sheet, 'blue', { index: placement.index });
    } else if (area === 'green') {
      const idx = sheet.green.marked.findIndex((v) => v === null);
      if (idx >= 0) {
        sheet.green.marked[idx] = value;
        this.maybeAwardFox(sheet, 'green', { index: idx });
      }
    } else if (area === 'orange') {
      const idx = sheet.orange.values.findIndex((v) => v === null);
      if (idx >= 0) {
        sheet.orange.values[idx] = value;
        this.maybeAwardFox(sheet, 'orange', { index: idx });
      }
    } else if (area === 'purple') {
      const idx = sheet.purple.values.findIndex((v) => v === null);
      if (idx >= 0) {
        sheet.purple.values[idx] = value;
        this.maybeAwardFox(sheet, 'purple', { index: idx });
      }
    }
  }

  private maybeAwardFox(
    sheet: ScoringSheet,
    area: string,
    ctx: { row?: number; col?: number; index?: number }
  ): void {
    if (area === 'yellow' && ctx.row !== undefined && ctx.col !== undefined) {
      if (YELLOW_FOX_POSITIONS.some(([r, c]) => r === ctx.row && c === ctx.col)) {
        sheet.foxes++;
      }
    } else if (area === 'blue' && ctx.index !== undefined) {
      if (BLUE_FOX_INDICES.includes(ctx.index)) sheet.foxes++;
    } else if (area === 'green' && ctx.index !== undefined) {
      if (GREEN_FOX_INDICES.includes(ctx.index)) sheet.foxes++;
    } else if (area === 'orange' && ctx.index !== undefined) {
      if (ORANGE_FOX_INDICES.includes(ctx.index)) sheet.foxes++;
    } else if (area === 'purple' && ctx.index !== undefined) {
      if (PURPLE_FOX_INDICES.includes(ctx.index)) sheet.foxes++;
    }
  }

  private finishActiveTurn(): void {
    const available = this.state.dice.filter((d) => d.available);
    available.forEach((d) => this.silverTray.push({ ...d }));
    this.state.dice = this.state.dice.map((d) => ({ ...d, available: false }));
    this.state.selectedDie = null;
    this.state.rollsThisTurn = 0;

    const passiveCount = this.state.players.filter((p) => p.id !== this.getCurrentPlayer()?.id).length;
    const isSolo = this.state.players.length === 1;
    // Solo: player is both active and passive each round — enter passive phase for them to choose from silver tray
    if (passiveCount === 0 && !isSolo) {
      this.advanceTurn();
    } else {
      this.state.phase = 'passive';
    }
  }

  passTurn(playerId: string): { success: boolean; error?: string } {
    if (!this.isMyTurn(playerId)) {
      return { success: false, error: 'Not your turn' };
    }
    if (this.state.phase !== 'placing' || !this.state.selectedDie) {
      return { success: false, error: 'No die selected to pass' };
    }
    const sheet = this.getCurrentPlayer()?.sheet;
    if (!sheet || this.hasValidPlacementForDie(sheet, this.state.selectedDie)) {
      return { success: false, error: 'You have a valid move — cannot pass' };
    }
    this.finishActiveTurn();
    return { success: true };
  }

  passiveChooseDie(playerId: string, dieIndex: number, asColor?: DieColor): { success: boolean; error?: string } {
    if (this.state.phase !== 'passive') {
      return { success: false, error: 'Not passive phase' };
    }
    const playerIdx = this.state.players.findIndex((p) => p.id === playerId);
    if (playerIdx < 0) return { success: false, error: 'Unknown player' };
    const isSolo = this.state.players.length === 1;
    if (!isSolo && playerIdx === this.state.currentPlayerIndex) {
      return { success: false, error: 'Active player does not choose in passive phase' };
    }
    if (this.passivePlayersChosen.has(playerId)) {
      return { success: false, error: 'Already chosen' };
    }
    const die = this.silverTray[dieIndex];
    if (!die) return { success: false, error: 'Invalid die' };
    if (die.color === 'white' && !asColor) {
      return { success: false, error: 'White die requires color choice (yellow, blue, green, orange, purple)' };
    }
    const validColors: DieColor[] = ['yellow', 'blue', 'green', 'orange', 'purple'];
    if (die.color === 'white' && asColor && !validColors.includes(asColor)) {
      return { success: false, error: 'Invalid color' };
    }
    this.passivePlayersChosen.add(playerId);
    const player = this.state.players[playerIdx];
    this.applyPassivePlacement(player.sheet, die, asColor ?? die.color);
    const passivePlayerCount = isSolo ? 1 : this.state.players.filter((p) => p.id !== this.getCurrentPlayer()?.id).length;
    const allChosen = this.passivePlayersChosen.size === passivePlayerCount;
    if (allChosen) {
      this.advanceTurn();
    }
    return { success: true };
  }

  private applyPassivePlacement(sheet: ScoringSheet, die: Die, chosenColor: DieColor): void {
    const color: DieColor = die.color === 'white' ? chosenColor : die.color;
    const value = die.value;
    if (color === 'yellow') {
      const row = value - 1;
      if (row >= 0 && row < 6) {
        for (let c = 0; c < 2; c++) {
          if (!sheet.yellow.marked[row]?.[c]) {
            sheet.yellow.marked[row] = sheet.yellow.marked[row] ?? [false, false];
            sheet.yellow.marked[row][c] = true;
            this.maybeAwardFox(sheet, 'yellow', { row, col: c });
            return;
          }
        }
      }
    }
    if (color === 'blue') {
      const sum = this.blueDieValue + this.whiteDieValue;
      const idx = sum - 2;
      if (idx >= 0 && idx <= 10 && !sheet.blue.marked[idx]) {
        sheet.blue.marked[idx] = true;
        this.maybeAwardFox(sheet, 'blue', { index: idx });
      }
    }
    if (color === 'green') {
      const idx = sheet.green.marked.findIndex((v) => v === null);
      const minValues = [1, 2, 3, 4, 5, 6];
      if (idx >= 0 && value >= (minValues[idx] ?? 0)) {
        sheet.green.marked[idx] = value;
        this.maybeAwardFox(sheet, 'green', { index: idx });
      }
    }
    if (color === 'orange') {
      const idx = sheet.orange.values.findIndex((v) => v === null);
      if (idx >= 0) {
        sheet.orange.values[idx] = value;
        this.maybeAwardFox(sheet, 'orange', { index: idx });
      }
    }
    if (color === 'purple') {
      const idx = sheet.purple.values.findIndex((v) => v === null);
      const prev = idx === 0 ? 0 : (sheet.purple.values[idx - 1] ?? 0);
      if (idx >= 0 && (prev === 6 || value > prev)) {
        sheet.purple.values[idx] = value;
        this.maybeAwardFox(sheet, 'purple', { index: idx });
      }
    }
  }
}
