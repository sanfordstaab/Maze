import React from 'react';
import { useGame } from '../context/GameContext';
import { socket } from '../services/socket';
import { CombatResult } from '../types';

interface CombatPanelProps {
  gameId: string;
  playerId: string;
}

export function CombatPanel({ gameId, playerId }: CombatPanelProps) {
  const { state } = useGame();
  const [combatLog, setCombatLog] = React.useState<CombatResult[]>([]);

  React.useEffect(() => {
    socket.on('combatResults', ({ results }) => {
      setCombatLog(prev => [...prev, ...results].slice(-5)); // Keep last 5 entries
    });

    return () => {
      socket.off('combatResults');
    };
  }, []);

  const renderCombatMessage = (result: CombatResult) => {
    const attackerName = result.isMonster ? 'Monster' : 
      state.game?.players.find(p => p.id === result.attacker)?.name || 'Unknown';
    const defenderName = result.isMonster ? 'Monster' : 
      state.game?.players.find(p => p.id === result.defender)?.name || 'Unknown';

    if (result.itemStolen) {
      return `${attackerName} stole ${result.itemStolen.type} from ${defenderName}!`;
    }

    if (result.mapStolen) {
      return `${attackerName} stole map knowledge from ${defenderName}!`;
    }

    return `${attackerName} dealt ${result.damage} damage to ${defenderName}!`;
  };

  return (
    <div className="combat-panel">
      <h3>Combat Log</h3>
      <div className="combat-log">
        {combatLog.map((result, index) => (
          <div key={index} className="combat-message">
            {renderCombatMessage(result)}
          </div>
        ))}
        {combatLog.length === 0 && (
          <div className="empty-combat-log">No recent combat</div>
        )}
      </div>
    </div>
  );
}
