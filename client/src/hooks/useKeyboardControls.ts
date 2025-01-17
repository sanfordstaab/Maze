import { useEffect, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { socket } from '../services/socket';

export function useKeyboardControls(gameId: string, playerId: string) {
  console.assert(gameId && typeof gameId === 'string', 'gameId must be a non-empty string');
  console.assert(playerId && typeof playerId === 'string', 'playerId must be a non-empty string');

  const { state } = useGame();

  const handleMovement = useCallback((direction: 'north' | 'south' | 'east' | 'west' | 'up' | 'down') => {
    console.assert(direction, 'direction must be specified');
    if (!state.currentPlayer) return;
    
    socket.emit('playerMove', {
      gameId,
      playerId,
      direction
    });
  }, [gameId, playerId, state.currentPlayer]);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        event.preventDefault();
        handleMovement('north');
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        event.preventDefault();
        handleMovement('south');
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        event.preventDefault();
        handleMovement('west');
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        event.preventDefault();
        handleMovement('east');
        break;
      case 'PageUp':
        // Only if current cell has stairs up
        if (state.game?.maze.grid[state.currentPlayer?.position.level || 0]
                                [state.currentPlayer?.position.y || 0]
                                [state.currentPlayer?.position.x || 0]?.hasStairs?.up) {
          handleMovement('up');
        }
        break;
      case 'PageDown':
        // Only if current cell has stairs down
        if (state.game?.maze.grid[state.currentPlayer?.position.level || 0]
                                [state.currentPlayer?.position.y || 0]
                                [state.currentPlayer?.position.x || 0]?.hasStairs?.down) {
          handleMovement('down');
        }
        break;
    }
  }, [handleMovement, state.game, state.currentPlayer]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);
}
