import React, { useState, useCallback } from 'react';
import Menu from './components/Menu.jsx';
import Game from './components/Game.jsx';

export default function App() {
  const [session, setSession] = useState(null);

  const handleJoin = useCallback((name, roomId, isHost, mode) => {
    setSession({ name, roomId, isHost, mode });
  }, []);

  const handleLeave = useCallback(() => {
    setSession(null);
  }, []);

  if (!session) {
    return <Menu onJoin={handleJoin} />;
  }

  return (
    <Game
      playerName={session.name}
      roomId={session.roomId}
      isHost={session.isHost}
      mode={session.mode}
      onLeave={handleLeave}
    />
  );
}