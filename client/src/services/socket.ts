import { io } from 'socket.io-client';
import { Game, CombatResult, Item, Position } from '../types';

export const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('error', (error: string) => {
  console.error('Socket error:', error);
});

// Define event types for type safety
export interface GameEvents {
  gameJoined: { playerId: string; gameState: Game };
  playerJoined: { player: Player };
  playerLeft: { playerId: string };
  gameStateUpdate: Partial<Game>;
  playerMoved: { playerId: string; position: Position };
  itemPickedUp: { playerId: string; item: Item };
  itemDropped: { playerId: string; item: Item };
  itemUsed: { playerId: string; itemId: string; effect: string };
  combatResults: { results: CombatResult[] };
  playerDied: { playerId: string; playerName: string };
  chatMessage: { playerId: string; playerName: string; message: string; timestamp: Date };
  gameWon: { playerId: string; playerName: string };
  stairsAvailable: { up?: boolean; down?: boolean };
  itemsAvailable: { items: Item[] };
}

// Type-safe event emitter
export const gameSocket = {
  ...socket,
  emit: <K extends keyof GameEvents>(event: K, data: any) => {
    socket.emit(event, data);
  },
  on: <K extends keyof GameEvents>(event: K, callback: (data: GameEvents[K]) => void) => {
    socket.on(event, callback as (...args: any[]) => void);
  },
  off: <K extends keyof GameEvents>(event: K) => {
    socket.off(event);
  }
};
