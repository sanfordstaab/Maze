import { Maze, MazeCell, Position } from '../types';

export class MazeGenerator {
  private width: number;
  private height: number;
  private levels: number;
  private grid: MazeCell[][][];
  private visited: boolean[][][];

  constructor(width: number, height: number, levels: number) {
    console.assert(width > 0 && height > 0 && levels > 0, 'dimensions must be positive numbers');
    console.assert(width <= 100 && height <= 100, 'maze dimensions cannot exceed 100x100');
    console.assert(levels <= 10, 'cannot have more than 10 levels');

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
    console.assert(this.grid.length === this.levels, 'grid not properly initialized');
    console.assert(this.grid[0].length === this.height, 'grid height mismatch');
    console.assert(this.grid[0][0].length === this.width, 'grid width mismatch');

    // Start from a random position on level 0
    const startX = Math.floor(Math.random() * this.width);
    const startY = Math.floor(Math.random() * this.height);
    this.carve({ x: startX, y: startY, level: 0 });

    // Add stairs between levels
    this.addStairsBetweenLevels();

    return {
      width: this.width,
      height: this.height,
      levels: this.levels,
      grid: this.grid
    };
  }

  private carve(pos: Position): void {
    console.assert(pos.level >= 0 && pos.level < this.levels, 'invalid level');
    console.assert(pos.x >= 0 && pos.x < this.width, 'invalid x position');
    console.assert(pos.y >= 0 && pos.y < this.height, 'invalid y position');

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
