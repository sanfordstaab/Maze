  private getAdjacentCell(x: number, y: number, wall: 'north' | 'south' | 'east' | 'west'): [number, number] {
    switch (wall) {
      case 'north':
        return [x, this.wrap(y - 1, this.height)];
      case 'south':
        return [x, this.wrap(y + 1, this.height)];
      case 'east':
        return [this.wrap(x + 1, this.width), y];
      case 'west':
        return [this.wrap(x - 1, this.width), y];
    }
  }

  private getOppositeWall(wall: 'north' | 'south' | 'east' | 'west'): 'north' | 'south' | 'east' | 'west' {
    switch (wall) {
      case 'north': return 'south';
      case 'south': return 'north';
      case 'east': return 'west';
      case 'west': return 'east';
    }
  }
import { Maze, MazeCell, Position } from '../types';

export class MazeGenerator {
  private width: number;
  private height: number;
  private levels: number;
  private grid: MazeCell[][][];
  private visited: boolean[][][];

  constructor(width: number, height: number, levels: number) {
    this.width = width;
    this.height = height;
    this.levels = levels;
    this.grid = [];
    this.visited = [];
    
    // Initialize grid with all walls
    for (let l = 0; l < levels; l++) {
      this.grid[l] = [];
      this.visited[l] = [];
      for (let y = 0; y < height; y++) {
        this.grid[l][y] = [];
        this.visited[l][y] = [];
        for (let x = 0; x < width; x++) {
          this.grid[l][y][x] = {
            walls: {
              north: true,
              south: true,
              east: true,
              west: true
            },
            items: []
          };
          this.visited[l][y][x] = false;
        }
      }
    }
  }

  generate(): Maze {
    // Start from a random position on level 0
    const startX = Math.floor(Math.random() * this.width);
    const startY = Math.floor(Math.random() * this.height);
    this.carve({ x: startX, y: startY, level: 0 });

    // Add stairs between levels
    this.addStairsBetweenLevels();

    // Add secret doors (random walls that can be passed through)
    this.addSecretDoors();

    return {
      width: this.width,
      height: this.height,
      levels: this.levels,
      grid: this.grid
    };
  }

  private carve(pos: Position): void {
    this.visited[pos.level][pos.y][pos.x] = true;

    // Get all possible directions in random order
    const directions = this.getShuffledDirections();

    for (const [dx, dy] of directions) {
      const nextX = this.wrap(pos.x + dx, this.width);
      const nextY = this.wrap(pos.y + dy, this.height);

      if (!this.visited[pos.level][nextY][nextX]) {
        // Remove walls between current and next cell
        if (dx === 1) { // Moving east
          this.grid[pos.level][pos.y][pos.x].walls.east = false;
          this.grid[pos.level][nextY][nextX].walls.west = false;
        } else if (dx === -1) { // Moving west
          this.grid[pos.level][pos.y][pos.x].walls.west = false;
          this.grid[pos.level][nextY][nextX].walls.east = false;
        } else if (dy === 1) { // Moving south
          this.grid[pos.level][pos.y][pos.x].walls.south = false;
          this.grid[pos.level][nextY][nextX].walls.north = false;
        } else if (dy === -1) { // Moving north
          this.grid[pos.level][pos.y][pos.x].walls.north = false;
          this.grid[pos.level][nextY][nextX].walls.south = false;
        }

        this.carve({ x: nextX, y: nextY, level: pos.level });
      }
    }
  }

  private addStairsBetweenLevels(): void {
    for (let level = 0; level < this.levels - 1; level++) {
      // Add 1-2 staircases per level
      const numStairs = 1 + Math.floor(Math.random() * 2);
      
      for (let i = 0; i < numStairs; i++) {
        const x = Math.floor(Math.random() * this.width);
        const y = Math.floor(Math.random() * this.height);

        this.grid[level][y][x].hasStairs = {
          up: true
        };
        this.grid[level + 1][y][x].hasStairs = {
          down: true
        };
      }
    }
  }

  private addSecretDoors(secretDoorChance: number): void {
    // Add secret doors based on difficulty setting
    const totalCells = this.width * this.height * this.levels;
    const numSecretDoors = Math.floor(totalCells * secretDoorChance);

    for (let i = 0; i < numSecretDoors; i++) {
      const level = Math.floor(Math.random() * this.levels);
      const y = Math.floor(Math.random() * this.height);
      const x = Math.floor(Math.random() * this.width);

      // Randomly choose a wall to make secret
      const cell = this.grid[level][y][x];
      const walls = ['north', 'south', 'east', 'west'] as const;
      const wallIndex = Math.floor(Math.random() * walls.length);
      const wall = walls[wallIndex];

      // Only add secret door if there's actually a wall there
      if (cell.walls[wall]) {
        cell.secretDoors = cell.secretDoors || {};
        cell.secretDoors[wall] = true;

        // Add secret door to adjacent cell's opposite wall
        const [nextX, nextY] = this.getAdjacentCell(x, y, wall);
        const adjacentCell = this.grid[level][nextY][nextX];
        const oppositeWall = this.getOppositeWall(wall);
        adjacentCell.secretDoors = adjacentCell.secretDoors || {};
        adjacentCell.secretDoors[oppositeWall] = true;
      }
    }
  }

  private getShuffledDirections(): [number, number][] {
    const directions: [number, number][] = [
      [0, -1], // North
      [1, 0],  // East
      [0, 1],  // South
      [-1, 0]  // West
    ];

    // Fisher-Yates shuffle
    for (let i = directions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [directions[i], directions[j]] = [directions[j], directions[i]];
    }

    return directions;
  }

  private wrap(value: number, max: number): number {
    // Implement wrapping around edges
    if (value < 0) return max - 1;
    if (value >= max) return 0;
    return value;
  }
}
