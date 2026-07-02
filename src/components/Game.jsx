import React, { useEffect, useRef, useState, useCallback } from 'react';
import usePeerNetwork from '../hooks/usePeerNetwork.js';
import {
  MAP_W, MAP_H, PSIZE, SPEED, UPDATE_MS,
  BUILDINGS, TREES, COLORS,
} from '../constants.js';
import { copyToClipboard } from '../utils.js';
import './Game.css';

export default function Game({ playerName, roomId, isHost: hostFlag, mode, onLeave }) {
  const canvasRef = useRef(null);
  const keysRef = useRef({});
  const posRef = useRef({ x: 800, y: 600 });
  const animRef = useRef(null);
  const [playersOnline, setPlayersOnline] = useState(0);
  const [manualOffer, setManualOffer] = useState('');
  const [manualAnswer, setManualAnswer] = useState('');
  const [manualStep, setManualStep] = useState('idle'); // idle | wait-offer | wait-answer | done
  const [manualOfferInput, setManualOfferInput] = useState('');
  const [manualAnswerInput, setManualAnswerInput] = useState('');

  const {
    players, myId, isConnected, error, isHost: netIsHost,
    createRoom, joinRoom, createManualOffer, acceptManualOffer,
    completeManualConnection, sendMove, disconnect,
  } = usePeerNetwork(playerName);

  const isHostActual = hostFlag || netIsHost;

  // Connect on mount
  useEffect(() => {
    if (mode === 'peerjs') {
      if (hostFlag) {
        createRoom(roomId);
      } else {
        joinRoom(roomId);
      }
    } else if (mode === 'manual') {
      if (hostFlag) {
        setManualStep('wait-offer');
        createManualOffer().then(offer => {
          setManualOffer(offer);
        });
      } else {
        // Guest: roomId contains the offer string
        setManualOfferInput(roomId);
        setManualStep('wait-answer');
        acceptManualOffer(roomId, playerName).then(answer => {
          setManualAnswer(answer);
        });
      }
    }
  }, []);

  // Update player count
  useEffect(() => {
    setPlayersOnline(Object.keys(players).length);
  }, [players]);

  // Handle manual complete
  useEffect(() => {
    if (manualAnswer && manualStep === 'wait-answer') {
      setManualStep('done');
    }
  }, [manualAnswer, manualStep]);

  // Keyboard handlers
  useEffect(() => {
    const down = (e) => { keysRef.current[e.key] = true; e.preventDefault(); };
    const up = (e) => { keysRef.current[e.key] = false; e.preventDefault(); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    let lastUpdate = 0;

    function loop(t) {
      // Move self
      const me = players[myId];
      if (me && isConnected) {
        let dx = 0, dy = 0;
        const k = keysRef.current;
        if (k['ArrowUp'] || k['w'] || k['W']) dy = -SPEED;
        if (k['ArrowDown'] || k['s'] || k['S']) dy = SPEED;
        if (k['ArrowLeft'] || k['a'] || k['A']) dx = -SPEED;
        if (k['ArrowRight'] || k['d'] || k['D']) dx = SPEED;
        if (dx && dy) { dx *= 0.707; dy *= 0.707; }

        const newX = Math.max(PSIZE, Math.min(MAP_W - PSIZE, posRef.current.x + dx));
        const newY = Math.max(PSIZE, Math.min(MAP_H - PSIZE, posRef.current.y + dy));
        posRef.current = { x: newX, y: newY };

        // Check building collision
        let blocked = false;
        for (const b of BUILDINGS) {
          if (newX + PSIZE > b.x && newX - PSIZE < b.x + b.w &&
              newY + PSIZE > b.y && newY - PSIZE < b.y + b.h) {
            blocked = true;
            break;
          }
        }
        if (!blocked) {
          posRef.current = { x: newX, y: newY };
          if (t - lastUpdate >= UPDATE_MS) {
            lastUpdate = t;
            sendMove(newX, newY);
          }
        }
      }

      // Render
      render(ctx, canvas, players, myId, posRef.current);
      animRef.current = requestAnimationFrame(loop);
    }

    animRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [players, myId, isConnected, sendMove]);

  return (
    <div className="game-container">
      <canvas ref={canvasRef} className="game-canvas" />

      {/* HUD */}
      <div className="hud">
        <div className="hud-left">
          <span className="hud-title">🏘️ P2P Town</span>
          {isConnected && (
            <span className="hud-players">
              👥 {playersOnline} {playersOnline === 1 ? 'player' : 'players'}
            </span>
          )}
        </div>
        <div className="hud-right">
          {isHostActual && isConnected && mode === 'peerjs' && (
            <span className="hud-room" title="Share this ID with friends">
              📋 {roomId}
              <button className="hud-copy" onClick={() => { copyToClipboard(roomId); }}>
                Copy
              </button>
            </span>
          )}
          <span className="hud-status">
            {!isConnected && !error && '🔄 Connecting...'}
            {isConnected && `✅ ${playerName}`}
          </span>
          <button className="hud-leave" onClick={() => { disconnect(); onLeave(); }}>
            ✕ Leave
          </button>
        </div>
      </div>

      {/* Manual signaling overlay */}
      {mode === 'manual' && isHostActual && !isConnected && manualOffer && (
        <div className="signal-overlay">
          <div className="signal-card">
            <h3>📋 Step 1: Share This Code</h3>
            <p className="signal-desc">Send this code to the person who wants to join.</p>
            <textarea className="signal-code" readOnly value={manualOffer} rows={4} />
            <button className="btn btn-primary" onClick={() => { copyToClipboard(manualOffer); }}>📋 Copy Code</button>

            <div className="or-divider"><span>then</span></div>

            <h3>📋 Step 2: Paste Their Answer</h3>
            <p className="signal-desc">After they paste your code, they'll give you an answer code. Paste it here.</p>
            <textarea
              className="signal-code"
              value={manualAnswerInput}
              onChange={e => setManualAnswerInput(e.target.value)}
              placeholder="Paste the answer code here..."
              rows={3}
            />
            <button
              className="btn btn-secondary"
              disabled={!manualAnswerInput.trim()}
              onClick={() => {
                completeManualConnection(manualAnswerInput.trim());
              }}
            >
              🔗 Complete Connection
            </button>
          </div>
        </div>
      )}

      {mode === 'manual' && !isHostActual && !isConnected && manualAnswer && (
        <div className="signal-overlay">
          <div className="signal-card">
            <h3>📋 Step 2: Send This Back</h3>
            <p className="signal-desc">Copy this code and send it back to the host.</p>
            <textarea className="signal-code" readOnly value={manualAnswer} rows={4} />
            <button className="btn btn-primary" onClick={() => { copyToClipboard(manualAnswer); }}>📋 Copy Code</button>
            <p className="signal-desc" style={{ marginTop: 12 }}>
              Waiting for host to complete the connection...
            </p>
          </div>
        </div>
      )}

      {/* Players list */}
      {isConnected && (
        <div className="player-list">
          <h4>Players</h4>
          {Object.values(players).map(p => (
            <div key={p.id} className="player-item">
              <span className="player-dot" style={{ background: p.color }} />
              <span className="player-name">{p.name}</span>
              {p.id === myId && <span className="player-tag">(you)</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Rendering ---

function render(ctx, canvas, players, myId, myPos) {
  const W = canvas.width;
  const H = canvas.height;

  // Camera centered on my player
  const camX = myPos.x - W / 2;
  const camY = myPos.y - H / 2;

  // Clear
  ctx.fillStyle = '#2d5a27';
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.translate(-camX, -camY);

  // Grass
  ctx.fillStyle = '#3a7d3a';
  ctx.fillRect(0, 0, MAP_W, MAP_H);

  // Grass texture lines
  ctx.strokeStyle = 'rgba(50, 110, 50, 0.3)';
  ctx.lineWidth = 1;
  for (let y = 0; y < MAP_H; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(MAP_W, y);
    ctx.stroke();
  }
  for (let x = 0; x < MAP_W; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, MAP_H);
    ctx.stroke();
  }

  // Town square (center)
  ctx.fillStyle = '#b8a88a';
  ctx.fillRect(MAP_W / 2 - 120, MAP_H / 2 - 120, 240, 240);
  ctx.strokeStyle = '#9a8a6a';
  ctx.lineWidth = 2;
  ctx.strokeRect(MAP_W / 2 - 120, MAP_H / 2 - 120, 240, 240);

  // Paths from center
  ctx.fillStyle = '#c4b498';
  ctx.fillRect(MAP_W / 2 - 40, 0, 80, MAP_H / 2 - 120);
  ctx.fillRect(MAP_W / 2 - 40, MAP_H / 2 + 120, 80, MAP_H / 2 - 120);
  ctx.fillRect(0, MAP_H / 2 - 40, MAP_W / 2 - 120, 80);
  ctx.fillRect(MAP_W / 2 + 120, MAP_H / 2 - 40, MAP_W / 2 - 120, 80);

  // Trees
  for (const t of TREES) {
    // Trunk
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(t.x - 4, t.y - 6, 8, 16);
    // Foliage
    ctx.fillStyle = '#2a6a2a';
    ctx.beginPath();
    ctx.arc(t.x, t.y - 8, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a8a3a';
    ctx.beginPath();
    ctx.arc(t.x - 4, t.y - 10, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(t.x + 4, t.y - 10, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Buildings
  for (const b of BUILDINGS) {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(b.x + 4, b.y + 4, b.w, b.h);
    // Wall
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    // Roof
    ctx.fillStyle = darken(b.color, 30);
    ctx.fillRect(b.x - 4, b.y - 4, b.w + 8, 8);
    // Door
    ctx.fillStyle = '#4a3520';
    ctx.fillRect(b.x + b.w / 2 - 6, b.y + b.h - 18, 12, 18);
    // Name
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillText(b.name, b.x + b.w / 2 + 1, b.y - 7);
    ctx.fillStyle = '#fff';
    ctx.fillText(b.name, b.x + b.w / 2, b.y - 8);
  }

  // Fence borders
  ctx.strokeStyle = '#8a7a5a';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, MAP_W - 8, MAP_H - 8);
  ctx.strokeStyle = '#6a5a3a';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, MAP_W - 20, MAP_H - 20);
  // Fence posts
  ctx.fillStyle = '#8a7a5a';
  for (let x = 20; x < MAP_W; x += 60) {
    ctx.fillRect(x - 3, 4, 6, 12);
    ctx.fillRect(x - 3, MAP_H - 16, 6, 12);
  }
  for (let y = 20; y < MAP_H; y += 60) {
    ctx.fillRect(4, y - 3, 12, 6);
    ctx.fillRect(MAP_W - 16, y - 3, 12, 6);
  }

  // Players
  const sorted = Object.values(players).sort((a, b) => a.y - b.y);
  for (const p of sorted) {
    const isMe = p.id === myId;
    const px = isMe ? myPos.x : p.x;
    const py = isMe ? myPos.y : p.y;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(px - PSIZE / 2 + 3, py - PSIZE / 2 + 3, PSIZE, PSIZE);

    // Body
    ctx.fillStyle = p.color;
    ctx.fillRect(px - PSIZE / 2, py - PSIZE / 2, PSIZE, PSIZE);

    // Border
    ctx.strokeStyle = isMe ? '#fff' : 'rgba(255,255,255,0.3)';
    ctx.lineWidth = isMe ? 3 : 1;
    ctx.strokeRect(px - PSIZE / 2, py - PSIZE / 2, PSIZE, PSIZE);

    // Eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(px - 5, py - 4, 4, 4);
    ctx.fillRect(px + 2, py - 4, 4, 4);
    ctx.fillStyle = '#222';
    ctx.fillRect(px - 4, py - 3, 2, 2);
    ctx.fillRect(px + 3, py - 3, 2, 2);

    // Name
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillText(p.name, px + 1, py - PSIZE / 2 - 4);
    ctx.fillStyle = '#fff';
    ctx.fillText(p.name, px, py - PSIZE / 2 - 5);
  }

  ctx.restore();
}

function darken(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xFF) - amount);
  const b = Math.max(0, (num & 0xFF) - amount);
  return `rgb(${r},${g},${b})`;
}