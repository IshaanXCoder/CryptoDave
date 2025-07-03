const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Room state: { [roomCode]: { players: { [socketId]: playerObj } } }
let rooms = {};

// Track finish info per room
let finishInfo = {};

function makeRoomCode() {
  return Math.random().toString(36).substr(2, 5).toUpperCase();
}

function getInitialPlayerState(socketId, color, name) {
  return {
    id: socketId,
    x: 120 + Math.random() * 40,
    y: 100,
    vx: 0,
    vy: 0,
    anim: 'idle',
    color,
    name,
    score: 0,
    powerUps: [],
    alive: true,
    ready: false,
  };
}

function getInitialRoomState() {
  return {
    players: {},
    powerUps: [],
    collectibles: [],
    traps: [],
    levelNumber: 1,
    score: 0,
    started: false,
  };
}

function broadcastPlayerList(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  const list = Object.values(room.players).map(p => ({ id: p.id, name: p.name, color: p.color, ready: p.ready }));
  io.to(roomCode).emit('playerList', list);
}

io.on('connection', (socket) => {
  let currentRoom = null;
  let color = `hsl(${Math.floor(Math.random()*360)}, 80%, 60%)`;
  let name = null;

  socket.on('createRoom', (cb) => {
    let code;
    do {
      code = makeRoomCode();
    } while (rooms[code]);
    rooms[code] = getInitialRoomState();
    currentRoom = code;
    socket.join(code);
    cb(code);
  });

  socket.on('joinRoom', (code, cb) => {
    if (rooms[code]) {
      currentRoom = code;
      socket.join(code);
      cb(true);
      // Debug log
      console.log(`[joinRoom] Socket ${socket.id} joined room ${code}`);
      // After joining, check if all players are ready and at least 2 players are present
      const room = rooms[code];
      const readyPlayers = Object.values(room.players).filter(p => p.ready);
      if (!room.started && readyPlayers.length >= 2 && readyPlayers.length === Object.keys(room.players).length) {
        room.started = true;
        const fs = require('fs');
        const levelPath = path.join(__dirname, 'public', 'assets', 'levels', '1.txt');
        let levelText = '';
        try {
          levelText = fs.readFileSync(levelPath, 'utf8');
        } catch (e) {
          levelText = '';
        }
        console.log(`[startGame] Emitting to room ${code}`);
        io.to(code).emit('startGame', {
          levelNumber: room.levelNumber,
          score: room.score,
          players: room.players,
          powerUps: room.powerUps,
          collectibles: room.collectibles,
          traps: room.traps,
          levelText,
        });
      }
    } else {
      cb(false);
    }
  });

  socket.on('playerReady', (playerInfo) => {
    if (!currentRoom) return;
    name = playerInfo.name || `Player-${socket.id.substr(0, 4)}`;
    color = playerInfo.color || color;
    let player = getInitialPlayerState(socket.id, color, name);
    player.x = playerInfo.x;
    player.y = playerInfo.y;
    player.color = color;
    player.name = name;
    player.ready = true;
    rooms[currentRoom].players[socket.id] = player;
    broadcastPlayerList(currentRoom);
    // Debug log
    const readyPlayers = Object.values(rooms[currentRoom].players).filter(p => p.ready);
    console.log(`[playerReady] ${player.name} marked ready in room ${currentRoom}. Ready count: ${readyPlayers.length}/${Object.keys(rooms[currentRoom].players).length}`);
    // Only start the game if at least 2 players are ready
    if (!rooms[currentRoom].started && readyPlayers.length >= 2 && readyPlayers.length === Object.keys(rooms[currentRoom].players).length) {
      rooms[currentRoom].started = true;
      // Load level text from disk (level 1 for now)
      const fs = require('fs');
      const levelPath = path.join(__dirname, 'public', 'assets', 'levels', '1.txt');
      let levelText = '';
      try {
        levelText = fs.readFileSync(levelPath, 'utf8');
      } catch (e) {
        levelText = '';
      }
      console.log(`[startGame] Emitting to room ${currentRoom}`);
      io.to(currentRoom).emit('startGame', {
        levelNumber: rooms[currentRoom].levelNumber,
        score: rooms[currentRoom].score,
        players: rooms[currentRoom].players,
        powerUps: rooms[currentRoom].powerUps,
        collectibles: rooms[currentRoom].collectibles,
        traps: rooms[currentRoom].traps,
        levelText,
      });
    }
  });

  socket.on('playerMovement', (data) => {
    if (!currentRoom || !rooms[currentRoom].players[socket.id]) return;
    const player = rooms[currentRoom].players[socket.id];
    player.x = data.x;
    player.y = data.y;
    player.vx = data.vx;
    player.vy = data.vy;
    player.anim = data.anim;
    player.alive = data.alive !== undefined ? data.alive : true;
    io.to(currentRoom).emit('playerMoved', player);
  });

  socket.on('collectPowerUp', (powerUpId) => {
    if (!currentRoom) return;
    const room = rooms[currentRoom];
    const pu = room.powerUps.find(p => p.id === powerUpId);
    if (pu && pu.active !== false) {
      pu.active = false;
      room.players[socket.id].powerUps.push(pu.type);
      io.to(currentRoom).emit('powerUpCollected', { playerId: socket.id, powerUpId });
    }
  });

  socket.on('collectCollectible', (collectibleId) => {
    if (!currentRoom) return;
    const room = rooms[currentRoom];
    const col = room.collectibles.find(c => c.id === collectibleId);
    if (col && !col.collected) {
      col.collected = true;
      room.players[socket.id].score += 10;
      room.score += 10;
      io.to(currentRoom).emit('collectibleCollected', { playerId: socket.id, collectibleId, score: room.score });
    }
  });

  socket.on('playerHitTrap', (trapId) => {
    if (!currentRoom) return;
    const player = rooms[currentRoom].players[socket.id];
    player.alive = false;
    io.to(currentRoom).emit('playerDied', { playerId: socket.id, trapId });
  });

  socket.on('requestRoomState', () => {
    if (!currentRoom) return;
    socket.emit('currentState', {
      players: rooms[currentRoom].players,
      powerUps: rooms[currentRoom].powerUps,
      collectibles: rooms[currentRoom].collectibles,
      traps: rooms[currentRoom].traps,
      levelNumber: rooms[currentRoom].levelNumber,
      score: rooms[currentRoom].score,
    });
  });

  socket.on('syncLevel', (data) => {
    if (!currentRoom) return;
    // Accept level state from first player to send it
    if (!rooms[currentRoom].levelSynced) {
      rooms[currentRoom].levelNumber = data.levelNumber;
      rooms[currentRoom].score = data.score;
      rooms[currentRoom].powerUps = data.powerUps;
      rooms[currentRoom].collectibles = data.collectibles;
      rooms[currentRoom].traps = data.traps;
      rooms[currentRoom].levelSynced = true;
    }
  });

  socket.on('playerFinished', (data) => {
    if (!currentRoom) return;
    if (!finishInfo[currentRoom]) finishInfo[currentRoom] = [];
    // Prevent duplicate finish
    if (finishInfo[currentRoom].some(f => f.id === socket.id)) return;
    finishInfo[currentRoom].push({
      id: socket.id,
      name: data.name,
      score: data.score,
      time: data.time,
    });
    // When both players have finished, determine winner
    const room = rooms[currentRoom];
    if (finishInfo[currentRoom].length === 2) {
      const players = finishInfo[currentRoom];
      // Sort by finish time (first = 1, second = 2)
      players.sort((a, b) => a.time - b.time);
      players[0].finishOrder = 1;
      players[1].finishOrder = 2;
      // Score rank (higher = 1, lower = 2)
      if (players[0].score === players[1].score) {
        players[0].scoreRank = 1;
        players[1].scoreRank = 1;
      } else if (players[0].score > players[1].score) {
        players[0].scoreRank = 1;
        players[1].scoreRank = 2;
      } else {
        players[0].scoreRank = 2;
        players[1].scoreRank = 1;
      }
      // Total points: finishOrder + scoreRank
      players[0].total = players[0].finishOrder + players[0].scoreRank;
      players[1].total = players[1].finishOrder + players[1].scoreRank;
      let winner = null;
      let tie = false;
      if (players[0].total < players[1].total) winner = players[0];
      else if (players[1].total < players[0].total) winner = players[1];
      else tie = true;
      io.to(currentRoom).emit('gameResult', {
        players,
        winner,
        tie,
      });
      // Clean up finish info for this room
      delete finishInfo[currentRoom];
    }
  });

  socket.on('playerLost', (data) => {
    if (!currentRoom || !rooms[currentRoom]) return;
    // Find the other player in the room
    const otherPlayerId = Object.keys(rooms[currentRoom].players).find(id => id !== socket.id);
    if (otherPlayerId && io.sockets.sockets.get(otherPlayerId)) {
      const otherPlayer = rooms[currentRoom].players[otherPlayerId];
      io.to(otherPlayerId).emit('youWon', { name: otherPlayer.name, score: otherPlayer.score, opponentDiedInFire: true });
    }
  });

  socket.on('disconnect', () => {
    if (currentRoom && rooms[currentRoom] && rooms[currentRoom].players[socket.id]) {
      delete rooms[currentRoom].players[socket.id];
      broadcastPlayerList(currentRoom);
      io.to(currentRoom).emit('playerDisconnected', socket.id);
      // Clean up empty rooms
      if (Object.keys(rooms[currentRoom].players).length === 0) {
        delete rooms[currentRoom];
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});