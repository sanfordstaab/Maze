import { Game, Player, Position, MazeCell } from '../types';

export class VisibilitySystem {
  getVisibleState(game: Game, player: Player): Partial<Game> {
    const visibleCells = this.calculateVisibleCells(game, player);
    return {
      ...game,
      maze: {
        ...game.maze,
        grid: this.filterVisibleGrid(game.maze.grid, visibleCells)
      }
    };
  }

  private calculateVisibleCells(game: Game, player: Player): boolean[][][] {
    const { width, height, levels } = game.maze;
    const visibility = Array(levels)
      .fill(null)
      .map(() => Array(height)
        .fill(null)
        .map(() => Array(width).fill(false)));

    const range = player.inventory.some(item => item.type === 'flashlight') 
      ? game.difficultySettings.playerVisibility * 2 
      : game.difficultySettings.playerVisibility;

    // Mark cells within range as visible
    for (let dy = -range; dy <= range; dy++) {
      for (let dx = -range; dx <= range; dx++) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= range) {
          const x = this.wrap(player.position.x + dx, width);
          const y = this.wrap(player.position.y + dy, height);
          visibility[player.position.level][y][x] = true;
        }
      }
    }

    return visibility;
  }

  private filterVisibleGrid(grid: MazeCell[][][], visibility: boolean[][][]): MazeCell[][][] {
    return grid.map((level, l) =>
      level.map((row, y) =>
        row.map((cell, x) =>
          visibility[l][y][x] ? cell : this.getHiddenCell()
        )
      )
    );
  }

  private getHiddenCell(): MazeCell {
    return {
      walls: { north: false, south: false, east: false, west: false },
      items: []
    };
  }

  private wrap(value: number, max: number): number {
    if (value < 0) return max - 1;
    if (value >= max) return 0;
    return value;
  }
}
