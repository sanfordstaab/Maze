      case 'up':
        const currentCell = game.maze.grid[level][y][x];
        if (currentCell.hasStairs?.up) {
          // Top level wraps to bottom
          level = level === levels - 1 ? 0 : level + 1;
          // Ensure corresponding stairs exist at destination
          const destCell = game.maze.grid[level][y][x];
          if (!destCell.hasStairs?.down) {
            return { x, y, level: current.level }; // Revert if no matching stairs
          }
        }
        break;
      case 'down':
        const downCell = game.maze.grid[level][y][x];
        if (downCell.hasStairs?.down) {
          // Bottom level wraps to top
          level = level === 0 ? levels - 1 : level - 1;
          // Ensure corresponding stairs exist at destination
          const destCell = game.maze.grid[level][y][x];
          if (!destCell.hasStairs?.up) {
            return { x, y, level: current.level }; // Revert if no matching stairs
          }
        }
        break;  private getMonsterHealth(settings: DifficultySettings): number {
    return {
      'goblin': 30 + settings.monsterDamage * 2,
      'troll': 80 + settings.monsterDamage * 3,
      'dragon': 150 + settings.monsterDamage * 4
    }[type];
  }
  removePlayer(gameId: string, playerId: string): void {
    const game = this.games.get(gameId);
    if (!game) return;

    // Remove player
    game.players = game.players.filter(p => p.id !== playerId);

    // If game is empty, start timeout
    if (game.players.length === 0) {
      const timeout = setTimeout(() => {
        this.games.delete(gameId);
        this.gameTimeouts.delete(gameId);
        console.log(`Game ${gameId} destroyed after timeout`);
      }, this.GAME_TIMEOUT);
      
      this.gameTimeouts.set(gameId, timeout);
    }

    // If player had key and game was ongoing, end game
    const player = game.players.find(p => p.id === playerId);
    if (player?.inventory.some(item => item.type === 'key') && game.status === 'ongoing') {
      game.status = 'finished';
      game.winner = {
        playerId: player.id,
        playerName: player.name,
        exitedWithKey: true
      };
    }
  }

  private checkWinCondition(game: Game, player: Player): boolean {
    const hasKey = player.inventory.some(item => item.type === 'key');
    const atExit = 
      player.position.x === game.exitPosition.x &&
      player.position.y === game.exitPosition.y &&
      player.position.level === game.exitPosition.level;

    return hasKey && atExit;
  }
  private generateMonsters(width: number, height: number, levels: number, settings: DifficultySettings): Monster[] {
    const monsters: Monster[] = [];
    if (settings.monsterCount === 0) return monsters;

    for (let i = 0; i < monsterCount; i++) {
      const level = Math.floor(Math.random() * levels);
      monsters.push({
        id: `monster-${i}`,
        type: this.getRandomMonsterType(settings),
        position: {
          x: Math.floor(Math.random() * width),
          y: Math.floor(Math.random() * height),
          level
        },
        health: this.getMonsterHealth(settings),
        damage: settings.monsterDamage,
        visibility: settings.monsterVisibility,
        moveInterval: settings.monsterMoveInterval
      });
    }

    return monsters;
  }

  private getRandomMonsterType(settings: DifficultySettings): 'goblin' | 'troll' | 'dragon' {
    if (settings.allowDragons && Math.random() < 0.2) return 'dragon';
    if (settings.allowTrolls && Math.random() < 0.4) return 'troll';
    return 'goblin';
  }
import { Game, Position, Player, Item, Monster } from '../types';
import { MonsterAI } from './MonsterAI';
import { CombatSystem } from './CombatSystem';
import { ItemSystem } from './ItemSystem';
import { VisibilitySystem } from './VisibilitySystem';
import { MapSystem } from './MapSystem';
import { MazeGenerator } from './MazeGenerator';export class GameEngine {
  private games: Map<string, Game> = new Map();
  private gameTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private monsterAI: MonsterAI;
  private combatSystem: CombatSystem;
  private itemSystem: ItemSystem;
  private visibilitySystem: VisibilitySystem;
  private mapSystem: MapSystem;

  private readonly GAME_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor() {
    this.monsterAI = new MonsterAI();
    this.combatSystem = new CombatSystem();
    this.itemSystem = new ItemSystem();
    this.visibilitySystem = new VisibilitySystem();
    this.mapSystem = new MapSystem();
  }

  addPlayer(gameId: string, player: Player): void {
    // Clear any existing timeout when a player joins
    if (this.gameTimeouts.has(gameId)) {
      clearTimeout(this.gameTimeouts.get(gameId));
      this.gameTimeouts.delete(gameId);
    }
    const game = this.games.get(gameId);
    if (!game) throw new Error('Game not found');

    // Place player at random position on level 0
    player.position = this.getRandomPosition(game);
    
    // Initialize player's map
    this.mapSystem.initializePlayerMap(player, player.position);
    
    game.players.push(player);

    if (game.status === 'waiting' && game.players.length > 0) {
      game.status = 'ongoing';
    }
  }

  getPlayerVisibleState(gameId: string, playerId: string): Partial<Game> {
    const game = this.games.get(gameId);
    if (!game) throw new Error('Game not found');

    const player = game.players.find(p => p.id === playerId);
    if (!player) throw new Error('Player not found');

    const visibility = this.visibilitySystem.calculateVisibility(game, player);
    
    // Update player's map with newly visible areas
    this.mapSystem.updatePlayerMap(game, player, visibility);
    
    return this.visibilitySystem.getVisibleState(game, player);
  }

  getPlayerVisibleState(gameId: string, playerId: string): Partial<Game> {
    const game = this.games.get(gameId);
    if (!game) throw new Error('Game not found');

    const player = game.players.find(p => p.id === playerId);
    if (!player) throw new Error('Player not found');

    return this.visibilitySystem.getVisibleState(game, player);
  }

  private getDifficultySettings(difficulty: number) {
    // Based on DifficultyTable.png
    return {
      // Monster settings
      monsterCount: difficulty <= 3 ? 0 : Math.floor(difficulty * 1.5),
      monsterMoveInterval: Math.max(3000 - difficulty * 300, 500), // 3s at diff 1, down to 0.5s at diff 10
      monsterVisibility: 2 + Math.floor(difficulty / 2), // 2 at diff 1, up to 7 at diff 10
      monsterDamage: 3 + Math.floor(difficulty * 1.5), // 4-5 at diff 1, up to 15-20 at diff 10
      monsterPursuitEnabled: difficulty > 5, // Only pursue players at higher difficulties
      
      // Player settings
      playerVisibility: Math.max(3, Math.floor(12 - difficulty)), // 12 at diff 1, down to 3 at diff 10
      healingPotionCount: Math.max(0, Math.floor(12 - difficulty)), // 12 at diff 1, down to 0 at diff 10
      healingPotionStrength: Math.max(10, Math.floor(60 - difficulty * 5)), // 55 at diff 1, down to 10 at diff 10
      
      // Combat settings
      playerVsPlayerEnabled: difficulty >= 5,
      secretDoorChance: 0.02 + (difficulty * 0.01), // 3% at diff 1, up to 12% at diff 10
      
      // Monster types allowed
      allowTrolls: difficulty >= 4,
      allowDragons: difficulty >= 8,
      
      // Map settings
      mapDropChance: 0.005 * difficulty // Higher chance to drop map at higher difficulties
    };
  }

  createGame(gameId: string, width: number, height: number, levels: number, difficulty: number): Game {
    const settings = this.getDifficultySettings(difficulty);
    const mazeGenerator = new MazeGenerator(width, height, levels);
    const maze = mazeGenerator.generate();

    // Generate exit position (random position on the highest level)
    const exitPosition: Position = {
      x: Math.floor(Math.random() * width),
      y: Math.floor(Math.random() * height),
      level: levels - 1
    };

    const game: Game = {
      ...this.initializeGame(gameId, width, height, levels),
      difficulty,
      difficultySettings: settings,
      id: gameId,
      players: [],
      status: 'waiting',
      maze,
      createdAt: new Date(),
      monsters: this.generateMonsters(width, height, levels, difficulty),
      difficulty,
      exitPosition
    };

    // Generate initial items
    this.itemSystem.generateInitialItems(game);
    
    this.games.set(gameId, game);
    return game;
  }

  addPlayer(gameId: string, player: Player): void {
    const game = this.games.get(gameId);
    if (!game) throw new Error('Game not found');

    // Place player at random position on level 0
    player.position = this.getRandomPosition(game);
    game.players.push(player);

    if (game.status === 'waiting' && game.players.length > 0) {
      game.status = 'ongoing';
    }
  }

  movePlayer(gameId: string, playerId: string, direction: 'north' | 'south' | 'east' | 'west' | 'up' | 'down'): {
    success: boolean;
    combatResults?: CombatResult[];
    gameWon?: boolean;
    secretDoorFound?: boolean;
    mapDropped?: boolean; 
    success: boolean;
    combatResults?: CombatResult[];
    gameWon?: boolean;
    secretDoorFound?: boolean;
  } {
    const game = this.games.get(gameId);
    if (!game) throw new Error('Game not found');

    const player = game.players.find(p => p.id === playerId);
    if (!player) throw new Error('Player not found');

    const newPosition = this.calculateNewPosition(game, player.position, direction);
    const { allowed, isSecretDoor } = this.canMoveTo(game, player.position, newPosition);
    
    if (allowed) {
      player.position = newPosition;
      
      // Check for combat
      const combatResults = this.combatSystem.resolveCombat(game, newPosition);
      
      // Heal player slightly on movement
      player.health = Math.min(100, player.health + 1);

      // Check for win condition
      const hasWon = this.checkWinCondition(game, player);
      if (hasWon) {
        game.status = 'finished';
        game.winner = {
          playerId: player.id,
          playerName: player.name
        };
      }

      // Check for random map drop
      const mapDropped = this.mapSystem.checkMapDrop(game, player);

      return {
        success: true,
        combatResults,
        gameWon: hasWon,
        secretDoorFound: isSecretDoor,
        mapDropped
      };
    }

    return { success: false };
  }

  private getRandomPosition(game: Game): Position {
    const level = 0; // Start on first level
    const x = Math.floor(Math.random() * game.maze.width);
    const y = Math.floor(Math.random() * game.maze.height);
    return { x, y, level };
  }

  private calculateNewPosition(game: Game, current: Position, direction: string): Position {
    const { width, height, levels } = game.maze;
    const { width, height } = game.maze;
    let { x, y, level } = current;

    switch (direction) {
      case 'north':
        y = y === 0 ? height - 1 : y - 1;
        break;
      case 'south':
        y = y === height - 1 ? 0 : y + 1;
        break;
      case 'east':
        x = x === width - 1 ? 0 : x + 1;
        break;
      case 'west':
        x = x === 0 ? width - 1 : x - 1;
        break;
    }

    return { x, y, level };
  }

  private canMoveTo(game: Game, from: Position, to: Position): { allowed: boolean; isSecretDoor: boolean } {
    const fromCell = game.maze.grid[from.level][from.y][from.x];
    
    // Determine direction of movement
    let direction: 'north' | 'south' | 'east' | 'west';
    if (to.x > from.x || (to.x === 0 && from.x === game.maze.width - 1)) {
      direction = 'east';
    } else if (to.x < from.x || (to.x === game.maze.width - 1 && from.x === 0)) {
      direction = 'west';
    } else if (to.y > from.y || (to.y === 0 && from.y === game.maze.height - 1)) {
      direction = 'south';
    } else {
      direction = 'north';
    }

    // Check for wall and secret door
    const hasWall = fromCell.walls[direction];
    const hasSecretDoor = fromCell.secretDoors?.[direction];

    // Allow movement if:
    // 1. No wall exists, or
    // 2. There's a secret door (50% chance of discovery)
    if (!hasWall || (hasSecretDoor && Math.random() < 0.5)) {
      return { allowed: true, isSecretDoor: !!hasSecretDoor };
    }

    return { allowed: false, isSecretDoor: false };
  }
}
