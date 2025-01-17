import { Monster, Game, Position } from '../types';

export class MonsterAI {
  private moveMonsterIntervals: Map<string, NodeJS.Timeout> = new Map();

  startMonsterMovement(game: Game, monster: Monster) {
    const monster = game.monsters.find(m => m.id === monsterId);
    if (!monster) return;

    // Clear any existing interval
    this.stopMonsterMovement(monsterId);

    // Start new movement interval based on difficulty
    const interval = setInterval(() => {
      this.moveMonster(game, monster);
    }, game.difficultySettings.monsterMoveInterval);

    this.moveMonsterIntervals.set(monsterId, interval);
  }

  stopMonsterMovement(monsterId: string) {
    const interval = this.moveMonsterIntervals.get(monsterId);
    if (interval) {
      clearInterval(interval);
      this.moveMonsterIntervals.delete(monsterId);
    }
  }

  private moveMonster(game: Game, monster: Monster): { didPursue: boolean } {
    // Find nearest player within visibility range
    const nearestPlayer = this.findNearestPlayer(game, monster);

    // Only pursue at higher difficulties and if player is visible
    if (nearestPlayer && game.difficultySettings.monsterPursuitEnabled) {
      // Move towards player through valid paths
      const path = this.findPathToPlayer(game, monster.position, nearestPlayer.position);
      if (path.length > 0) {
        monster.position = path[0]; // Move to next position in path
        return { didPursue: true };
      }
    }

    // Random movement if not pursuing
    const validMoves = this.getValidMoves(game, monster.position);
    if (validMoves.length > 0) {
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      monster.position = randomMove;
    }

    return { didPursue: false };
  }

  private findPathToPlayer(game: Game, start: Position, target: Position): Position[] {
    // Simple A* or similar pathfinding could be implemented here
    // For now, just move in the general direction of the player
    const dx = Math.sign(target.x - start.x);
    const dy = Math.sign(target.y - start.y);
    
    const possibleMoves = [
      { x: start.x + dx, y: start.y },
      { x: start.x, y: start.y + dy }
    ].map(pos => ({
      ...pos,
      level: start.level
    }));

    return possibleMoves.filter(pos => this.isValidMove(game, start, pos));
  }

  private getValidMoves(game: Game, pos: Position): Position[] {
    const directions = [
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 }
    ];

    return directions
      .map(({ dx, dy }) => ({
        x: this.wrap(pos.x + dx, game.maze.width),
        y: this.wrap(pos.y + dy, game.maze.height),
        level: pos.level
      }))
      .filter(newPos => this.isValidMove(game, pos, newPos));
  }

  private isValidMove(game: Game, from: Position, to: Position): boolean {
    const cell = game.maze.grid[from.level][from.y][from.x];
    
    // Check walls and secret doors
    if (to.x > from.x && cell.walls.east && !cell.secretDoors?.east) return false;
    if (to.x < from.x && cell.walls.west && !cell.secretDoors?.west) return false;
    if (to.y > from.y && cell.walls.south && !cell.secretDoors?.south) return false;
    if (to.y < from.y && cell.walls.north && !cell.secretDoors?.north) return false;

    return true;
  }

  private findNearestPlayer(game: Game, monster: Monster): { position: Position, id: string } | null {
    let nearest = null;
    let minDistance = Infinity;

    for (const player of game.players) {
      if (player.position.level !== monster.position.level) continue;

      const distance = Math.sqrt(
        Math.pow(player.position.x - monster.position.x, 2) +
        Math.pow(player.position.y - monster.position.y, 2)
      );

      if (distance <= monster.visibility && distance < minDistance) {
        minDistance = distance;
        nearest = { position: player.position, id: player.id };
      }
    }

    return nearest;
  }

  private calculateNextPosition(current: Position, target: Position): Position {
    // Simple A* or pathfinding could be implemented here
    // For now, just move in the direction of the player
    const dx = Math.sign(target.x - current.x);
    const dy = Math.sign(target.y - current.y);

    return {
      x: current.x + dx,
      y: current.y + dy,
      level: current.level
    };
  }

  private wrap(value: number, max: number): number {
    if (value < 0) return max - 1;
    if (value >= max) return 0;
    return value;
  }
}
