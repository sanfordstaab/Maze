import React from 'react';
import { useGame } from '../context/GameContext';
import { Player, Monster } from '../types';

interface HealthBarProps {
  current: number;
  max: number;
  entity: Player | Monster;
}

function HealthBar({ current, max, entity }: HealthBarProps) {
  const percentage = (current / max) * 100;
  const isPlayer = 'name' in entity;

  return (
    <div className="health-bar-container">
      {isPlayer && <span className="entity-name">{(entity as Player).name}</span>}
      <div className="health-bar">
        <div 
          className={`health-fill ${percentage < 25 ? 'critical' : ''}`}
          style={{ width: `${percentage}%` }}
        />
        <span className="health-text">{current}/{max}</span>
      </div>
    </div>
  );
}

interface CombatFeedbackProps {
  gameId: string;
  playerId: string;
}

export function CombatFeedback({ gameId, playerId }: CombatFeedbackProps) {
  const { state } = useGame();
  const [recentDamage, setRecentDamage] = React.useState<{
    amount: number;
    timestamp: number;
    x: number;
    y: number;
  }[]>([]);

  React.useEffect(() => {
    const handleCombatResults = ({ results }: { results: CombatResult[] }) => {
      results.forEach(result => {
        if (result.defender === playerId) {
          const player = state.currentPlayer;
          if (player) {
            setRecentDamage(prev => [...prev, {
              amount: result.damage,
              timestamp: Date.now(),
              x: player.position.x,
              y: player.position.y
            }]);
          }
        }
      });
    };

    socket.on('combatResults', handleCombatResults);
    return () => {
      socket.off('combatResults');
    };
  }, [playerId, state.currentPlayer]);

  // Clean up old damage numbers
  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setRecentDamage(prev => prev.filter(d => now - d.timestamp < 1000));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Health bars for nearby entities */}
      <div className="combat-feedback">
        {state.game?.players.map(player => (
          player.id !== playerId && isNearby(state.currentPlayer?.position, player.position) && (
            <HealthBar
              key={player.id}
              current={player.health}
              max={100}
              entity={player}
            />
          )
        ))}
        {state.game?.monsters.map(monster => (
          isNearby(state.currentPlayer?.position, monster.position) && (
            <HealthBar
              key={monster.id}
              current={monster.health}
              max={monster.type === 'dragon' ? 200 : monster.type === 'troll' ? 150 : 100}
              entity={monster}
            />
          )
        ))}
      </div>

      {/* Floating damage numbers */}
      {recentDamage.map((damage, index) => (
        <div
          key={damage.timestamp + index}
          className="damage-number"
          style={{
            left: `${damage.x * 30}px`,
            top: `${damage.y * 30}px`,
            animation: 'floatUp 1s ease-out forwards'
          }}
        >
          -{damage.amount}
        </div>
      ))}
    </>
  );
}

function isNearby(pos1?: Position, pos2?: Position): boolean {
  if (!pos1 || !pos2) return false;
  const dx = Math.abs(pos1.x - pos2.x);
  const dy = Math.abs(pos1.y - pos2.y);
  return pos1.level === pos2.level && dx <= 5 && dy <= 5;
}
