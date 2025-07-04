const TILE_SIZE = 16;
const VIEWPORT_WIDTH = 320;
const VIEWPORT_HEIGHT = 200;

// Mapping for tile code to asset key
const TILE_ASSET = {
  B: 'solid',
  T: 'tunnel',
  P: 'pinkpipe',
  S: 'scenery',
  M: 'moonstars',
  FR: 'fire',
  WA: 'water',
  TN: 'tentacles',
  DO: 'door',
  TR: 'trophy',
  GU: 'gun',
  JE: 'jetpack',
  E: 'tree',
  I: 'items',
};

// Scoring for collectibles (based on Python logic)
const COLLECTIBLE_POINTS = {
  TR: 1000, // Trophy
  I0: 50,   // Purple ball
  I1: 100,  // Turquoise diamond
  I2: 150,  // Red diamond
  I3: 200,  // Crown
  I4: 300,  // Ring
  I5: 500,  // Magic wand
};

class LevelParser {
  constructor(scene, levelText) {
    this.scene = scene;
    this.lines = levelText.split('\n').filter(l => l.trim().length > 0);
    this.width = 0;
    this.height = this.lines.length;
    this.playerSpawn = { x: 0, y: 0 };
    this.solids = scene.physics.add.staticGroup();
    this.collectibles = scene.physics.add.group();
    this.fire = scene.physics.add.staticGroup();
    this.door = null;
    this.solidPositions = new Set();
    this.parse();
  }
  parse() {
    for (let y = 0; y < this.lines.length; y++) {
      const row = [];
      for (let i = 0; i < this.lines[y].length; i += 3) {
        const code = this.lines[y].substr(i, 3).trim();
        row.push(code);
      }
      this.width = Math.max(this.width, row.length);
      for (let x = 0; x < row.length; x++) {
        const code = row[x];
        if (!code || code === '') continue;
        if (code[0] === 'p') {
          this.playerSpawn = { x, y };
        } else if (code === 'DO') {
          this.door = this.scene.physics.add.staticSprite(x * TILE_SIZE + TILE_SIZE/2, (y+1) * TILE_SIZE + TILE_SIZE/2, 'door', 0);
        } else if (code === 'FR') {
          this.fire.create(x * TILE_SIZE + TILE_SIZE/2, (y+1) * TILE_SIZE + TILE_SIZE/2, 'fire', 0);
        } else if (code === 'TR') {
          const c = this.collectibles.create(x * TILE_SIZE + TILE_SIZE/2, (y+1) * TILE_SIZE + TILE_SIZE/2, 'trophy', 0);
          c.collectType = 'TR';
        } else if (code.startsWith('I')) {
          const frame = parseInt(code[1]) || 0;
          const c = this.collectibles.create(x * TILE_SIZE + TILE_SIZE/2, (y+1) * TILE_SIZE + TILE_SIZE/2, 'items', frame);
          c.collectType = code;
        } else if (TILE_ASSET[code[0]]) {
          // Don't place a solid directly above the player spawn
          if (!(x === this.playerSpawn.x && y === this.playerSpawn.y - 1)) {
            const asset = TILE_ASSET[code[0]];
            const frame = parseInt(code[1]) || 0;
            this.solids.create(x * TILE_SIZE + TILE_SIZE/2, (y+1) * TILE_SIZE + TILE_SIZE/2, asset, frame);
            this.solidPositions.add(`${x},${y+1}`);
          }
        }
      }
    }
  }
}

class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setBounce(0.1);
    this.setGravityY(500);
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.isOnGround = false;
    this.facing = 1;
    this.anims.create({ key: 'idle', frames: [{ key: 'player', frame: 0 }], frameRate: 1, repeat: -1 });
    this.anims.create({ key: 'run', frames: scene.anims.generateFrameNumbers('player', { start: 1, end: 3 }), frameRate: 10, repeat: -1 });
    this.anims.create({ key: 'jump', frames: [{ key: 'player', frame: 4 }], frameRate: 1, repeat: -1 });
  }
  update() {
    let speed = 100;
    let vx = 0;
    if (this.cursors.left.isDown) {
      vx = -speed;
      this.anims.play('run', true);
      this.flipX = true;
      this.facing = -1;
    } else if (this.cursors.right.isDown) {
      vx = speed;
      this.anims.play('run', true);
      this.flipX = false;
      this.facing = 1;
    } else {
      this.anims.play('idle', true);
    }
    if (this.cursors.up.isDown && this.body.blocked.down) {
      this.setVelocityY(-220);
      this.anims.play('jump', true);
    }
    this.setVelocityX(vx);
  }
}

class TitleScene extends Phaser.Scene {
  constructor() { super('TitleScene'); }
  preload() {
    this.load.image('davelogo', '/assets/tiles/ui/davelogo112x47.png');
    this.load.image('blacktile', '/assets/tiles/ui/blacktile320x50.png');
    this.load.text('level1', '/assets/levels/1.txt');
  }
  create() {
    this.add.image(160, 60, 'davelogo');
    this.add.image(160, 180, 'blacktile');
    this.add.text(160, 120, 'RECREATED BY ARTHUR, CATTANI AND MURILO', { color: '#fff', fontSize: '14px' }).setOrigin(0.5);
    this.add.text(160, 140, 'PROFESSOR LEANDRO K. WIVES', { color: '#fff', fontSize: '12px' }).setOrigin(0.5);
    this.add.text(160, 160, 'RECREATED AGAIN, BY YOURS, @0XIshaanK06 ', { color: '#fff', fontSize: '12px' }).setOrigin(0.5);
    this.add.image(160, 180, 'blacktile');
    this.add.text(160,170, 'PRESS M FOR MULTIPLAYER', { color: '#0ff', fontSize: '14px' }).setOrigin(0.5);
    this.add.text(160, 210, 'PRESS ESC TO EXIT', { color: '#fff', fontSize: '12px' }).setOrigin(0.5);
    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('GameScene', { level: 1 });
    });
    this.input.keyboard.once('keydown-M', () => {
      this.scene.start('MultiplayerMenuScene');
    });
    this.input.keyboard.once('keydown-ESC', () => {
      this.game.destroy(true);
    });
  }
}

class MultiplayerMenuScene extends Phaser.Scene {
  constructor() { super('MultiplayerMenuScene'); }
  create() {
    this.add.rectangle(160, 100, 200, 80, 0x111111, 0.9);
    this.add.text(160, 70, 'MULTIPLAYER', { color: '#fff', fontSize: '18px' }).setOrigin(0.5);
    this.add.text(160, 100, 'Press G to Create Room', { color: '#fff', fontSize: '14px' }).setOrigin(0.5);
    this.add.text(160, 120, 'Press H to Join Room', { color: '#fff', fontSize: '14px' }).setOrigin(0.5);
    this.input.keyboard.once('keydown-G', () => {
      this.scene.start('CreateRoomScene');
    });
    this.input.keyboard.once('keydown-H', () => {
      this.scene.start('JoinRoomScene');
    });
  }
}

// --- Blockchain Integration for Multiplayer ---

// Helper to get blockchain API from window
function getBlockchain() {
  return window.blockchain || {};
}

// Patch CreateRoomScene to use wallet address and stake
class CreateRoomScene extends Phaser.Scene {
  constructor() { super('CreateRoomScene'); }
  async create() {
    this.socket = window.io('http://localhost:3000', {
      cors: {
        origin: "http://localhost:3001",
        methods: ["GET", "POST"]
      }
    });

    this.add.rectangle(160, 100, 220, 100, 0x111111, 0.9);
    this.add.text(160, 70, 'Creating Room...', { color: '#fff', fontSize: '16px' }).setOrigin(0.5);
    this.add.text(160, 100, 'Enter your name:', { color: '#fff', fontSize: '14px' }).setOrigin(0.5);
    this.nameInput = this.add.dom(160, 120, 'input', 'width: 120px; font-size: 14px;');
    this.add.text(160, 150, 'Press ENTER to continue', { color: '#aaa', fontSize: '12px' }).setOrigin(0.5);
    this.roomCodeText = this.add.text(160, 40, '', { color: '#0f0', fontSize: '14px' }).setOrigin(0.5);
    this.waitingText = this.add.text(160, 180, '', { color: '#ff0', fontSize: '14px' }).setOrigin(0.5);

    // Use wallet address as username if available
    let playerAddress = getBlockchain().playerAddress;
    let defaultName = playerAddress ? getBlockchain().generateUsername(playerAddress) : "";
    this.nameInput.node.value = defaultName;

    this.socket.emit('createRoom', (roomCode) => {
      this.roomCode = roomCode;
      this.roomCodeText.setText(`Room Code: ${roomCode}`);
      this.waitingText.setText('Waiting for another player to join...');
    });

    this.input.keyboard.on('keydown-ENTER', async () => {
      const name = this.nameInput.node.value.trim();
      if (!name) {
        this.waitingText.setText('Please enter your name.');
        return;
      }
      if (name && this.roomCode) {
        try {
          // Stake on chain
          if (getBlockchain().createGame) {
            await getBlockchain().createGame();
          }
          this.socket.emit('playerReady', { x: 0, y: 0, color: '#0ff', name, address: playerAddress });
        } catch (e) {
          this.waitingText.setText('Blockchain error: ' + (e.message || e));
        }
      }
    });

    // Only start game on 'startGame' event
    this.socket.on('startGame', (state) => {
      this.waitingText.setText('');
      this.scene.start('GameScene', { multiplayer: true, socket: this.socket, roomCode: this.roomCode, name: this.nameInput.node.value.trim(), state });
    });
  }
}

// Patch JoinRoomScene to use wallet address and stake
class JoinRoomScene extends Phaser.Scene {
  constructor() { super('JoinRoomScene'); }
  async create() {
    this.socket = window.io('http://localhost:3000', {
      cors: {
        origin: "http://localhost:3001",
        methods: ["GET", "POST"]
      }
    });

    this.add.rectangle(160, 100, 220, 120, 0x111111, 0.9);
    this.add.text(160, 60, 'Join Room', { color: '#fff', fontSize: '16px' }).setOrigin(0.5);
    this.add.text(160, 90, 'Enter Room Code:', { color: '#fff', fontSize: '14px' }).setOrigin(0.5);
    this.roomInput = this.add.dom(160, 110, 'input', 'width: 120px; font-size: 14px;');
    this.add.text(160, 130, 'Enter your name:', { color: '#fff', fontSize: '14px' }).setOrigin(0.5);
    this.nameInput = this.add.dom(160, 150, 'input', 'width: 120px; font-size: 14px;');
    this.add.text(160, 180, 'Press ENTER to join', { color: '#aaa', fontSize: '12px' }).setOrigin(0.5);
    this.statusText = this.add.text(160, 210, '', { color: '#ff0', fontSize: '14px' }).setOrigin(0.5);

    // Use wallet address as username if available
    let playerAddress = getBlockchain().playerAddress;
    let defaultName = playerAddress ? getBlockchain().generateUsername(playerAddress) : "";
    this.nameInput.node.value = defaultName;

    this.input.keyboard.on('keydown-ENTER', async () => {
      const roomCode = this.roomInput.node.value.trim();
      const name = this.nameInput.node.value.trim();
      if (!roomCode) {
        this.statusText.setText('Please enter a room code.');
        return;
      }
      if (!name) {
        this.statusText.setText('Please enter your name.');
        return;
      }
        try {
          // Stake on chain (joinGame needs player1 address, which is the room creator)
          if (getBlockchain().joinGame) {
            this.socket.emit('getRoomInfo', roomCode, async (info) => {
              if (info && info.player1Address) {
                await getBlockchain().joinGame(info.player1Address);
              this.socket.emit('joinRoom', { roomCode, name, address: playerAddress }, (res) => {
                if (!res || !res.success) {
                  this.statusText.setText(res && res.error ? res.error : 'Failed to join room');
                } else {
                  // Mark this player as ready after joining
                  this.socket.emit('playerReady', { x: 0, y: 0, color: '#0ff', name, address: playerAddress });
                  this.statusText.setText('Waiting for another player to join...');
                }
              });
              } else {
                this.statusText.setText('Invalid room code or missing player1 address');
              }
            });
          } else {
          this.socket.emit('joinRoom', { roomCode, name, address: playerAddress }, (res) => {
            if (!res || !res.success) {
              this.statusText.setText(res && res.error ? res.error : 'Failed to join room');
            } else {
              // Mark this player as ready after joining
              this.socket.emit('playerReady', { x: 0, y: 0, color: '#0ff', name, address: playerAddress });
              this.statusText.setText('Waiting for another player to join...');
            }
          });
          }
        } catch (e) {
          this.statusText.setText('Blockchain error: ' + (e.message || e));
      }
    });

    this.socket.on('startGame', (state) => {
      this.scene.start('GameScene', { multiplayer: true, socket: this.socket, roomCode: this.roomInput.node.value.trim(), name: this.nameInput.node.value.trim(), state });
    });
  }
}

class InterpicScene extends Phaser.Scene {
  constructor() { super('InterpicScene'); }
  preload() {
    this.load.text('interpic', '/assets/levels/interpic.txt');
    this.load.image('solid', '/assets/tiles/game/solid16x16.png');
  }
  create(data) {
    const levelText = this.cache.text.get('interpic');
    if (levelText) {
      const lines = levelText.split('\n');
      for (let y = 0; y < lines.length; y++) {
        for (let x = 0; x < lines[y].length; x++) {
          if (lines[y][x] === '#') {
            this.add.image(x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2, 'solid');
          }
        }
      }
    }
    this.add.text(160, 180, 'GOOD WORK! ONLY ' + (data?.levelsLeft || '?') + ' MORE TO GO!', { color: '#fff', fontSize: '16px' }).setOrigin(0.5);
    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('GameScene', { level: data?.nextLevel || 1 });
    });
  }
}

class WarpScene extends Phaser.Scene {
  constructor() { super('WarpScene'); }
  preload() {
    this.load.text('warp', '/assets/levels/warp.txt');
    this.load.image('solid', '/assets/tiles/game/solid16x16.png');
  }
  create(data) {
    const levelText = this.cache.text.get('warp');
    if (levelText) {
      const lines = levelText.split('\n');
      for (let y = 0; y < lines.length; y++) {
        for (let x = 0; x < lines[y].length; x++) {
          if (lines[y][x] === '#') {
            this.add.image(x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2, 'solid');
          }
        }
      }
    }
    this.add.text(160, 180, 'WARP ZONE!', { color: '#fff', fontSize: '16px' }).setOrigin(0.5);
    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('GameScene', { level: data?.nextLevel || 1 });
    });
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.levelNumber = 1;
    this.score = 0;
    this.multiplayer = false;
    this.socket = null;
    this.roomCode = null;
    this.name = null;
    this.remotePlayers = {};
    this.playerNameTexts = {};
    this.playerListUI = null;
    this.waitingForPlayers = false;
    this.collectibleSprites = {};
    this.finished = false;
  }
  preload() {
    // Only load static assets here
    
    this.load.spritesheet('solid', '/assets/tiles/game/solid16x16.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('tunnel', '/assets/tiles/game/tunnel16x16.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('pinkpipe', '/assets/tiles/game/pinkpipe16x16.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('scenery', '/assets/tiles/game/scenery16x16.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('moonstars', '/assets/tiles/game/moonstars16x16.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('fire', '/assets/tiles/game/fire16x16.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('water', '/assets/tiles/game/water16x16.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('tentacles', '/assets/tiles/game/tentacles16x16.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('door', '/assets/tiles/game/door16x16.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('trophy', '/assets/tiles/game/trophy16x16.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('gun', '/assets/tiles/game/gun16x16.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('jetpack', '/assets/tiles/game/jetpack16x16.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('tree', '/assets/tiles/game/tree16x16.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('items', '/assets/tiles/game/items16x16.png', { frameWidth: 16, frameHeight: 16 });
    this.load.spritesheet('player', '/assets/tiles/game/player20x16.png', { frameWidth: 20, frameHeight: 16 });
    // UI
    this.load.image('scoretext', '/assets/tiles/ui/scoretext54x11.png');
    this.load.image('leveltext', '/assets/tiles/ui/leveltext45x11.png');
    this.load.spritesheet('numbers', '/assets/tiles/ui/numbers8x11.png', { frameWidth: 8, frameHeight: 11 });
    this.load.image('daveicon', '/assets/tiles/ui/daveicon14x12.png');
    this.load.image('topoverlay', '/assets/tiles/ui/topoverlay320x14.png');
  }
  create(data) {
    this.finished = false;
    this.multiplayer = !!data?.multiplayer;
    this.socket = data?.socket || null;
    this.roomCode = data?.roomCode || null;
    this.name = data?.name || null;
    this.collectibleSprites = {};
    this.waitingForPlayers = false;
    // UI overlay (fixed to screen)
    this.add.image(160, 7, 'topoverlay').setScrollFactor(0);
    this.add.image(30, 7, 'scoretext').setScrollFactor(0);
    this.add.image(160, 7, 'leveltext').setScrollFactor(0);
    // Score (5 digits)
    this.scoreDigits = [];
    for (let i = 0; i < 5; i++) {
      this.scoreDigits.push(this.add.sprite(70 + i * 8, 7, 'numbers', 0).setScrollFactor(0));
    }
    // Level (2 digits)
    if (data?.levelNumber) this.levelNumber = data.levelNumber;
    this.levelDigits = [];
    const levelStr = (this.levelNumber || 1).toString().padStart(2, '0');
    this.levelDigits.push(this.add.sprite(200, 7, 'numbers', parseInt(levelStr[0])).setScrollFactor(0));
    this.levelDigits.push(this.add.sprite(208, 7, 'numbers', parseInt(levelStr[1])).setScrollFactor(0));
    // Lives (3 icons) - move to top right
    this.lives = 3;
    this.livesIcons = [];
    for (let i = 0; i < 3; i++) {
      this.livesIcons.push(this.add.image(320 - 3*16 + i*16 + 8, 7, 'daveicon').setScrollFactor(0));
    }
    if (this.multiplayer && data?.levelText) {
      if (data.levelNumber) this.levelNumber = data.levelNumber;
      this.score = data.score;
      this._buildLevelMultiplayer({ levelText: data.levelText, levelNumber: data.levelNumber });
    } else if (this.multiplayer && data?.state) {
      this.levelNumber = data.state.levelNumber;
      this.score = data.state.score;
      this._buildLevelMultiplayer(data.state);
    } else if (!this.multiplayer) {
      // Single player
      this._buildLevel();
    }
  }
  _getColorForMe() {
    // Assign a unique color for this player (could be improved)
    return `hsl(${Math.floor(Math.random()*360)}, 80%, 60%)`;
  }
  _buildLevelMultiplayer(state) {
    // Always set levelNumber from state if present
    if (state.levelNumber) this.levelNumber = state.levelNumber;
    const levelText = state.levelText || '';
    if (!levelText) {
      this.add.text(160, 100, 'Level failed to load!', { color: '#f00', fontSize: '16px' }).setOrigin(0.5);
      return;
    }
    this.level = new LevelParser(this, levelText);
    // Place player at spawn
    const spawn = this.level.playerSpawn;
    this.player = new Player(this, spawn.x * TILE_SIZE + TILE_SIZE/2, (spawn.y+1) * TILE_SIZE + TILE_SIZE/2);
    // Collisions
    this.physics.add.collider(this.player, this.level.solids);
    // Collectibles: use those parsed from the level
    this.level.collectibles.children.iterate((c) => {
      if (!c) return;
      const id = `${c.x},${c.y}`;
      this.collectibleSprites[id] = c;
      c.setInteractive();
    });
    // Overlap for collectibles
    this.physics.add.overlap(this.player, this.level.collectibles, (player, collectible) => {
      const id = `${collectible.x},${collectible.y}`;
      if (!collectible.collected) {
        collectible.collected = true;
        collectible.disableBody(true, true);
        // Award points based on collectible type
        let points = 0;
        if (collectible.collectType && COLLECTIBLE_POINTS[collectible.collectType]) {
          points = COLLECTIBLE_POINTS[collectible.collectType];
        } else {
          points = 10; // fallback
        }
        this.score += points;
        this.updateScore();
        this.socket.emit('collectCollectible', id);
      }
    });
    // Door overlap: finish when player reaches door
    if (!this.level.door) {
      console.warn('No door found in this level!');
    }
    if (this.level.door) {
      this.physics.add.overlap(this.player, this.level.door, () => {
        if (!this.finished) {
          this.finished = true;
          console.log('Player reached the door at level', this.levelNumber);
          if (this.levelNumber === 2) {
            // Level 2 is the final level: emit playerFinished and wait for result
            if (this.socket) {
              this.socket.emit('playerFinished', {
                name: this.name,
                score: this.score,
                time: Date.now(),
              });
              // Show waiting message, fixed to screen
              this.add.text(160, 100, 'Level 2 Complete! Waiting for other player...', {
                color: '#ff0', fontSize: '14px'
              }).setOrigin(0.5).setScrollFactor(0);
              // Freeze player movement
              this.player.setVelocity(0, 0);
              this.waitingForPlayers = true;
              // Listen for gameResult/gameComplete only once
              if (!this._gameResultListener) {
                this._gameResultListener = (result) => {
                  console.log('Received game result from server:', result);
                  this.scene.start('FinishScene', { result });
                };
                this.socket.once('gameResult', this._gameResultListener);
                this.socket.once('gameComplete', this._gameResultListener);
                // Fallback timeout if server doesn't respond
                this.time.delayedCall(10000, () => {
                  if (this.waitingForPlayers) {
                    this.add.text(160, 130, 'Server did not respond. Please try again.', { color: '#f00', fontSize: '14px' }).setOrigin(0.5).setScrollFactor(0);
                  }
                });
              }
            }
          } else {
            // For level 1, progress to level 2
            const nextLevel = (this.levelNumber || 1) + 1;
            const nextLevelPath = `/assets/levels/${nextLevel}.txt`;
            this.load.once(`filecomplete-text-nextlevel`, () => {
              const nextLevelText = this.cache.text.get('nextlevel');
              if (nextLevelText) {
                this.scene.restart({
                  multiplayer: true,
                  socket: this.socket,
                  roomCode: this.roomCode,
                  name: this.name,
                  levelNumber: nextLevel,
                  score: this.score,
                  levelText: nextLevelText
                });
              } else {
                this.scene.start('FinishScene', { score: this.score, gameComplete: true });
              }
            });
            this.load.text('nextlevel', nextLevelPath);
            this.load.start();
          }
        }
      });
    }
    // Fire overlap: lose a life and respawn
    this.physics.add.overlap(this.player, this.level.fire, () => {
      if (!this.player.invulnerable) {
        this.lives--;
        for (let i = 0; i < this.livesIcons.length; i++) {
          this.livesIcons[i].setVisible(i < this.lives);
        }
        if (this.lives > 0) {
          this.player.invulnerable = true;
          this.player.setTint(0xff0000);
          this.player.setVelocity(0, 0);
          // Respawn at spawn point after short delay
          this.time.delayedCall(800, () => {
            const spawn = this.level.playerSpawn;
            this.player.setPosition(spawn.x * TILE_SIZE + TILE_SIZE/2, (spawn.y+1) * TILE_SIZE + TILE_SIZE/2);
            this.player.clearTint();
            this.player.invulnerable = false;
          });
        } else {
          // Game over for this player
          if (this.socket) {
            this.socket.emit('playerLost', { name: this.name, score: this.score });
          }
          this.scene.start('FinishScene', { lost: true, score: this.score });
        }
      }
    });
    // Listen for 'youWon' event from server
    if (this.socket && !this._youWonListener) {
      this._youWonListener = (data) => {
        this.scene.start('FinishScene', { won: true, score: data.score });
      };
      this.socket.on('youWon', this._youWonListener);
    }
    // Camera
    this.cameras.main.setViewport(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
    this.cameras.main.setBounds(0, 0, this.level.width * TILE_SIZE, this.level.height * TILE_SIZE);
    this.cameraEdgeMargin = 80;
    // Remove remote player rendering: do not add remote players or name texts
    this.updateScore();
  }
  updateScore() {
    let s = this.score.toString().padStart(5, '0');
    for (let i = 0; i < 5; i++) {
      this.scoreDigits[i].setFrame(parseInt(s[i]));
    }
  }
  handlePlayerDeath() {
    this.player.setTint(0xff0000);
    this.player.setVelocity(0, 0);
    this.player.anims.stop();
    this.lives--;
    if (this.lives >= 0) {
      // Update lives UI
      for (let i = 0; i < this.livesIcons.length; i++) {
        this.livesIcons[i].setVisible(i < this.lives);
      }
      this.time.delayedCall(800, () => {
        this.scene.restart({ levelNumber: this.levelNumber, score: this.score });
      });
    } else {
      this.add.text(160, 100, 'GAME OVER', { color: '#f00', fontSize: '20px' }).setOrigin(0.5).setScrollFactor(0);
      this.time.delayedCall(1500, () => {
        this.scene.start('TitleScene');
      });
    }
  }
  init(data) {
    if (data && data.levelNumber) {
      this.levelNumber = data.levelNumber;
    }
    if (data && typeof data.score === 'number') {
      this.score = data.score;
    } else if (typeof this.score !== 'number') {
      this.score = 0;
    }
  }
  update() {
    if (this.waitingForPlayers) return;
    if (!this.player) return;
    this.player.update();
    // Camera/scrolling logic
    const cam = this.cameras.main;
    let camX = cam.scrollX;
    const playerX = this.player.x;
    if (playerX - cam.scrollX < this.cameraEdgeMargin) {
      camX = Math.max(0, playerX - this.cameraEdgeMargin);
    } else if (playerX - cam.scrollX > VIEWPORT_WIDTH - this.cameraEdgeMargin) {
      camX = Math.min(this.level.width * TILE_SIZE - VIEWPORT_WIDTH, playerX - (VIEWPORT_WIDTH - this.cameraEdgeMargin));
    }
    cam.scrollX = camX;
    cam.scrollY = 0;
    // Multiplayer: only emit my own movement, do not update or render remote players
    if (this.multiplayer && this.socket && this.player) {
      this.socket.emit('playerMovement', {
        x: this.player.x,
        y: this.player.y,
        vx: this.player.body.velocity.x,
        vy: this.player.body.velocity.y,
        anim: this.player.anims.currentAnim ? this.player.anims.currentAnim.key : 'idle',
        alive: true,
      });
    }
  }
  shutdown() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
  _buildLevel() {
    this.add.text(160, 100, 'Single-player mode not implemented yet!', { color: '#f00', fontSize: '16px' }).setOrigin(0.5);
  }
}

class FinishScene extends Phaser.Scene {
  constructor() { super('FinishScene'); }
  async create(data) {
    this.cameras.main.setBackgroundColor('#000');
    if (data && data.lost) {
      this.add.text(160, 100, 'YOU LOST', { color: '#f00', fontSize: '32px' }).setOrigin(0.5);
      this.add.text(160, 140, `Final Score: ${data.score}`, { color: '#fff', fontSize: '18px' }).setOrigin(0.5);
      this.add.text(160, 180, 'Press SPACE to Restart', { color: '#fff', fontSize: '16px' }).setOrigin(0.5);
      this.input.keyboard.once('keydown-SPACE', () => {
        this.scene.start('TitleScene');
      });
      return;
    }
    if (data && data.won) {
      this.add.text(160, 100, 'YOU WON', { color: '#0f0', fontSize: '32px' }).setOrigin(0.5);
      this.add.text(160, 140, `Final Score: ${data.score}`, { color: '#fff', fontSize: '18px' }).setOrigin(0.5);
      if (data.opponentDiedInFire) {
        this.add.text(160, 170, 'Opponent died in fire!', { color: '#ff0', fontSize: '16px' }).setOrigin(0.5);
      }
      this.add.text(160, 200, 'Press SPACE to Restart', { color: '#fff', fontSize: '16px' }).setOrigin(0.5);
      this.input.keyboard.once('keydown-SPACE', () => {
        this.scene.start('TitleScene');
      });
      return;
    }
    const result = data && data.result;
    if (!result) {
      this.add.text(160, 100, 'Game Over', { color: '#fff', fontSize: '20px' }).setOrigin(0.5);
      return;
    }
    const { players, winner, tie } = result;
    let y = 60;
    this.add.text(160, y, 'Results:', { color: '#fff', fontSize: '18px' }).setOrigin(0.5);
    y += 30;
    players.forEach((p, i) => {
      this.add.text(160, y, `${i+1}. ${p.name} - Score: ${p.score} - Finish: ${p.finishOrder}`, { color: '#fff', fontSize: '14px' }).setOrigin(0.5);
      y += 20;
    });
    y += 10;
    if (tie) {
      this.add.text(160, y, 'It\'s a TIE!', { color: '#ff0', fontSize: '20px' }).setOrigin(0.5);
    } else {
      this.add.text(160, y, `Winner: ${winner.name}`, { color: '#0f0', fontSize: '20px' }).setOrigin(0.5);
    }
    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('TitleScene');
    });
  }
}

// --- End Blockchain Integration ---

window.onload = function () {
  const config = {
    type: Phaser.AUTO,
    width: VIEWPORT_WIDTH,
    height: VIEWPORT_HEIGHT,
    parent: 'game-container',
    dom: { createContainer: true },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 0 },
        debug: false
      }
    },
    scene: [
      TitleScene,
      MultiplayerMenuScene,
      CreateRoomScene,
      JoinRoomScene,
      InterpicScene,
      WarpScene,
      GameScene,
      FinishScene
    ],
    backgroundColor: '#000'
  };

  // Destroy previous game instance if exists
  if (window.game && typeof window.game.destroy === "function") {
    window.game.destroy(true);
  }
  window.game = new Phaser.Game(config);
};