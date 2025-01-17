import React, { useState } from 'react';
import { GameSetup } from './components/GameSetup';
import { MazeGame } from './components/MazeGame';
import { GameProvider } from './context/GameContext';
import './App.css';

function App() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  return (
    <div className="App">
      <GameProvider>
        {!gameId ? (
          <GameSetup onGameStart={(gId, pId) => {
            setGameId(gId);
            setPlayerId(pId);
          }} />
        ) : (
          <MazeGame gameId={gameId} playerId={playerId!} />
        )}
      </GameProvider>
    </div>
  );
}

export default App;
