# Maze Game Architecture

## Overview
The Maze Game is a multiplayer browser-based game built with:
- React + TypeScript (Frontend)
- Node.js + Express + Socket.IO (Backend)
- Canvas-based rendering
- Real-time multiplayer support

## Core Components

### Server
- `GameEngine`: Main game logic controller
- `MazeGenerator`: Procedural maze generation
- `MonsterAI`: Monster behavior and pathfinding
- `CombatSystem`: Combat resolution and item stealing
- `ItemSystem`: Item management and effects
- `VisibilitySystem`: Line of sight and fog of war
- `MapSystem`: Player map management

### Client
- `MazeBoard`: Canvas-based maze rendering
- `PlayerStatus`: Player stats and inventory
- `ChatWindow`: Real-time player communication
- `GameSetup`: Game creation and joining
- `CombatFeedback`: Combat visualization

## Communication
- REST API for game setup and player management
- Socket.IO for real-time updates:
  - Player movements
  - Combat events
  - Item interactions
  - Chat messages

## State Management
- Server maintains authoritative game state
- Client receives partial visibility updates
- React Context for client-side state management
