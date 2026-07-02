import { useState } from 'react';
import './Menu.css';

export default function Menu({ onJoin }) {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [tab, setTab] = useState('peerjs'); // 'peerjs' | 'manual'
  const [manualOfferInput, setManualOfferInput] = useState('');

  const canJoin = name.trim().length > 0 && roomId.trim().length > 0;

  const handleCreate = () => {
    if (!name.trim()) return;
    const id = 'town-' + Math.random().toString(36).substring(2, 8);
    onJoin(name.trim(), id, true, 'peerjs');
  };

  const handleJoin = () => {
    if (!canJoin) return;
    onJoin(name.trim(), roomId.trim(), false, 'peerjs');
  };

  const handleManualHost = () => {
    if (!name.trim()) return;
    onJoin(name.trim(), 'manual', true, 'manual');
  };

  const handleManualGuest = () => {
    if (!name.trim() || !manualOfferInput.trim()) return;
    onJoin(name.trim(), manualOfferInput.trim(), false, 'manual');
  };

  return (
    <div className="menu">
      <div className="menu-card">
        <h1 className="menu-title">🏘️ P2P Town</h1>
        <p className="menu-subtitle">Gather in a tiny virtual town — no server needed</p>

        <div className="menu-tabs">
          <button
            className={`menu-tab ${tab === 'peerjs' ? 'active' : ''}`}
            onClick={() => setTab('peerjs')}
          >
            🌐 Easy Connect
          </button>
          <button
            className={`menu-tab ${tab === 'manual' ? 'active' : ''}`}
            onClick={() => setTab('manual')}
          >
            🔌 Offline Mode
          </button>
        </div>

        {tab === 'peerjs' && (
          <div className="menu-body">
            <div className="field">
              <label>Your Name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your name..."
                maxLength={16}
                autoFocus
              />
            </div>

            <div className="menu-actions">
              <button className="btn btn-primary" onClick={handleCreate}>
                ✨ Create Room
              </button>
              <div className="or-divider"><span>or</span></div>
              <div className="field">
                <label>Room ID</label>
                <input
                  value={roomId}
                  onChange={e => setRoomId(e.target.value)}
                  placeholder="town-abc123"
                  maxLength={32}
                />
              </div>
              <button className="btn btn-secondary" onClick={handleJoin} disabled={!canJoin}>
                🚪 Join Room
              </button>
            </div>

            <p className="menu-note">
              Uses PeerJS free signaling server. STUN provided by Google.
            </p>
          </div>
        )}

        {tab === 'manual' && (
          <div className="menu-body">
            <p className="menu-info">
              Completely offline — exchange connection codes manually.
              Works with zero external servers (except STUN for NAT).
            </p>

            <div className="manual-section">
              <h3>🎯 Host a Room</h3>
              <div className="field">
                <label>Your Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Enter your name..."
                  maxLength={16}
                />
              </div>
              <button className="btn btn-primary" onClick={handleManualHost} disabled={!name.trim()}>
                🔗 Generate Invite Code
              </button>
            </div>

            <div className="or-divider"><span>or</span></div>

            <div className="manual-section">
              <h3>🎯 Join a Room</h3>
              <p className="menu-info" style={{fontSize:12, color:'#888'}}>Using name: <strong>{name || '(not set)'}</strong></p>
              <div className="field">
                <label>Paste Host's Invite Code</label>
                <textarea
                  value={manualOfferInput}
                  onChange={e => setManualOfferInput(e.target.value)}
                  placeholder='Paste the code from the host...'
                  rows={3}
                />
              </div>
              <button className="btn btn-secondary" onClick={handleManualGuest} disabled={!name.trim() || !manualOfferInput.trim()}>
                🔗 Connect
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}