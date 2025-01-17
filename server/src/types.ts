export interface Position {
  x: number;
  y: number;
  level: number;
}

export interface MapData {
  cells: boolean[][][];  // [level][y][x] - true if cell has been seen
  startPosition: Position;
}

export interface Player {
  id: string;
  name: string;
  position: Position;
  health: number;
  inventory: Item[];
  socketId: string;
  map: MapData;
}

export interface Item {
  id: string;
  type: 'key' | 'flashlight' | 'potion' | 'map';
  position: Position;
}

export interface MazeCell {
  walls: {
    north: boolean;
    south: boolean;
    east: boolean;
    west: boolean;
  };
  items: Item[];
  secretDoors?: {
    north?: boolean;
    south?: boolean;
    east?: boolean;
    west?: boolean;
  };
  hasStairs?: {
    up?: boolean;
    down?: boolean;
  };
}

export interface Maze {
  width: number;
  height: number;
  levels: number;
  grid: MazeCell[][][]; // [level][y][x]
}

export interface Monster {
  id: string;
  type: 'goblin' | 'troll' | 'dragon';
  position: Position;
  health: number;
  damage: number;
  visibility: number;
  moveInterval: number;
}

export interface CombatResult {
  attacker: string;
  defender: string;
  damage: number;
  isMonster?: boolean;
  itemStolen?: Item;
}

export interface DifficultySettings {
  monsterCount: number;
  monsterMoveInterval: number;
  monsterVisibility: number;
  monsterDamage: number;
  playerVisibility: number;
  healingPotionCount: number;
  healingPotionStrength: number;
  playerVsPlayerEnabled: boolean;
  secretDoorChance: number;
  mapDropChance: number;
}

export interface DifficultySettings {
  monsterCount: number;
  monsterMoveInterval: number;
  monsterVisibility: number;
  monsterDamage: number;
  monsterPursuitEnabled: boolean;
  playerVisibility: number;
  healingPotionCount: number;
  healingPotionStrength: number;
  playerVsPlayerEnabled: boolean;
  secretDoorChance: number;
  allowTrolls: boolean;
  allowDragons: boolean;
  mapDropChance: number;
}

export interface Game {
  id: string;
  players: Player[];
  monsters: Monster[];
  status: 'waiting' | 'ongoing' | 'finished';
  maze: Maze;  // Changed from Maze | null since it's always initialized
  createdAt: Date;
  difficulty: number;
  winner?: {
    playerId: string;
    playerName: string;
    exitedWithKey?: boolean;
  };
  exitPosition: Position;
  difficultySettings: DifficultySettings;
}

export type GameState = Omit<Game, 'maze'> & {
  maze: Partial<Maze>; // Only send visible portions to clients
};
