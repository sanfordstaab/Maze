import { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { gameSocket } from '../services/socket';
import { showNotification } from '../services/notifications';

export function useGameSocket(gameId: string, playerId: string) {
  const { dispatch } = useGame();

  useEffect(() => {
    // Game state updates
    gameSocket.on('gameJoined', ({ gameState }) => {
      dispatch({ type: 'SET_GAME', payload: gameState });
    });

    gameSocket.on('secretDoorFound', ({ position, direction }) => {
      createSecretDoorAnimation(position.x, position.y, direction);
      showNotification('You found a secret door!', 'success');
    });

    // Handle wrapping movement
    gameSocket.on('playerMoved', ({ playerId, position, wrapped }) => {
      if (wrapped && playerId === playerId) {
        const { from, to } = wrapped;
        createWrapAnimation(from.x, from.y, to.x, to.y);
      }
    });

    gameSocket.on('gameWon', ({ playerId, playerName }) => {
      const isCurrentPlayer = playerId === playerId;
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

    gameSocket.on('playerLeft', ({ playerId }) => {
      dispatch({ type: 'REMOVE_PLAYER', payload: playerId });
    });

    gameSocket.on('playerMoved', ({ playerId, position }) => {
      dispatch({ type: 'UPDATE_PLAYER_POSITION', payload: { playerId, position } });
    });

    gameSocket.on('playerDied', ({ playerId, playerName }) => {
      dispatch({ type: 'REMOVE_PLAYER', payload: playerId });
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
    gameSocket.on('itemPickedUp', ({ playerId, item }) => {
      dispatch({ type: 'ADD_ITEM_TO_PLAYER', payload: { playerId, item } });
      if (playerId === playerId) {
        showNotification(`Picked up ${item.type}`);
      }
    });

    gameSocket.on('itemDropped', ({ playerId, item }) => {
      dispatch({ type: 'REMOVE_ITEM_FROM_PLAYER', payload: { playerId, itemId: item.id } });
      if (playerId === playerId) {
        showNotification(`Dropped ${item.type}`);
      }
    });

    gameSocket.on('itemUsed', ({ playerId, itemId, effect }) => {
      dispatch({ type: 'REMOVE_ITEM_FROM_PLAYER', payload: { playerId, itemId } });
      if (playerId === playerId) {
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
    };
  }, [dispatch, playerId]);
}
