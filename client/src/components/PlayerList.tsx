import React from 'react';
import { useGame } from '../context/GameContext';

export function PlayerList() {
  const { state } = useGame();

  return (
    <div className="player-list-sidebar">
      <h3>Players</h3>
      <ul>
        {state.game?.players.map(player => (
          <li key={player.id} className="player-entry">
            <span className="player-name">{player.name}</span>
            <span className="player-health">HP: {player.health}</span>
            {player.inventory.some(item => item.type === 'key') && (
              <span className="player-has-key">🔑</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
