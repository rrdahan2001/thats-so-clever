import { Server, Socket } from 'socket.io';
import { GameEngine } from './GameEngine.js';
import { Player } from './Player.js';
import type { GameState, ScoringSheet } from '../types/game.js';

export class GameRoom {
  id: string;
  private players: Map<string, Player> = new Map();
  private sockets: Map<string, string> = new Map(); // socketId -> playerId
  private engine: GameEngine | null = null;
  private io: Server;
  private maxPlayers = 4;

  constructor(id: string, io: Server) {
    this.id = id;
    this.io = io;
  }

  addPlayer(socketId: string, playerId: string, name: string): boolean {
    if (this.engine) return false;
    if (this.players.size >= this.maxPlayers) return false;
    if (this.players.has(playerId)) return false;
    const player = new Player(playerId, name);
    this.players.set(playerId, player);
    this.sockets.set(socketId, playerId);
    return true;
  }

  removePlayer(socketId: string): void {
    const playerId = this.sockets.get(socketId);
    this.sockets.delete(socketId);
    if (playerId) {
      const player = this.players.get(playerId);
      if (player) {
        if (this.engine) {
          player.isConnected = false;
        } else {
          this.players.delete(playerId);
          const players = this.getPlayerList();
          this.io.to(this.id).emit('lobby-update', { roomId: this.id, players });
        }
      }
    }
  }

  getPlayerBySocket(socketId: string): Player | null {
    const playerId = this.sockets.get(socketId);
    return playerId ? (this.players.get(playerId) ?? null) : null;
  }

  getPlayerCount(): number {
    return this.players.size;
  }

  startGame(): boolean {
    if (this.engine || this.players.size < 1) return false;
    const playerList = Array.from(this.players.values());
    this.engine = new GameEngine(this.id, playerList);
    this.broadcastState();
    return true;
  }

  private broadcastState(): void {
    if (!this.engine) return;
    const state = this.engine.getState();
    const silverTray = this.engine.getSilverTray();
    const blueWhite = this.engine.getBlueWhiteValues();
    const room = this.io.to(this.id);
    room.emit('game-state', { ...state, silverTray, ...blueWhite });
  }

  handleRoll(socket: Socket): void {
    const player = this.getPlayerBySocket(socket.id);
    if (!player || !this.engine) {
      socket.emit('error', 'Not in game or game not started');
      return;
    }
    const result = this.engine.rollDice(player.id);
    if (!result.success) {
      socket.emit('error', result.error);
      return;
    }
    if (result.skipped) {
      this.io.to(this.id).emit('info', 'No playable moves — skipping to next turn');
    }
    this.broadcastState();
  }

  handleSelectDie(socket: Socket, dieIndex: number): void {
    const player = this.getPlayerBySocket(socket.id);
    if (!player || !this.engine) {
      socket.emit('error', 'Not in game or game not started');
      return;
    }
    const result = this.engine.selectDie(player.id, dieIndex);
    if (!result.success) {
      socket.emit('error', result.error);
      return;
    }
    if (result.skipped) {
      this.io.to(this.id).emit('info', 'No playable moves — skipping to next turn');
    }
    this.broadcastState();
  }

  handlePlaceDie(socket: Socket, area: string, placement: Record<string, number>): void {
    const player = this.getPlayerBySocket(socket.id);
    if (!player || !this.engine) {
      socket.emit('error', 'Not in game or game not started');
      return;
    }
    const result = this.engine.placeDie(player.id, area as keyof ScoringSheet, placement);
    if (!result.success) {
      socket.emit('error', result.error);
      return;
    }
    this.broadcastState();
  }

  handlePassTurn(socket: Socket): void {
    const player = this.getPlayerBySocket(socket.id);
    if (!player || !this.engine) {
      socket.emit('error', 'Not in game or game not started');
      return;
    }
    const result = this.engine.passTurn(player.id);
    if (!result.success) {
      socket.emit('error', result.error);
      return;
    }
    this.io.to(this.id).emit('info', 'No playable moves — skipping to next turn');
    this.broadcastState();
  }

  handlePassiveChoose(socket: Socket, data: number | { dieIndex: number; asColor: string }): void {
    const dieIndex = typeof data === 'number' ? data : data.dieIndex;
    const asColor = typeof data === 'object' ? (data.asColor as import('../types/game.js').DieColor) : undefined;
    const player = this.getPlayerBySocket(socket.id);
    if (!player || !this.engine) {
      socket.emit('error', 'Not in game or game not started');
      return;
    }
    const result = this.engine.passiveChooseDie(player.id, dieIndex, asColor);
    if (!result.success) {
      socket.emit('error', result.error);
      return;
    }
    this.broadcastState();
  }

  getState(): GameState | null {
    return this.engine?.getState() ?? null;
  }

  getPlayerList(): { id: string; name: string }[] {
    return Array.from(this.players.values()).map((p) => ({ id: p.id, name: p.name }));
  }
}
