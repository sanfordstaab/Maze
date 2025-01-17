import React from 'react';
import { useGame } from '../context/GameContext';
import { socket } from '../services/socket';
import { Item } from '../types';

interface ItemPickupPromptProps {
  gameId: string;
  playerId: string;
}

export function ItemPickupPrompt({ gameId, playerId }: ItemPickupPromptProps) {
  const { state } = useGame();
  const [availableItems, setAvailableItems] = React.useState<Item[]>([]);

  React.useEffect(() => {
    socket.on('itemsAvailable', ({ items }) => {
      setAvailableItems(items);
    });

    return () => {
      socket.off('itemsAvailable');
    };
  }, []);

  const handlePickup = (item: Item) => {
    socket.emit('pickupItem', { gameId, playerId });
    setAvailableItems(items => items.filter(i => i.id !== item.id));
  };

  if (availableItems.length === 0) return null;

  return (
    <div className="item-pickup-prompt">
      <h4>Items Available</h4>
      <div className="available-items">
        {availableItems.map(item => (
          <div key={item.id} className="available-item">
            <span className="item-icon">
              {item.type === 'key' && '🔑'}
              {item.type === 'flashlight' && '🔦'}
              {item.type === 'potion' && '🧪'}
              {item.type === 'map' && '📜'}
            </span>
            <span className="item-name">{item.type}</span>
            <button onClick={() => handlePickup(item)}>Pick Up</button>
          </div>
        ))}
      </div>
    </div>
  );
}
