import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { Game, GameState } from './types';
import { GameEngine } from './services/GameEngine';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const gameEngine = new GameEngine();

app.use(cors());
app.use(express.json());

// REST endpoints
app.post('/games', (req, res) => {
  const { width = 20, height = 20, levels = 3 } = req.body;
  const gameId = uuidv4();
  const game = gameEngine.createGame(gameId, width, height, levels);
  res.json({ gameId });
});

app.get('/games', (req, res) => {
  const activeGames = Array.from(gameEngine.games.values())
    .filter(game => game.status !== 'finished')
    .map(game => ({
      id: game.id,
      playerCount: game.players.length,
      status: game.status
    }));
  res.json(activeGames);
});

// Socket.IO event handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('joinGame', ({ gameId, playerName }) => {
    const game = gameEngine.games.get(gameId);
    if (!game) {
      socket.emit('error', 'Game not found');
      return;
    }

    const playerId = uuidv4();
    const player = {
      id: playerId,
      name: playerName,
      position: { x: 0, y: 0, level: 0 },
      health: 100,
      inventory: [],
      socketId: socket.id,
      map: {
        cells: [],
        startPosition: { x: 0, y: 0, level: 0 }
      }
    };

    gameEngine.addPlayer(gameId, player);
    socket.join(`game:${gameId}`);
    
    socket.emit('gameJoined', { playerId, gameState: game });
    io.to(`game:${gameId}`).emit('playerJoined', { player });
  });

  socket.on('playerMove', ({ gameId, playerId, direction }) => {
    try {
      const game = gameEngine.games.get(gameId);
      if (!game) return;
      
      const player = game.players.find(p => p.id === playerId);
      if (!player) return;

      const result = gameEngine.movePlayer(gameId, playerId, direction);
      if (result.success) {
        if (result.mapDropped) {
          socket.emit('mapDropped', {
            playerId: player.id,
            position: player.position
          });
        }
        if (result.secretDoorFound) {
          socket.emit('secretDoorFound', {
            position: player.position
          });
        }

        // Check for win condition
        if (result.gameWon) {
          io.to(`game:${gameId}`).emit('gameWon', {
            playerId: player.id,
            playerName: player.name
          });
        }

        // Send updated visible state to each player
        game.players.forEach(p => {
          const visibleState = gameEngine.getPlayerVisibleState(gameId, p.id);
          io.to(p.socketId).emit('gameStateUpdate', visibleState);
        });

        // Check for item pickups, combat, or other interactions
        const cell = game.maze.grid[player.position.level][player.position.y][player.position.x];
        
        // Handle item pickups
        if (cell.items.length > 0) {
          socket.emit('itemsAvailable', {
            items: cell.items
          });
        }

        // Handle stairs
        if (cell.hasStairs) {
          socket.emit('stairsAvailable', {
            up: cell.hasStairs.up,
            down: cell.hasStairs.down
          });
        }
      }
    } catch (error) {
      console.error('Error handling player move:', error);
      socket.emit('error', 'Failed to move player');
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Find and remove player from their game
    for (const [gameId, game] of gameEngine.games.entries()) {
      const playerIndex = game.players.findIndex(p => p.socketId === socket.id);
      if (playerIndex !== -1) {
        const player = game.players[playerIndex];
        game.players.splice(playerIndex, 1);
        
        // Notify other players
        io.to(`game:${gameId}`).emit('playerLeft', {
          playerId: player.id,
          playerName: player.name
        });

        // If last player left, destroy the game
        if (game.players.length === 0) {
          gameEngine.games.delete(gameId);
          console.log(`Game ${gameId} destroyed - no players remaining`);
        }
        
        break;
      }
    }
  });
});

const SERVER_PORT = process.env.SERVER_PORT || 3001;
httpServer.listen(SERVER_PORT, () => {
  console.log(`Server running on port ${SERVER_PORT}`);
});
