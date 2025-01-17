import React from 'react';
import { MazeBoard } from './MazeBoard';
import { ChatWindow } from './ChatWindow';
import { PlayerStatus } from './PlayerStatus';
import { InventoryPanel } from './InventoryPanel';
import { CombatPanel } from './CombatPanel';
import { ItemPickupPrompt } from './ItemPickupPrompt';
import { CombatFeedback } from './CombatFeedback';

interface MazeGameProps {
  gameId: string;
  playerId: string;
}

export function MazeGame({ gameId, playerId }: MazeGameProps) {
  return (
    <div className="game-container">
      <PlayerStatus playerId={playerId} />
      <InventoryPanel gameId={gameId} playerId={playerId} />
      <MazeBoard gameId={gameId} playerId={playerId} />
      <ChatWindow gameId={gameId} playerId={playerId} />
      <CombatPanel gameId={gameId} playerId={playerId} />
      <ItemPickupPrompt gameId={gameId} playerId={playerId} />
      <CombatFeedback gameId={gameId} playerId={playerId} />
    </div>
  );
}
