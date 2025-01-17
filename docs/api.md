# API Documentation

## REST Endpoints

### POST /games
Creates a new game.
```typescript
Request:
{
  width: number;    // Maze width (10-1000)
  height: number;   // Maze height (10-1000)
  levels: number;   // Maze levels (1-10)
  difficulty: number; // Game difficulty (1-10)
}

Response:
{
  gameId: string;
}
```

### GET /games
Lists available games.
```typescript
Response:
{
  games: Array<{
    id: string;
    playerCount: number;
    status: 'waiting' | 'ongoing' | 'finished';
  }>;
}
```

## Socket.IO Events

### Emitted Events
- `joinGame`: Join existing game
- `playerMove`: Move player
- `pickupItem`: Attempt item pickup
- `dropItem`: Drop inventory item
- `useItem`: Use inventory item
- `chatMessage`: Send chat message

### Received Events
- `gameJoined`: Successfully joined game
- `gameStateUpdate`: Updated game state
- `playerMoved`: Player position update
- `combatResults`: Combat outcome
- `itemPickedUp`: Item pickup success
- `itemDropped`: Item drop success
- `itemUsed`: Item use result
- `playerDied`: Player death notification
- `gameWon`: Game win notification
