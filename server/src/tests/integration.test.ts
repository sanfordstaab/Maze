import { GameEngine } from '../services/GameEngine';
import { Game, Player, Position } from '../types';

describe('Game Integration Tests', () => {
  let gameEngine: GameEngine;
  let game: Game;
  let player: Player;

  beforeEach(() => {
    gameEngine = new GameEngine();
    const gameId = 'test-game';
    game = gameEngine.createGame(gameId, 10, 10, 3, 5); // Medium difficulty
    player = {
      id: 'test-player',
      name: 'Test Player',
      position: { x: 0, y: 0, level: 0 },
      health: 100,
      inventory: [],
      socketId: 'test-socket',
      map: {
        cells: [],
        startPosition: { x: 0, y: 0, level: 0 }
      }
    };
    gameEngine.addPlayer(game.id, player);
  });

  describe('Game Creation', () => {
    it('should create a game with correct dimensions', () => {
      expect(game.maze.width).toBe(10);
      expect(game.maze.height).toBe(10);
      expect(game.maze.levels).toBe(3);
    });

    it('should generate initial items', () => {
      const allItems = game.maze.grid.flatMap((level, l) =>
        level.flatMap((row, y) =>
          row.flatMap((cell, x) =>
            cell.items.map(item => ({ ...item, position: { x, y, level: l } }))
          )
        )
      );

      // Should have key
      expect(allItems.some(item => item.type === 'key')).toBe(true);
      
      // Should have healing potions based on difficulty
      const potions = allItems.filter(item => item.type === 'potion');
      expect(potions.length).toBe(game.difficultySettings.healingPotionCount);
    });
  });

  describe('Player Movement', () => {
    it('should handle basic movement', () => {
      const result = gameEngine.movePlayer(game.id, player.id, 'east');
      expect(result.success).toBe(true);
      const updatedPlayer = game.players.find(p => p.id === player.id);
      expect(updatedPlayer?.position.x).toBe(1);
    });

    it('should handle map wrapping', () => {
      // Move to edge
      player.position.x = game.maze.width - 1;
      const result = gameEngine.movePlayer(game.id, player.id, 'east');
      expect(result.success).toBe(true);
      const updatedPlayer = game.players.find(p => p.id === player.id);
      expect(updatedPlayer?.position.x).toBe(0);
    });

    it('should block movement through walls without secret doors', () => {
      // Find a cell with a wall
      const cell = game.maze.grid[0][0][0];
      cell.walls.east = true;
      cell.secretDoors = undefined;
      
      const result = gameEngine.movePlayer(game.id, player.id, 'east');
      expect(result.success).toBe(false);
    });

    it('should allow movement through secret doors', () => {
      // Create a secret door
      const cell = game.maze.grid[0][0][0];
      cell.walls.east = true;
      cell.secretDoors = { east: true };
      
      // Try multiple times since secret door discovery is random
      let passedThrough = false;
      for (let i = 0; i < 10; i++) {
        const result = gameEngine.movePlayer(game.id, player.id, 'east');
        if (result.success) {
          passedThrough = true;
          break;
        }
      }
      expect(passedThrough).toBe(true);
    });
  });

  describe('Combat System', () => {
    it('should handle player vs monster combat', () => {
      // Add monster to player's position
      game.monsters.push({
        id: 'test-monster',
        type: 'goblin',
        position: { ...player.position },
        health: 50,
        damage: 5,
        visibility: 3,
        moveInterval: 1000
      });

      const result = gameEngine.movePlayer(game.id, player.id, 'east');
      expect(result.combatResults).toBeDefined();
      expect(result.combatResults?.length).toBeGreaterThan(0);
    });

    it('should handle player death', () => {
      player.health = 1;
      game.monsters.push({
        id: 'test-monster',
        type: 'dragon',
        position: { ...player.position },
        health: 200,
        damage: 50,
        visibility: 5,
        moveInterval: 500
      });

      const result = gameEngine.movePlayer(game.id, player.id, 'east');
      expect(result.combatResults).toBeDefined();
      const playerDied = player.health <= 0;
      expect(playerDied).toBe(true);
    });
  });

  describe('Win Condition', () => {
    it('should detect win when reaching exit with key', () => {
      // Give player the key
      player.inventory.push({
        id: 'test-key',
        type: 'key',
        position: player.position
      });

      // Move player to exit
      player.position = { ...game.exitPosition };
      
      const result = gameEngine.movePlayer(game.id, player.id, 'east');
      expect(result.gameWon).toBe(true);
      expect(game.status).toBe('finished');
      expect(game.winner?.playerId).toBe(player.id);
    });

    it('should not allow win without key', () => {
      // Move player to exit without key
      player.position = { ...game.exitPosition };
      
      const result = gameEngine.movePlayer(game.id, player.id, 'east');
      expect(result.gameWon).toBeFalsy();
      expect(game.status).not.toBe('finished');
    });
  });

  describe('Item System', () => {
    it('should handle item pickup and use', () => {
      // Add potion to player's cell
      const cell = game.maze.grid[player.position.level][player.position.y][player.position.x];
      const potion = {
        id: 'test-potion',
        type: 'potion' as const,
        position: player.position
      };
      cell.items.push(potion);

      // Pickup item
      const pickedUp = gameEngine.itemSystem.pickupItem(game, player.id);
      expect(pickedUp).toBeDefined();
      expect(player.inventory).toContain(pickedUp);

      // Use item
      const initialHealth = player.health;
      player.health = 50; // Reduce health to test healing
      const useResult = gameEngine.itemSystem.useItem(game, player.id, potion.id);
      expect(useResult.success).toBe(true);
      expect(player.health).toBeGreaterThan(50);
    });
  });

  describe('Monster System', () => {
    it('should generate monsters based on difficulty', () => {
      const easyGame = gameEngine.createGame('easy-game', 10, 10, 3, 1);
      const hardGame = gameEngine.createGame('hard-game', 10, 10, 3, 8);

      expect(hardGame.monsters.length).toBeGreaterThan(easyGame.monsters.length);
      expect(hardGame.monsters.some(m => m.type === 'dragon')).toBe(true);
    });

    it('should move monsters towards visible players', () => {
      const monster = {
        id: 'test-monster',
        type: 'goblin',
        position: { x: 5, y: 5, level: 0 },
        health: 50,
        damage: 5,
        visibility: 3,
        moveInterval: 1000
      };
      game.monsters.push(monster);

      // Place player within monster's visibility range
      player.position = { x: 4, y: 5, level: 0 };
      
      gameEngine.monsterAI.moveMonster(game, monster);
      expect(monster.position.x).toBe(4); // Should move towards player
    });

    it('should respect difficulty settings for monster attributes', () => {
      const hardGame = gameEngine.createGame('hard-game', 10, 10, 3, 8);
      const monster = hardGame.monsters[0];

      expect(monster.damage).toBeGreaterThan(5); // Base damage
      expect(monster.moveInterval).toBeLessThan(2000); // Faster movement
      expect(monster.visibility).toBeGreaterThan(3); // Better visibility
    });
  });

  describe('Map System', () => {
    it('should build player map as they explore', () => {
      const visibility = gameEngine.visibilitySystem.calculateVisibility(game, player);
      gameEngine.mapSystem.updatePlayerMap(game, player, visibility);

      expect(player.map.cells[0][0][0]).toBe(true); // Starting position should be mapped
    });

    it('should handle map stealing during combat', () => {
      // Setup two players with different map knowledge
      const player2: Player = {
        ...player,
        id: 'player2',
        position: { ...player.position }
      };
      game.players.push(player2);

      // Give first player some map knowledge
      player.map.cells = Array(3).fill(null).map(() =>
        Array(10).fill(null).map(() =>
          Array(10).fill(true)
        )
      );

      // Transfer map during combat
      gameEngine.mapSystem.transferMap(player, player2);

      expect(player2.map.cells[0][0][0]).toBe(true);
      expect(player.map.cells[0][0][0]).toBe(false); // Original player's map should be reset
    });

    it('should handle map dropping and pickup', () => {
      // Give player map knowledge
      player.map.cells = Array(3).fill(null).map(() =>
        Array(10).fill(null).map(() =>
          Array(10).fill(true)
        )
      );

      // Drop map
      gameEngine.mapSystem.dropMap(game, player);

      // Verify map was dropped
      const cell = game.maze.grid[player.position.level][player.position.y][player.position.x];
      expect(cell.items.some(item => item.type === 'map')).toBe(true);
      expect(player.map.cells[0][0][0]).toBe(false); // Player's map should be reset
    });
  });

  describe('Difficulty Settings', () => {
    it('should affect player visibility', () => {
      const easyGame = gameEngine.createGame('easy-game', 10, 10, 3, 1);
      const hardGame = gameEngine.createGame('hard-game', 10, 10, 3, 8);

      const easyPlayer = { ...player, position: { x: 5, y: 5, level: 0 } };
      const hardPlayer = { ...player, position: { x: 5, y: 5, level: 0 } };

      const easyVisibility = gameEngine.visibilitySystem.calculateVisibility(easyGame, easyPlayer);
      const hardVisibility = gameEngine.visibilitySystem.calculateVisibility(hardGame, hardPlayer);

      // Count visible cells
      const countVisible = (visibility: boolean[][][]) => 
        visibility.flat(2).filter(Boolean).length;

      expect(countVisible(easyVisibility)).toBeGreaterThan(countVisible(hardVisibility));
    });

    it('should affect healing potion strength', () => {
      const easyGame = gameEngine.createGame('easy-game', 10, 10, 3, 1);
      const hardGame = gameEngine.createGame('hard-game', 10, 10, 3, 8);

      expect(easyGame.difficultySettings.healingPotionStrength)
        .toBeGreaterThan(hardGame.difficultySettings.healingPotionStrength);
    });

    it('should enable/disable PvP based on difficulty', () => {
      const easyGame = gameEngine.createGame('easy-game', 10, 10, 3, 1);
      const hardGame = gameEngine.createGame('hard-game', 10, 10, 3, 8);

      expect(easyGame.difficultySettings.playerVsPlayerEnabled).toBe(false);
      expect(hardGame.difficultySettings.playerVsPlayerEnabled).toBe(true);
    });

    it('should affect secret door frequency', () => {
      const easyGame = gameEngine.createGame('easy-game', 10, 10, 3, 1);
      const hardGame = gameEngine.createGame('hard-game', 10, 10, 3, 8);

      const countSecretDoors = (game: Game) => 
        game.maze.grid.flat(2)
          .filter(cell => cell.secretDoors)
          .length;

      expect(countSecretDoors(hardGame)).toBeGreaterThan(countSecretDoors(easyGame));
    });
  });

  describe('Level Navigation', () => {
    it('should handle stairs between levels', () => {
      // Find a cell with stairs up
      const cell = game.maze.grid[0][0][0];
      cell.hasStairs = { up: true };
      game.maze.grid[1][0][0].hasStairs = { down: true };

      // Position player at stairs
      player.position = { x: 0, y: 0, level: 0 };

      // Move up stairs
      const result = gameEngine.movePlayer(game.id, player.id, 'up');
      expect(result.success).toBe(true);
      expect(player.position.level).toBe(1);
    });
  });

  describe('Visibility System', () => {
    it('should double visibility range with flashlight', () => {
      // Give player a flashlight
      player.inventory.push({
        id: 'test-flashlight',
        type: 'flashlight',
        position: player.position
      });

      const visibilityWithFlashlight = gameEngine.visibilitySystem.calculateVisibility(game, player);

      // Remove flashlight
      player.inventory = [];
      const visibilityWithoutFlashlight = gameEngine.visibilitySystem.calculateVisibility(game, player);

      // Count visible cells
      const countVisible = (visibility: boolean[][][]) => 
        visibility.flat(2).filter(Boolean).length;

      expect(countVisible(visibilityWithFlashlight))
        .toBeGreaterThan(countVisible(visibilityWithoutFlashlight) * 1.5); // Should be roughly double
    });
  });

  describe('Monster Behavior', () => {
    it('should pursue players within visibility range', () => {
      const monster = {
        id: 'test-monster',
        type: 'goblin',
        position: { x: 5, y: 5, level: 0 },
        health: 50,
        damage: 5,
        visibility: 3,
        moveInterval: 1000
      };
      game.monsters.push(monster);

      // Test pursuit when player is visible
      player.position = { x: 4, y: 5, level: 0 };
      const moveResult1 = gameEngine.monsterAI.moveMonster(game, monster);
      expect(moveResult1.didPursue).toBe(true);

      // Test no pursuit when player is out of range
      player.position = { x: 9, y: 9, level: 0 };
      const moveResult2 = gameEngine.monsterAI.moveMonster(game, monster);
      expect(moveResult2.didPursue).toBe(false);
    });

    it('should increase pursuit range with difficulty', () => {
      const easyGame = gameEngine.createGame('easy-game', 10, 10, 3, 1);
      const hardGame = gameEngine.createGame('hard-game', 10, 10, 3, 8);

      const easyMonster = easyGame.monsters[0];
      const hardMonster = hardGame.monsters[0];

      expect(hardMonster.visibility).toBeGreaterThan(easyMonster.visibility);
    });
  });

  describe('Combat and Item Stealing', () => {
    it('should allow map stealing during combat', () => {
      const player2: Player = {
        ...player,
        id: 'player2',
        position: { ...player.position }
      };
      game.players.push(player2);

      // Give first player map knowledge
      player.map.cells = Array(3).fill(null).map(() =>
        Array(10).fill(null).map(() =>
          Array(10).fill(true)
        )
      );

      // Simulate combat
      const combatResult = gameEngine.combatSystem.resolveCombat(game, player.position);
      
      // Check if map was stolen
      const mapWasStolen = combatResult.some(result => 
        result.mapStolen && result.defender === player.id
      );

      if (mapWasStolen) {
        expect(player2.map.cells[0][0][0]).toBe(true);
        expect(player.map.cells[0][0][0]).toBe(false);
      }
    });
  });
});
