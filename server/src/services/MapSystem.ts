import { Game, Player, Position, MapData } from '../types';

export class MapSystem {
  initializePlayerMap(player: Player, startPosition: Position): void {
    const emptyMap: MapData = {
      cells: [],
      startPosition
    };
    player.map = emptyMap;
  }

  updatePlayerMap(game: Game, player: Player, visibility: boolean[][][]): void {
    if (!player.map.cells.length) {
      // Initialize map array if it doesn't exist
      player.map.cells = Array(game.maze.levels)
        .fill(null)
        .map(() => Array(game.maze.height)
          .fill(null)
          .map(() => Array(game.maze.width).fill(false)));
    }

    // Update map with newly visible cells
    for (let l = 0; l < game.maze.levels; l++) {
      for (let y = 0; y < game.maze.height; y++) {
        for (let x = 0; x < game.maze.width; x++) {
          if (visibility[l][y][x]) {
            player.map.cells[l][y][x] = true;
          }
        }
      }
    }
  }

  transferMap(fromPlayer: Player, toPlayer: Player): void {
    // Create a merged map combining both players' knowledge
    const mergedMap: boolean[][][] = fromPlayer.map.cells.map((level, l) =>
      level.map((row, y) =>
        row.map((cell, x) => cell || (toPlayer.map.cells[l]?.[y]?.[x] || false))
      )
    );

    // Update receiver's map
    toPlayer.map.cells = mergedMap;

    // Reset giver's map to only their current view
    fromPlayer.map.cells = fromPlayer.map.cells.map(level =>
      level.map(row => row.map(() => false))
    );

    // Keep starting position for reference
    fromPlayer.map.startPosition = { ...fromPlayer.position };
  }

  checkMapDrop(game: Game, player: Player): boolean {
    // Check for random map drop based on difficulty
    if (Math.random() < game.difficultySettings.mapDropChance) {
      this.dropMap(game, player);
      return true;
    }
    return false;
  }

  dropMap(game: Game, player: Player): void {
    // Create a new map item with the player's current map data
    const mapItem: Item = {
      id: uuidv4(),
      type: 'map',
      position: { ...player.position }
    };

    // Add the map to the current cell
    const cell = game.maze.grid[player.position.level][player.position.y][player.position.x];
    cell.items.push(mapItem);

    // Reset player's map to only current visibility
    player.map.cells = player.map.cells.map(level =>
      level.map(row => row.map(() => false))
    );

    // Keep starting position for reference
    player.map.startPosition = { ...player.position };
  }

  pickupDroppedMap(fromMap: Item, toPlayer: Player): void {
    // Merge the dropped map with the player's current map
    // In a real implementation, we'd need to store the map data with the item
    // For now, we'll just mark additional cells as visible
    const currentLevel = toPlayer.position.level;
    const radius = 5; // Arbitrary radius for demonstration

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = this.wrap(toPlayer.position.x + dx, toPlayer.map.cells[0][0].length);
        const y = this.wrap(toPlayer.position.y + dy, toPlayer.map.cells[0].length);
        toPlayer.map.cells[currentLevel][y][x] = true;
      }
    }
  }

  dropMap(game: Game, player: Player): void {
    // Create a new map item with the player's current map data
    const mapItem: Item = {
      id: uuidv4(),
      type: 'map',
      position: { ...player.position }
    };

    // Add the map to the current cell
    const cell = game.maze.grid[player.position.level][player.position.y][player.position.x];
    cell.items.push(mapItem);

    // Reset player's map to only current visibility
    player.map.cells = player.map.cells.map(level =>
      level.map(row => row.map(() => false))
    );
  }

  pickupDroppedMap(fromMap: Item, toPlayer: Player): void {
    // Merge the dropped map with the player's current map
    // In a real implementation, we'd need to store the map data with the item
    // For now, we'll just mark additional cells as visible
    const currentLevel = toPlayer.position.level;
    const radius = 5; // Arbitrary radius for demonstration

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = this.wrap(toPlayer.position.x + dx, toPlayer.map.cells[0][0].length);
        const y = this.wrap(toPlayer.position.y + dy, toPlayer.map.cells[0].length);
        toPlayer.map.cells[currentLevel][y][x] = true;
      }
    }
  }

  private wrap(value: number, max: number): number {
    if (value < 0) return max - 1;
    if (value >= max) return 0;
    return value;
  }
}
