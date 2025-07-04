const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Room state: { [roomCode]: { players: { [socketId]: playerObj }, player1Address: string } }
let rooms = {};

// Track finish info per room
let finishInfo = {};

function makeRoomCode() {
  return Math.random().toString(36).substr(2, 5).toUpperCase();
}

function getInitialPlayerState(socketId, color, name, address) {
  return {
    id: socketId,
    x: 120 + Math.random() * 40,
    y: 100,
    vx: 0,
    vy: 0,
    anim: 'idle',
    color,
    name,
    address, // Add wallet address
    score: 0,
    powerUps: [],
    alive: true,
    ready: false,
  };
}

function getInitialRoomState() {
  return {
    players: {},
    player1Address: null, // Track the first player's address for blockchain
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
  let playerAddress = null;

  socket.on('createRoom', (cb) => {
    let code;
    do {
      code = makeRoomCode();
    } while (rooms[code]);
    rooms[code] = getInitialRoomState();
    currentRoom = code;
    socket.join(code);
    if (typeof cb === 'function') cb(code);
  });

  socket.on('joinRoom', (data, cb) => {
    const { roomCode, name: playerName, address } = data;
    if (rooms[roomCode]) {
      currentRoom = roomCode;
      socket.join(roomCode);
      name = playerName;
      playerAddress = address;
      
      // Send back success with player1 address for blockchain join
      if (typeof cb === 'function') {
      cb({
        success: true,
        player1Address: rooms[roomCode].player1Address
      });
      }
      
      console.log(`[joinRoom] Socket ${socket.id} joined room ${roomCode} as ${name} (${address})`);
    } else {
      if (typeof cb === 'function') {
      cb({ success: false, error: 'Room not found' });
      }
    }
  });

  socket.on('playerReady', (playerInfo) => {
    if (!currentRoom) return;
    name = playerInfo.name || `Player-${socket.id.substr(0, 4)}`;
    color = playerInfo.color || color;
    playerAddress = playerInfo.address;
    
    let player = getInitialPlayerState(socket.id, color, name, playerAddress);
    player.x = playerInfo.x;
    player.y = playerInfo.y;
    player.color = color;
    player.name = name;
    player.address = playerAddress;
    player.ready = true;
    
    rooms[currentRoom].players[socket.id] = player;
    
    // Set player1Address if this is the first player
    if (!rooms[currentRoom].player1Address) {
      rooms[currentRoom].player1Address = playerAddress;
      console.log(`[playerReady] Set player1Address to ${playerAddress} for room ${currentRoom}`);
    }
    
    broadcastPlayerList(currentRoom);
    
    const readyPlayers = Object.values(rooms[currentRoom].players).filter(p => p.ready);
    console.log(`[playerReady] ${player.name} marked ready in room ${currentRoom}. Ready count: ${readyPlayers.length}/${Object.keys(rooms[currentRoom].players).length}`);
    
    // Only start the game if at least 2 players are ready
    if (!rooms[currentRoom].started && readyPlayers.length >= 2 && readyPlayers.length === Object.keys(rooms[currentRoom].players).length) {
      rooms[currentRoom].started = true;
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
        player1Address: rooms[currentRoom].player1Address, // Include for blockchain
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
    socket.emit('roomState', rooms[currentRoom]);
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
    if (currentRoom && rooms[currentRoom]) {
      delete rooms[currentRoom].players[socket.id];
      if (Object.keys(rooms[currentRoom].players).length === 0) {
        delete rooms[currentRoom];
        console.log(`[disconnect] Room ${currentRoom} deleted (no players left)`);
      } else {
        broadcastPlayerList(currentRoom);
        console.log(`[disconnect] Player ${socket.id} left room ${currentRoom}`);
      }
    }
  });

  socket.on('getRoomInfo', (roomCode, cb) => {
    if (rooms[roomCode]) {
      if (typeof cb === 'function') {
        cb({ player1Address: rooms[roomCode].player1Address });
      }
    } else {
      if (typeof cb === 'function') {
        cb({ error: 'Room not found' });
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});