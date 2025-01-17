import { Game, Player, Item, Position } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class ItemSystem {
  pickupItem(game: Game, playerId: string): Item | null {
    console.assert(game && game.players, 'game must exist with players');
    console.assert(playerId && typeof playerId === 'string', 'playerId must be a string');
    console.assert(game.maze && game.maze.grid, 'game must have initialized maze');

    const player = game.players.find(p => p.id === playerId);
    if (!player) return null;

    const cell = game.maze.grid[player.position.level][player.position.y][player.position.x];
    if (cell.items.length === 0) return null;

    // Get the first item in the cell
    const item = cell.items[0];

    // Handle item-specific pickup rules
    switch (item.type) {
      case 'flashlight':
        // Can only hold one flashlight
        if (player.inventory.some(i => i.type === 'flashlight')) {
          return null;
        }
        break;
      case 'key':
        // Only one key exists in the game
        break;
      case 'map':
        // Maps can be combined
        break;
      case 'potion':
        // No limit on potions
        break;
    }

    // Remove item from cell and add to player inventory
    cell.items = cell.items.filter(i => i.id !== item.id);
    player.inventory.push(item);

    return item;
  }

  dropItem(game: Game, playerId: string, itemId: string): Item | null {
    const player = game.players.find(p => p.id === playerId);
    if (!player) return null;

    const item = player.inventory.find(i => i.id === itemId);
    if (!item) return null;

    // Remove from inventory
    player.inventory = player.inventory.filter(i => i.id !== itemId);

    // Add to current cell
    const cell = game.maze.grid[player.position.level][player.position.y][player.position.x];
    item.position = { ...player.position };
    cell.items.push(item);

    return item;
  }

  useItem(game: Game, playerId: string, itemId: string): { success: boolean; effect?: string } {
    console.assert(game && game.difficultySettings, 'game must have difficulty settings');
    console.assert(playerId && itemId, 'playerId and itemId must be provided');
    console.assert(game.players.some(p => p.id === playerId), 'player must exist in game');

    const settings = game.difficultySettings;
    const player = game.players.find(p => p.id === playerId);
    if (!player) return { success: false };

    const item = player.inventory.find(i => i.id === itemId);
    if (!item) return { success: false };

    switch (item.type) {
      case 'potion':
        // Heal player
        const healAmount = Math.floor(Math.random() * settings.healingPotionStrength);
        player.health = Math.min(100, player.health + healAmount);
        // Remove potion after use
        player.inventory = player.inventory.filter(i => i.id !== itemId);
        return { success: true, effect: `Healed ${healAmount} health` };

      case 'flashlight':
        // Flashlight is passive, can't be "used"
        return { success: false, effect: 'Flashlight is always active' };

      case 'map':
        // Map is passive, can't be "used"
        return { success: false, effect: 'Map is always active' };

      case 'key':
        // Key is used automatically when reaching exit
        return { success: false, effect: 'Key is used automatically at exit' };

      default:
        return { success: false };
    }
  }

  generateInitialItems(game: Game): void {
    const settings = game.difficultySettings;
    const { width, height, levels } = game.maze;
    
    // Add the key (only one in the game)
    this.addItemToRandomCell(game, {
      id: uuidv4(),
      type: 'key',
      position: this.getRandomPosition(width, height, levels)
    });

    // Add flashlights (one per 4 players maximum)
    const maxFlashlights = Math.ceil(game.players.length / 4) + 1;
    for (let i = 0; i < maxFlashlights; i++) {
      this.addItemToRandomCell(game, {
        id: uuidv4(),
        type: 'flashlight',
        position: this.getRandomPosition(width, height, levels)
      });
    }

    // Add potions based on difficulty settings
    const potionCount = settings.healingPotionCount;
    for (let i = 0; i < potionCount; i++) {
      this.addItemToRandomCell(game, {
        id: uuidv4(),
        type: 'potion',
        position: this.getRandomPosition(width, height, levels)
      });
    }

    // Add some blank maps
    const mapCount = Math.floor(game.players.length / 2) + 1;
    for (let i = 0; i < mapCount; i++) {
      this.addItemToRandomCell(game, {
        id: uuidv4(),
        type: 'map',
        position: this.getRandomPosition(width, height, levels)
      });
    }
  }

  private getRandomPosition(width: number, height: number, levels: number): Position {
    return {
      x: Math.floor(Math.random() * width),
      y: Math.floor(Math.random() * height),
      level: Math.floor(Math.random() * levels)
    };
  }

  private addItemToRandomCell(game: Game, item: Item): void {
    const cell = game.maze.grid[item.position.level][item.position.y][item.position.x];
    cell.items.push(item);
  }
}
