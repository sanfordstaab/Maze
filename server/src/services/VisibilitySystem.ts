import { Game, Player, Position } from '../types';

export class VisibilitySystem {
  calculateVisibility(game: Game, player: Player): boolean[][][] {
    const { width, height, levels } = game.maze;
    const visibility: boolean[][][] = Array(levels).fill(null).map(() =>
      Array(height).fill(null).map(() =>
        Array(width).fill(false)
      )
    );

    const baseRange = game.difficultySettings.playerVisibility;
    const hasFlashlight = player.inventory.some(item => item.type === 'flashlight');
    const viewRange = hasFlashlight ? baseRange * 2 : baseRange;

    // Mark current position as visible
    visibility[player.position.level][player.position.y][player.position.x] = true;

    // Check visibility in all directions
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 180) {
      this.castRay(
        game,
        player.position,
        angle,
        viewRange,
        visibility
      );
    }

    return visibility;
  }

  private castRay(
    game: Game,
    start: Position,
    angle: number,
    maxDistance: number,
    visibility: boolean[][][]
  ) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let distance = 1;

    while (distance <= maxDistance) {
      const x = Math.floor(start.x + dx * distance);
      const y = Math.floor(start.y + dy * distance);

      // Handle wrapping
      const wrappedX = this.wrap(x, game.maze.width);
      const wrappedY = this.wrap(y, game.maze.height);

      // Mark cell as visible
      visibility[start.level][wrappedY][wrappedX] = true;

      // Check if we hit a wall
      const cell = game.maze.grid[start.level][wrappedY][wrappedX];
      if (this.isWallInDirection(cell, angle)) {
        break;
      }

      distance++;
    }
  }

  private isWallInDirection(cell: MazeCell, angle: number): boolean {
    // Normalize angle to 0-2π
    const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

    // Check if there's a wall in the direction we're looking
    if (normalizedAngle < Math.PI / 4 || normalizedAngle > Math.PI * 7 / 4) {
      return cell.walls.east && !cell.hasSecretDoor;
    } else if (normalizedAngle < Math.PI * 3 / 4) {
      return cell.walls.south && !cell.hasSecretDoor;
    } else if (normalizedAngle < Math.PI * 5 / 4) {
      return cell.walls.west && !cell.hasSecretDoor;
    } else if (normalizedAngle < Math.PI * 7 / 4) {
      return cell.walls.north && !cell.hasSecretDoor;
    }
    return false;
  }

  private wrap(value: number, max: number): number {
    if (value < 0) return max - 1;
    if (value >= max) return 0;
    return value;
  }

  getVisibleState(game: Game, player: Player): Partial<Game> {
    const visibility = this.calculateVisibility(game, player);
    const visibleState: Partial<Game> = {
      ...game,
      maze: {
        ...game.maze,
        grid: game.maze.grid.map((level, l) =>
          level.map((row, y) =>
            row.map((cell, x) =>
              visibility[l][y][x] ? cell : {
                walls: cell.walls,
                items: [],
                hasStairs: undefined,
                hasSecretDoor: undefined
              }
            )
          )
        )
      },
      // Only include visible monsters
      monsters: game.monsters.filter(monster =>
        visibility[monster.position.level][monster.position.y][monster.position.x]
      ),
      // Only include visible players
      players: game.players.filter(p =>
        visibility[p.position.level][p.position.y][p.position.x]
      )
    };

    return visibleState;
  }
}
