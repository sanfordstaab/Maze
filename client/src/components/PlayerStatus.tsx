import React from 'react';
import { useGame } from '../context/GameContext';
import { Item } from '../types';

interface PlayerStatusProps {
  playerId: string;
}

export function PlayerStatus({ playerId }: PlayerStatusProps) {
  const { state } = useGame();
  const player = state.currentPlayer;

  if (!player) return null;

  const renderInventoryItem = (item: Item) => {
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
    <div className="player-status">
      <h3>{player.name}</h3>
      <div className="status-row">
        <label>Health:</label>
        <div className="health-bar">
          <div 
            className="health-fill" 
            style={{ width: `${player.health}%` }}
          />
          <span className="health-text">{player.health}/100</span>
        </div>
      </div>
      <div className="status-row">
        <label>Level:</label>
        <span>{player.position.level + 1}</span>
      </div>
      <div className="status-row">
        <label>Position:</label>
        <span>({player.position.x}, {player.position.y})</span>
      </div>
      <div className="inventory">
        <label>Inventory:</label>
        <div className="inventory-items">
          {player.inventory.map((item, index) => (
            <div key={item.id} className="inventory-item" title={item.type}>
              {renderInventoryItem(item)}
            </div>
          ))}
          {player.inventory.length === 0 && (
            <span className="empty-inventory">Empty</span>
          )}
        </div>
      </div>
    </div>
  );
}
