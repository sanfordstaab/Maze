import { Game, Monster, Position, Player } from '../types';
import { GameEngine } from '../services/GameEngine';
import { MonsterAI } from '../services/MonsterAI';
import { VisibilitySystem } from '../services/VisibilitySystem';

// ... rest of imports

describe('Integration Tests', () => {
  let gameEngine: GameEngine;
  let monsterAI: MonsterAI;
  let visibilitySystem: VisibilitySystem;

  beforeEach(() => {
    gameEngine = new GameEngine();
    monsterAI = new MonsterAI();
    visibilitySystem = new VisibilitySystem();
  });

  // Replace calculateVisibility with getVisibleState
  const tests = [
    // ... other tests
    {
      name: 'monster movement test',
      test: () => {
        const game = createTestGame();
        const monster: Monster = {
          id: 'test-monster',
          type: 'goblin' as const,
          position: { x: 0, y: 0, level: 0 },
          health: 100,
          damage: 10,
          visibility: 5,
          moveInterval: 1000
        };

        // Use getVisibleState instead of calculateVisibility
        const state = visibilitySystem.getVisibleState(game, game.players[0]);
        expect(state).toBeDefined();

        // Use type assertion for private method access
        const result = (monsterAI as any).moveMonster(game, monster);
        expect(result.didPursue).toBeDefined();
      }
    }
  ];

  // Update other test cases similarly
  tests.forEach(({ name, test }) => {
    it(name, test);
  });
});

function createTestGame(): Game {
  // Test game creation helper
  return {
    id: 'test-game',
    players: [],
    monsters: [],
    status: 'waiting',
    maze: {
      width: 10,
      height: 10,
      levels: 1,
      grid: []
    },
    createdAt: new Date(),
    difficulty: 1,
    exitPosition: { x: 9, y: 9, level: 0 },
    difficultySettings: {
      monsterCount: 0,
      monsterMoveInterval: 1000,
      monsterVisibility: 5,
      monsterDamage: 10,
      monsterPursuitEnabled: false,
      playerVisibility: 5,
      healingPotionCount: 5,
      healingPotionStrength: 20,
      playerVsPlayerEnabled: false,
      secretDoorChance: 0.1,
      allowTrolls: false,
      allowDragons: false,
      mapDropChance: 0.1
    }
  };
}
