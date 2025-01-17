import React from 'react';
import { useGame } from '../context/GameContext';
import { socket } from '../services/socket';
import { Item } from '../types';

interface InventoryPanelProps {
  gameId: string;
  playerId: string;
}

export function InventoryPanel({ gameId, playerId }: InventoryPanelProps) {
  const { state } = useGame();

  const handleUseItem = (itemId: string) => {
    socket.emit('useItem', { gameId, playerId, itemId });
  };

  const handleDropItem = (itemId: string) => {
    socket.emit('dropItem', { gameId, playerId, itemId });
  };

  const renderItemIcon = (item: Item) => {
    switch (item.type) {
      case 'key':
        return '🔑';
      case 'flashlight':
        return '🔦';
      case 'potion':
        return '🧪';
      case 'map':
        return '📜';
      default:
        return '❓';
    }
  };

  return (
    <div className="inventory-panel">
      <h3>Inventory</h3>
      <div className="inventory-grid">
        {state.currentPlayer?.inventory.map(item => (
          <div key={item.id} className="inventory-item">
            <div className="item-icon">{renderItemIcon(item)}</div>
            <div className="item-actions">
              {item.type === 'potion' && (
                <button onClick={() => handleUseItem(item.id)}>Use</button>
              )}
              <button onClick={() => handleDropItem(item.id)}>Drop</button>
            </div>
          </div>
        ))}
        {state.currentPlayer?.inventory.length === 0 && (
          <div className="empty-inventory">No items</div>
        )}
      </div>
    </div>
  );
}
