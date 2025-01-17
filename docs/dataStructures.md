# Data Structures Documentation

## Core Types

### Position
```typescript
interface Position {
  x: number;      // X coordinate in maze
  y: number;      // Y coordinate in maze
  level: number;  // Maze level (0 to levels-1)
}
```

### Player
```typescript
interface Player {
  id: string;
  name: string;
  position: Position;
  health: number;      // 0-100
  inventory: Item[];
  socketId: string;
  map: MapData;        // Player's discovered maze areas
}
```

### Item
```typescript
interface Item {
  id: string;
  type: 'key' | 'flashlight' | 'potion' | 'map';
  position: Position;
}
```

### Maze Structure
```typescript
interface MazeCell {
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

interface Maze {
  width: number;
  height: number;
  levels: number;
  grid: MazeCell[][][];  // [level][y][x]
}
```

### Monster
```typescript
interface Monster {
  id: string;
  type: 'goblin' | 'troll' | 'dragon';
  position: Position;
  health: number;
  damage: number;
  visibility: number;
  moveInterval: number;
}
```

### Game State
```typescript
interface Game {
  id: string;
  players: Player[];
  monsters: Monster[];
  status: 'waiting' | 'ongoing' | 'finished';
  maze: Maze;
  createdAt: Date;
  difficulty: number;
  winner?: {
    playerId: string;
    playerName: string;
  };
  exitPosition: Position;
  difficultySettings: DifficultySettings;
}
```

## Key Concepts

### Map Data
- Players build their map as they explore
- Map data tracks visited cells and visible items/monsters
- Maps can be stolen or dropped during combat

### Difficulty Settings
Controls various game parameters:
- Monster count and behavior
- Player visibility range
- Healing potion availability
- PvP enablement
- Secret door frequency
- Map drop chance

### Combat System
- Automatic when entities occupy same cell
- Damage calculation based on difficulty
- Item theft chance during combat
- Fleeing mechanics
