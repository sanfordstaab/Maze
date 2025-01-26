import { Game, Position, Player, Item, Monster } from '../types';
import { MonsterAI } from './MonsterAI';
import { CombatSystem } from './CombatSystem';
import { ItemSystem } from './ItemSystem';
import { VisibilitySystem } from './VisibilitySystem';
import { MapSystem } from './MapSystem';
import { MazeGenerator } from './MazeGenerator';

export class GameEngine {
  public games: Map<string, Game> = new Map();
  private gameTimeouts: Map<string, NodeJS.Timeout> = new Map();
  public monsterAI: MonsterAI;
  public combatSystem: CombatSystem;
  public itemSystem: ItemSystem;
  public visibilitySystem: VisibilitySystem;
  public mapSystem: MapSystem;

  private readonly GAME_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor() {
    this.mapSystem = new MapSystem();
    this.monsterAI = new MonsterAI();
    this.combatSystem = new CombatSystem(this.mapSystem);
    this.itemSystem = new ItemSystem();
    this.visibilitySystem = new VisibilitySystem();
  }

  createGame(gameId: string, width: number, height: number, levels: number, difficulty: number = 1): Game {
    console.assert(gameId && typeof gameId === 'string', 'gameId must be a non-empty string');
    console.assert(width > 0 && height > 0 && levels > 0, 'dimensions must be positive numbers');
    console.assert(difficulty >= 1 && difficulty <= 10, 'difficulty must be between 1 and 10');
    console.assert(!this.games.has(gameId), 'game with this ID already exists');

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
      id: gameId,
      players: [],
      status: 'waiting',
      maze,
      createdAt: new Date(),
      monsters: this.generateMonsters(width, height, levels, settings),
      difficulty,
      exitPosition,
      difficultySettings: settings
    };

    this.games.set(gameId, game);
    return game;
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

  private generateMonsters(width: number, height: number, levels: number, settings: Game['difficultySettings']): Monster[] {
    const monsters: Monster[] = [];
    const monsterCount = settings.monsterCount;
    if (monsterCount === 0) return monsters;

    for (let i = 0; i < monsterCount; i++) {
      const level = Math.floor(Math.random() * levels);
      const monsterType = this.getRandomMonsterType(settings);
      monsters.push({
        id: `monster-${i}`,
        type: monsterType,
        position: {
          x: Math.floor(Math.random() * width),
          y: Math.floor(Math.random() * height),
          level
        },
        health: this.getMonsterHealth(monsterType, settings),
        damage: settings.monsterDamage,
        visibility: settings.monsterVisibility,
        moveInterval: settings.monsterMoveInterval
      });
    }

    return monsters;
  }

  private getRandomPosition(game: Game): Position {
    return {
      x: Math.floor(Math.random() * game.maze.width),
      y: Math.floor(Math.random() * game.maze.height),
      level: 0
    };
  }

  private calculateNewPosition(game: Game, currentPosition: Position, direction: 'north' | 'south' | 'east' | 'west' | 'up' | 'down'): Position {
    const { x, y, level } = currentPosition;
    const { width, height, levels } = game.maze;

    switch (direction) {
      case 'north':
        return { x, y: (y - 1 + height) % height, level };
      case 'south':
        return { x, y: (y + 1) % height, level };
      case 'east':
        return { x: (x + 1) % width, y, level };
      case 'west':
        return { x: (x - 1 + width) % width, y, level };
      case 'up':
        return { x, y, level: (level + 1) % levels };
      case 'down':
        return { x, y, level: (level - 1 + levels) % levels };
    }
  }

  private canMoveTo(game: Game, from: Position, to: Position): { allowed: boolean; isSecretDoor: boolean } {
    const cell = game.maze.grid[from.level][from.y][from.x];
    const direction = this.getDirection(from, to);
    
    if (!direction) return { allowed: false, isSecretDoor: false };

    // Check if there's a wall in that direction
    if (cell.walls[direction]) {
      // Check for secret door
      if (cell.secretDoors?.[direction]) {
        return { allowed: true, isSecretDoor: true };
      }
      return { allowed: false, isSecretDoor: false };
    }

    return { allowed: true, isSecretDoor: false };
  }

  private getDirection(from: Position, to: Position): 'north' | 'south' | 'east' | 'west' | null {
    if (from.x !== to.x) {
      return from.x < to.x ? 'east' : 'west';
    }
    if (from.y !== to.y) {
      return from.y < to.y ? 'south' : 'north';
    }
    return null;
  }

  private getRandomMonsterType(settings: Game['difficultySettings']): 'goblin' | 'troll' | 'dragon' {
    if (settings.allowDragons && Math.random() < 0.2) return 'dragon';
    if (settings.allowTrolls && Math.random() < 0.4) return 'troll';
    return 'goblin';
  }

  public getMonsterHealth(monsterType: 'goblin' | 'troll' | 'dragon', settings: Game['difficultySettings']): number {
    console.assert(settings && typeof settings.monsterDamage === 'number', 'settings must include monsterDamage');
    console.assert(['goblin', 'troll', 'dragon'].includes(monsterType), 'invalid monster type');

    switch (monsterType) {
      case 'goblin':
        return 30 + settings.monsterDamage * 2;
      case 'troll':
        return 80 + settings.monsterDamage * 3;
      case 'dragon':
        return 150 + settings.monsterDamage * 4;
      default:
        return 30 + settings.monsterDamage * 2; // Default to goblin health
    }
  }

  public addPlayer(gameId: string, player: Player): void {
    console.assert(gameId && typeof gameId === 'string', 'gameId must be a non-empty string');
    console.assert(player && player.id && player.name, 'player must have id and name');
    console.assert(this.games.has(gameId), 'game must exist');
    
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

  public movePlayer(gameId: string, playerId: string, direction: 'north' | 'south' | 'east' | 'west' | 'up' | 'down'): {
    success: boolean;
    combatResults?: Array<{
      attacker: string;
      defender: string;
      damage: number;
      isMonster?: boolean;
      itemStolen?: Item;
      mapStolen?: boolean;
    }>;
    gameWon?: boolean;
    secretDoorFound?: boolean;
    mapDropped?: boolean;
  } {
    console.assert(gameId && typeof gameId === 'string', 'gameId must be a non-empty string');
    console.assert(playerId && typeof playerId === 'string', 'playerId must be a non-empty string');
    console.assert(direction, 'direction must be specified');
    console.assert(this.games.has(gameId), 'game must exist');
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

  public removePlayer(gameId: string, playerId: string): void {
    console.assert(gameId && typeof gameId === 'string', 'gameId must be a non-empty string');
    console.assert(playerId && typeof playerId === 'string', 'playerId must be a non-empty string');
    console.assert(this.games.has(gameId), 'game must exist');

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

  public getPlayerVisibleState(gameId: string, playerId: string): Partial<Game> {
    const game = this.games.get(gameId);
    if (!game) throw new Error('Game not found');

    const player = game.players.find(p => p.id === playerId);
    if (!player) throw new Error('Player not found');

    return this.visibilitySystem.getVisibleState(game, player);
  }

  public checkWinCondition(game: Game, player: Player): boolean {
    const hasKey = player.inventory.some(item => item.type === 'key');
    const atExit = 
      player.position.x === game.exitPosition.x &&
      player.position.y === game.exitPosition.y &&
      player.position.level === game.exitPosition.level;

    return hasKey && atExit;
  }
}
