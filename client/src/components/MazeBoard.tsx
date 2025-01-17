import React, { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { Position, MazeCell } from '../types';

interface MazeBoardProps {
  gameId: string;
  playerId: string;
}

export function MazeBoard({ gameId, playerId }: MazeBoardProps) {
  const { state } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoomLevel, setZoomLevel] = useState(2); // Default zoom level
  // Base size shows 10x10 squares at highest zoom
  const baseSize = Math.min(window.innerWidth, window.innerHeight) / 10;
  const cellSize = baseSize / Math.pow(2, zoomLevel - 1); // Each zoom level doubles visible area

  useEffect(() => {
    if (!state.game?.maze || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const maze = state.game.maze;
    canvas.width = maze.width * cellSize;
    canvas.height = maze.height * cellSize;

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw maze cells
    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        const cell = maze.grid[state.currentPlayer?.position.level || 0][y][x];
        const isVisible = state.visibleMaze[state.currentPlayer?.position.level || 0][y][x];
        const isExplored = state.currentPlayer?.map.cells[state.currentPlayer?.position.level || 0][y][x];
        
        if (isVisible || isExplored) {
          drawCell(ctx, x, y, cell, isVisible, isExplored);
        }
      }
    }

    // Draw monsters
    state.game.monsters?.forEach(monster => {
      if (monster.position.level === state.currentPlayer?.position.level &&
          state.visibleMaze[monster.position.level][monster.position.y][monster.position.x]) {
        drawMonster(ctx, monster);
      }
    });

    // Draw players
    state.game.players.forEach(player => {
      if (player.position.level === state.currentPlayer?.position.level &&
          state.visibleMaze[player.position.level][player.position.y][player.position.x]) {
        drawPlayer(ctx, player.position, player.id === playerId);
      }
    });
  }, [state.game, state.currentPlayer, state.visibleMaze, playerId]);

  const drawCell = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    cell: MazeCell,
    isVisible: boolean,
    isExplored: boolean
  ) => {
    const startX = x * cellSize;
    const startY = y * cellSize;

    // Draw floor with different colors based on visibility and exit status
    if (state.game?.exitPosition && 
        x === state.game.exitPosition.x && 
        y === state.game.exitPosition.y && 
        state.currentPlayer?.position.level === state.game.exitPosition.level) {
      // Draw exit with special color/pattern
      ctx.fillStyle = isVisible ? '#4a148c' : '#1a0733';
      ctx.fillRect(startX, startY, cellSize, cellSize);
      
      if (isVisible) {
        // Draw exit symbol
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🚪', startX + cellSize/2, startY + cellSize/2);
      }
    } else {
    const startX = x * cellSize;
    const startY = y * cellSize;

    // Draw floor with different colors based on visibility
    if (isVisible) {
      ctx.fillStyle = '#222';
    } else if (isExplored) {
      ctx.fillStyle = '#111';
    } else {
      ctx.fillStyle = '#000';
    }
    ctx.fillRect(startX, startY, cellSize, cellSize);

    // Draw walls and secret doors
    ctx.lineWidth = 2;
    
    const directions = ['north', 'south', 'east', 'west'] as const;
    directions.forEach(dir => {
      if (cell.walls[dir]) {
        ctx.strokeStyle = isVisible ? '#666' : '#333';
        ctx.beginPath();
        
        switch (dir) {
          case 'north':
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX + cellSize, startY);
            break;
          case 'south':
            ctx.moveTo(startX, startY + cellSize);
            ctx.lineTo(startX + cellSize, startY + cellSize);
            break;
          case 'east':
            ctx.moveTo(startX + cellSize, startY);
            ctx.lineTo(startX + cellSize, startY + cellSize);
            break;
          case 'west':
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX, startY + cellSize);
            break;
        }
        ctx.stroke();

        // Draw secret door indicator if visible
        if (isVisible && cell.secretDoors?.[dir]) {
          ctx.fillStyle = '#f44';
          const midX = startX + cellSize/2;
          const midY = startY + cellSize/2;
          
          switch (dir) {
            case 'north':
              ctx.fillRect(midX - 5, startY - 2, 10, 4);
              break;
            case 'south':
              ctx.fillRect(midX - 5, startY + cellSize - 2, 10, 4);
              break;
            case 'east':
              ctx.fillRect(startX + cellSize - 2, midY - 5, 4, 10);
              break;
            case 'west':
              ctx.fillRect(startX - 2, midY - 5, 4, 10);
              break;
          }
        }
      }
    });

    // Only draw special features and items if cell is visible
    if (isVisible) {
      // Draw special features
      if (cell.hasStairs?.up) {
        ctx.fillStyle = '#44f';
        ctx.fillText('↑', startX + cellSize/2, startY + cellSize/2);
      }
      if (cell.hasStairs?.down) {
        ctx.fillStyle = '#44f';
        ctx.fillText('↓', startX + cellSize/2, startY + cellSize/2);
      }
      if (cell.hasSecretDoor) {
        ctx.fillStyle = '#f44';
        ctx.fillRect(startX + cellSize/4, startY + cellSize/4, cellSize/2, cellSize/2);
      }

      // Draw items
      cell.items.forEach(item => {
        switch (item.type) {
          case 'key':
            ctx.fillStyle = '#ff0';
            ctx.fillText('🔑', startX + cellSize/2, startY + cellSize/2);
            break;
          case 'flashlight':
            ctx.fillStyle = '#fff';
            ctx.fillText('🔦', startX + cellSize/2, startY + cellSize/2);
            break;
          case 'potion':
            ctx.fillStyle = '#f0f';
            ctx.fillText('🧪', startX + cellSize/2, startY + cellSize/2);
            break;
          case 'map':
            ctx.fillStyle = '#840';
            ctx.fillText('📜', startX + cellSize/2, startY + cellSize/2);
            break;
        }
      });
    }
  };

  const drawMonster = (ctx: CanvasRenderingContext2D, monster: Monster) => {
    const x = monster.position.x * cellSize + cellSize/2;
    const y = monster.position.y * cellSize + cellSize/2;
    
    ctx.fillStyle = '#f00';
    ctx.beginPath();
    
    switch (monster.type) {
      case 'goblin':
        // Small red triangle
        ctx.moveTo(x, y - cellSize/3);
        ctx.lineTo(x - cellSize/3, y + cellSize/3);
        ctx.lineTo(x + cellSize/3, y + cellSize/3);
        break;
      case 'troll':
        // Larger red square
        ctx.rect(x - cellSize/3, y - cellSize/3, cellSize*2/3, cellSize*2/3);
        break;
      case 'dragon':
        // Large red diamond
        ctx.moveTo(x, y - cellSize/2);
        ctx.lineTo(x + cellSize/2, y);
        ctx.lineTo(x, y + cellSize/2);
        ctx.lineTo(x - cellSize/2, y);
        break;
    }
    
    ctx.fill();
  };

  const [animations, setAnimations] = React.useState<AnimationEffect[]>([]);

  useEffect(() => {
    // Animation frame loop
    let animationFrameId: number;
    
    const animate = () => {
      setAnimations(getActiveAnimations());
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const drawAnimations = (ctx: CanvasRenderingContext2D) => {
    animations.forEach(animation => {
      const x = animation.x * cellSize;
      const y = animation.y * cellSize;

      switch (animation.type) {
        case 'damage':
          // Red number floating up
          ctx.fillStyle = '#ff4444';
          ctx.font = 'bold 16px Arial';
          ctx.fillText(
            `-${animation.value}`,
            x + cellSize/2,
            y - 10 * (1 - animation.duration!/1000)
          );
          break;

        case 'heal':
          // Green number floating up
          ctx.fillStyle = '#44ff44';
          ctx.font = 'bold 16px Arial';
          ctx.fillText(
            `+${animation.value}`,
            x + cellSize/2,
            y - 10 * (1 - animation.duration!/1000)
          );
          break;

        case 'pickup':
          // Sparkle effect
          ctx.strokeStyle = '#ffff00';
          ctx.lineWidth = 2;
          const progress = 1 - animation.duration!/500;
          const size = cellSize/4 * (1 - progress);
          
          ctx.beginPath();
          ctx.moveTo(x + cellSize/2 - size, y + cellSize/2);
          ctx.lineTo(x + cellSize/2 + size, y + cellSize/2);
          ctx.moveTo(x + cellSize/2, y + cellSize/2 - size);
          ctx.lineTo(x + cellSize/2, y + cellSize/2 + size);
          ctx.stroke();
          break;

        case 'drop':
          // Ripple effect
          ctx.strokeStyle = '#4444ff';
          ctx.lineWidth = 2;
          const rippleProgress = 1 - animation.duration!/500;
          const rippleSize = cellSize/2 * rippleProgress;
          
          ctx.beginPath();
          ctx.arc(
            x + cellSize/2,
            y + cellSize/2,
            rippleSize,
            0,
            Math.PI * 2
          );
          ctx.stroke();
          break;

        case 'map':
          // Map update effect
          ctx.fillStyle = `rgba(255, 255, 255, ${animation.duration!/1000})`;
          ctx.fillRect(x, y, cellSize, cellSize);
          break;
      case 'wrap':
        // Portal-like effect for wrapping
        const { toX, toY } = animation.value as { toX: number; toY: number };
        const progress = 1 - animation.duration!/300;
        
        ctx.strokeStyle = '#4a90e2';
        ctx.lineWidth = 3;
        
        // Draw portal at start position
        ctx.beginPath();
        ctx.arc(
          x + cellSize/2,
          y + cellSize/2,
          cellSize/2 * (1 - progress),
          0,
          Math.PI * 2
        );
        ctx.stroke();
        
        // Draw portal at end position
        ctx.beginPath();
        ctx.arc(
          toX * cellSize + cellSize/2,
          toY * cellSize + cellSize/2,
          cellSize/2 * progress,
          0,
          Math.PI * 2
        );
        ctx.stroke();
        break;

      case 'secretDoor':
        // Glowing effect for secret door discovery
        const direction = animation.value as string;
        ctx.strokeStyle = `rgba(255, 68, 68, ${1 - animation.duration!/500})`;
        ctx.lineWidth = 4;
        
        switch (direction) {
          case 'north':
            ctx.moveTo(x, y);
            ctx.lineTo(x + cellSize, y);
            break;
          case 'south':
            ctx.moveTo(x, y + cellSize);
            ctx.lineTo(x + cellSize, y + cellSize);
            break;
          case 'east':
            ctx.moveTo(x + cellSize, y);
            ctx.lineTo(x + cellSize, y + cellSize);
            break;
          case 'west':
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + cellSize);
            break;
        }
        ctx.stroke();
        break;
      }
    });
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, position: Position, isCurrentPlayer: boolean) => {
    ctx.fillStyle = isCurrentPlayer ? '#0f0' : '#f00';
    ctx.beginPath();
    ctx.arc(
      position.x * cellSize + cellSize/2,
      position.y * cellSize + cellSize/2,
      cellSize/3,
      0,
      Math.PI * 2
    );
    ctx.fill();
  };    // Draw animations after everything else
    drawAnimations(ctx);

    const handleZoom = (level: number) => {
      if (level >= 1 && level <= 4) { // 4 zoom levels
        setZoomLevel(level);
      }
    };

    // Calculate visible area
    const visibleSquares = 10 * Math.pow(2, zoomLevel - 1);
    const containerStyle = {
      width: `${visibleSquares * cellSize}px`,
      height: `${visibleSquares * cellSize}px`,
      overflow: 'auto'
    };

    return (
      <div className="maze-container" style={containerStyle}>
        <div className="zoom-controls">
          <button onClick={() => handleZoom(zoomLevel - 1)} disabled={zoomLevel <= 1}>-</button>
          <span>Zoom: {zoomLevel}x</span>
          <button onClick={() => handleZoom(zoomLevel + 1)} disabled={zoomLevel >= 4}>+</button>
        </div>
        <canvas
          ref={canvasRef}
          style={{
            border: '1px solid #666',
            backgroundColor: '#000'
          }}
        />
      </div>
    );
}
