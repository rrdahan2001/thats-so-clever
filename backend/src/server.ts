import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameRoom } from './game/GameRoom.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGIN },
});

const rooms = new Map<string, GameRoom>();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', (data: { roomId: string; playerId: string; playerName: string; createIfNotExists?: boolean }) => {
    const { roomId, playerId, playerName, createIfNotExists } = data || {};
    if (!roomId || !playerId || !playerName) {
      socket.emit('error', 'Missing roomId, playerId, or playerName');
      return;
    }
    let room = rooms.get(roomId);
    if (!room) {
      if (createIfNotExists) {
        room = new GameRoom(roomId, io);
        rooms.set(roomId, room);
      } else {
        socket.emit('error', 'Room not found. Please check the room code and try again.');
        return;
      }
    }
    const ok = room.addPlayer(socket.id, playerId, playerName);
    if (!ok) {
      socket.emit('error', 'Could not join room (full or game started)');
      return;
    }
    socket.join(roomId);
    socket.emit('joined', { roomId, playerId });
    const state = room.getState();
    if (state) {
      socket.emit('game-state', { ...state, silverTray: [] });
    } else {
      const players = room.getPlayerList();
      io.to(roomId).emit('lobby-update', { roomId, players });
    }
  });

  socket.on('start-game', () => {
    const roomId = Array.from(socket.rooms).find((r) => r !== socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (!room) return;
    const started = room.startGame();
    if (!started) {
      socket.emit('error', 'Could not start game (need at least 1 player)');
    }
  });

  socket.on('roll-dice', () => {
    const roomId = Array.from(socket.rooms).find((r) => r !== socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (room) room.handleRoll(socket);
  });

  socket.on('select-die', (dieIndex: number) => {
    const roomId = Array.from(socket.rooms).find((r) => r !== socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (room) room.handleSelectDie(socket, dieIndex);
  });

  socket.on('place-die', (data: { area: string; placement: Record<string, number> }) => {
    const roomId = Array.from(socket.rooms).find((r) => r !== socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (room && data?.area && data?.placement) {
      room.handlePlaceDie(socket, data.area, data.placement);
    }
  });

  socket.on('passive-choose', (data: number | { dieIndex: number; asColor: string }) => {
    const roomId = Array.from(socket.rooms).find((r) => r !== socket.id);
    if (!roomId) return;
    const room = rooms.get(roomId);
    if (room) room.handlePassiveChoose(socket, data);
  });

  socket.on('disconnect', () => {
    for (const [rid, room] of rooms) {
      room.removePlayer(socket.id);
    }
    console.log('Client disconnected:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
