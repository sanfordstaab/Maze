export interface Position {
  x: number;
  y: number;
  level: number;
}

export interface Player {
  id: string;
  name: string;
  position: Position;
  health: number;
  inventory: Item[];
  socketId: string;
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
  hasSecretDoor?: boolean;
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

export interface Game {
  id: string;
  players: Player[];
  status: 'waiting' | 'ongoing' | 'finished';
  maze: Maze;
  createdAt: Date;
}
