import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';

interface GameSetupProps {
  onGameStart: (gameId: string, playerId: string) => void;
}

interface GameListItem {
  id: string;
  playerCount: number;
  status: string;
}

export function GameSetup({ onGameStart }: GameSetupProps) {
  const [games, setGames] = useState<GameListItem[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [creating, setCreating] = useState(false);
  const [mazeOptions, setMazeOptions] = useState({
    width: 20,
    height: 20,
    levels: 3,
    difficulty: 1
  });

  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchGames = async () => {
    try {
      const response = await fetch('http://localhost:3001/games');
      const gameList = await response.json();
      setGames(gameList);
    } catch (error) {
      console.error('Failed to fetch games:', error);
    }
  };

  const createGame = async () => {
    try {
      const response = await fetch('http://localhost:3001/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mazeOptions),
      });
      const { gameId } = await response.json();
      joinGame(gameId);
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  };

  const joinGame = async (gameId: string) => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/games/${gameId}/players`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerName }),
      });
      const { playerId } = await response.json();
      onGameStart(gameId, playerId);
    } catch (error) {
      console.error('Failed to join game:', error);
    }
  };

  return (
    <div className="game-setup">
      <h1>Maze Game</h1>
      
      <div className="player-name-input">
        <input
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
        />
      </div>

      {creating ? (
        <div className="create-game-form">
          <h2>Create New Game</h2>
          <div>
            <label>Width: </label>
            <input
              type="number"
              value={mazeOptions.width}
              onChange={(e) => setMazeOptions(prev => ({
                ...prev,
                width: parseInt(e.target.value)
              }))}
              min="10"
              max="100"
            />
          </div>
          <div>
            <label>Height: </label>
            <input
              type="number"
              value={mazeOptions.height}
              onChange={(e) => setMazeOptions(prev => ({
                ...prev,
                height: parseInt(e.target.value)
              }))}
              min="10"
              max="100"
            />
          </div>
          <div>
            <label>Levels: </label>
            <input
              type="number"
              value={mazeOptions.levels}
              onChange={(e) => setMazeOptions(prev => ({
                ...prev,
                levels: parseInt(e.target.value)
              }))}
              min="1"
              max="10"
            />
          </div>
          <div>
            <label>Difficulty: </label>
            <input
              type="number"
              value={mazeOptions.difficulty}
              onChange={(e) => setMazeOptions(prev => ({
                ...prev,
                difficulty: parseInt(e.target.value)
              }))}
              min="1"
              max="10"
            />
          </div>
          <button onClick={createGame}>Create Game</button>
          <button onClick={() => setCreating(false)}>Cancel</button>
        </div>
      ) : (
        <>
          <select 
            className="game-select"
            onChange={(e) => {
              if (e.target.value === 'new') {
                setCreating(true);
              } else {
                joinGame(e.target.value);
              }
            }}
            value=""
          >
            <option value="">Select a game...</option>
            <option value="new">Create a New Game</option>
            {[...games]
          .sort((a, b) => a.id.localeCompare(b.id))
          .map(game => (
              <option key={game.id} value={game.id}>
                {game.id} ({game.playerCount} players)
              </option>
            ))}
          </select>
          <div className="game-list" style={{ display: creating ? 'none' : 'block' }}>
            <h2>Available Games</h2>
            {games.length === 0 ? (
              <p>No games available</p>
            ) : (
              <ul>
                {games.map(game => (
                  <li key={game.id}>
                    Game {game.id} ({game.playerCount} players)
                    <button onClick={() => joinGame(game.id)}>Join</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
