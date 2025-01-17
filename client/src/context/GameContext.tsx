import React, { createContext, useContext, useReducer } from 'react';
import { Game, Player, Position } from '../types';

interface GameState {
  game: Game | null;
  currentPlayer: Player | null;
  visibleMaze: boolean[][][];
}

type GameAction = 
  | { type: 'SET_GAME'; payload: Game }
  | { type: 'SET_PLAYER'; payload: Player }
  | { type: 'UPDATE_POSITION'; payload: Position }
  | { type: 'UPDATE_VISIBILITY'; payload: boolean[][][] };

const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
} | undefined>(undefined);

const initialState: GameState = {
  game: null,
  currentPlayer: null,
  visibleMaze: []
};

function gameReducer(state: GameState, action: GameAction): GameState {
  console.assert(state !== undefined, 'state must be defined');
  console.assert(action && action.type, 'action must have a type');

  switch (action.type) {
    case 'SET_GAME':
      return {
        ...state,
        game: action.payload
      };
    case 'SET_PLAYER':
      return {
        ...state,
        currentPlayer: action.payload
      };
    case 'UPDATE_POSITION':
      if (!state.currentPlayer) return state;
      return {
        ...state,
        currentPlayer: {
          ...state.currentPlayer,
          position: action.payload
        }
      };
    case 'UPDATE_VISIBILITY':
      return {
        ...state,
        visibleMaze: action.payload
      };
    default:
      return state;
  }
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  console.assert(context !== undefined, 'useGame must be used within a GameProvider');
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
