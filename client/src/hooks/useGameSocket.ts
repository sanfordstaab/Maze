import { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { gameSocket } from '../services/socket';
import { showNotification } from '../services/notifications';

export function useGameSocket(gameId: string, playerId: string) {
  console.assert(gameId && typeof gameId === 'string', 'gameId must be a non-empty string');
  console.assert(playerId && typeof playerId === 'string', 'playerId must be a non-empty string');

  const { dispatch } = useGame();

  useEffect(() => {
    // Game state updates
    gameSocket.on('gameJoined', ({ gameState }) => {
      dispatch({ type: 'SET_GAME', payload: gameState });
    });

    gameSocket.on('secretDoorFound', ({ position, direction }) => {
      if (typeof createSecretDoorAnimation === 'function') {
        createSecretDoorAnimation(position.x, position.y, direction);
      }
      showNotification('You found a secret door!', 'success');
    });

    // Handle wrapping movement
    gameSocket.on('playerMoved', ({ playerId: movedPlayerId, position, wrapped }) => {
      if (wrapped && movedPlayerId === playerId) {
        const { from, to } = wrapped;
        if (typeof createWrapAnimation === 'function') {
          createWrapAnimation(from.x, from.y, to.x, to.y);
        }
      }
    });

    gameSocket.on('gameWon', ({ playerId: winnerId, playerName }) => {
      const isCurrentPlayer = winnerId === playerId;
      const message = isCurrentPlayer ? 
        'Congratulations! You won the game!' : 
        `${playerName} has won the game!`;
      
      showNotification(message, isCurrentPlayer ? 'success' : 'info');
      
      // Update game state
      dispatch({ type: 'SET_GAME_STATUS', payload: 'finished' });
    });

    gameSocket.on('gameStateUpdate', (gameState) => {
      dispatch({ type: 'SET_GAME', payload: gameState });
    });

    // Player events
    gameSocket.on('playerJoined', ({ player }) => {
      dispatch({ type: 'ADD_PLAYER', payload: player });
      showNotification(`${player.name} joined the game`);
    });

    gameSocket.on('playerLeft', ({ playerId: leftPlayerId }) => {
      dispatch({ type: 'REMOVE_PLAYER', payload: leftPlayerId });
    });

    gameSocket.on('playerMoved', ({ playerId: movedPlayerId, position }) => {
      dispatch({ type: 'UPDATE_PLAYER_POSITION', payload: { playerId: movedPlayerId, position } });
    });

    gameSocket.on('playerDied', ({ playerId: deadPlayerId, playerName }) => {
      dispatch({ type: 'REMOVE_PLAYER', payload: deadPlayerId });
      showNotification(`${playerName} has died!`, 'error');
    });

    // Combat events
    gameSocket.on('combatResults', ({ results }) => {
      results.forEach(result => {
        if (result.itemStolen) {
          showNotification(`Item stolen: ${result.itemStolen.type}!`, 'warning');
        } else if (result.mapStolen) {
          showNotification('Map knowledge stolen!', 'warning');
        } else {
          showNotification(`Damage dealt: ${result.damage}`, 'info');
        }
      });
      dispatch({ type: 'ADD_COMBAT_RESULTS', payload: results });
    });

    // Item events
    gameSocket.on('itemPickedUp', ({ playerId: itemPlayerId, item }) => {
      dispatch({ type: 'ADD_ITEM_TO_PLAYER', payload: { playerId: itemPlayerId, item } });
      if (itemPlayerId === playerId) {
        showNotification(`Picked up ${item.type}`);
      }
    });

    gameSocket.on('itemDropped', ({ playerId: droppedPlayerId, item }) => {
      dispatch({ type: 'REMOVE_ITEM_FROM_PLAYER', payload: { playerId: droppedPlayerId, itemId: item.id } });
      if (droppedPlayerId === playerId) {
        showNotification(`Dropped ${item.type}`);
      }
    });

    gameSocket.on('itemUsed', ({ playerId: itemUsedPlayerId, itemId, effect }) => {
      dispatch({ type: 'REMOVE_ITEM_FROM_PLAYER', payload: { playerId: itemUsedPlayerId, itemId } });
      if (itemUsedPlayerId === playerId) {
        showNotification(effect);
      }
    });

    gameSocket.on('itemsAvailable', ({ items }) => {
      if (items.length > 0) {
        showNotification('Items available to pick up!', 'info');
      }
    });

    // Cleanup
    return () => {
      gameSocket.off('gameJoined');
      gameSocket.off('gameStateUpdate');
      gameSocket.off('playerJoined');
      gameSocket.off('playerLeft');
      gameSocket.off('playerMoved');
      gameSocket.off('playerDied');
      gameSocket.off('combatResults');
      gameSocket.off('itemPickedUp');
      gameSocket.off('itemDropped');
      gameSocket.off('itemUsed');
      gameSocket.off('itemsAvailable');
      gameSocket.off('secretDoorFound');
      gameSocket.off('gameWon');
    };
  }, [dispatch, playerId]);
}
