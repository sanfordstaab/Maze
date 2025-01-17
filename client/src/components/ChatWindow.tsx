import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { socket } from '../services/socket';

interface ChatMessage {
  playerId: string;
  playerName: string;
  message: string;
  timestamp: Date;
  isPrivate?: boolean;
  targetName?: string;
}

interface ChatWindowProps {
  gameId: string;
  playerId: string;
}

export function ChatWindow({ gameId, playerId }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { state } = useGame();

  useEffect(() => {
    socket.on('chatMessage', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socket.off('chatMessage');
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [targetPlayerId, setTargetPlayerId] = useState<string | null>(null);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      gameId,
      playerId,
      playerName: state.currentPlayer?.name || 'Unknown',
      message: newMessage,
      targetPlayerId: targetPlayerId
    };

    socket.emit('chatMessage', message);
    setNewMessage('');
  };

  const handlePlayerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTargetPlayerId(e.target.value || null);
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <select onChange={handlePlayerSelect} value={targetPlayerId || ''}>
          <option value="">Everyone</option>
          {state.game?.players
            .filter(p => p.id !== playerId)
            .map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))
          }
        </select>
      </div>
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`chat-message ${msg.playerId === playerId ? 'own-message' : ''} ${msg.isPrivate ? 'private-message' : ''}`}
          >
            <span className="player-name">{msg.playerName}: </span>
            <span className="message-text">
              {msg.isPrivate && <span className="private-indicator">[Private] </span>}
              {msg.message}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="chat-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
