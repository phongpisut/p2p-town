import { useEffect, useRef, useState, useCallback } from 'react';
import Peer from 'peerjs';
import SimplePeer from 'simple-peer';
import { UPDATE_MS, COLORS } from '../constants.js';

function pickColor(used) {
  const avail = COLORS.filter(c => !used.includes(c));
  return avail.length > 0 ? avail[Math.floor(Math.random() * avail.length)] : COLORS[Math.floor(Math.random() * COLORS.length)];
}

export default function usePeerNetwork(playerName) {
  const [players, setPlayers] = useState({});
  const [myId, setMyId] = useState(null);
  const [myColor, setMyColor] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(null); // 'peerjs' | 'manual'

  // Refs for mutable state
  const peerRef = useRef(null);
  const connsRef = useRef({});      // { peerId: DataConnection } — all active connections
  const hostConnRef = useRef(null); // guest's single connection to host
  const playersRef = useRef({});
  const isHostRef = useRef(false);
  const posBufferRef = useRef({ x: 0, y: 0 });
  const lastSentRef = useRef(0);
  const manualPeerRef = useRef(null);

  // Keep playersRef in sync for use in callbacks
  useEffect(() => { playersRef.current = players; }, [players]);

  const broadcast = useCallback((data, excludeId) => {
    const entries = Object.entries(connsRef.current);
    for (const [id, conn] of entries) {
      if (id !== excludeId && conn.open) {
        try { conn.send(data); } catch (e) { /* skip */ }
      }
    }
  }, []);

  // --- PeerJS mode ---

  const createRoom = useCallback((roomId) => {
    setMode('peerjs');
    setIsHost(true);
    isHostRef.current = true;

    const color = pickColor([]);
    setMyColor(color);

    const p = new Peer(roomId, {
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    });

    p.on('open', (id) => {
      setMyId(id);
      setPlayers({ [id]: { id, name: playerName, x: MAP_CX, y: MAP_CY, color } });
      setIsConnected(true);
    });

    p.on('connection', (conn) => {
      const pid = conn.peer;
      connsRef.current[pid] = conn;

      conn.on('data', (data) => {
        if (data.type === 'join') {
          const usedColors = Object.values(playersRef.current).map(p => p.color);
          const c = pickColor(usedColors);
          const newPlayer = { id: pid, name: data.name, x: MAP_CX + jitter(), y: MAP_CY + jitter(), color: c };
          const current = structuredClone(playersRef.current);
          current[pid] = newPlayer;
          setPlayers(current);
          // Send welcome to the new peer
          conn.send({ type: 'welcome', id: pid, players: current, color: c });
          // Tell everyone else about the new player
          broadcast({ type: 'player-joined', player: newPlayer }, pid);
        } else if (data.type === 'move') {
          const current = { ...playersRef.current };
          if (current[pid]) {
            current[pid] = { ...current[pid], x: data.x, y: data.y };
            setPlayers(current);
          }
          // Relay to all other peers
          broadcast({ type: 'move', id: pid, x: data.x, y: data.y }, pid);
        }
      });

      conn.on('close', () => {
        delete connsRef.current[pid];
        const remains = { ...playersRef.current };
        delete remains[pid];
        setPlayers(remains);
        broadcast({ type: 'player-left', id: pid });
      });
    });

    p.on('error', (err) => setError(err.message));
    peerRef.current = p;
  }, [playerName, broadcast]);

  const joinRoom = useCallback((hostId) => {
    setMode('peerjs');
    setIsHost(false);
    isHostRef.current = false;

    const color = pickColor([]);
    setMyColor(color);

    const p = new Peer(undefined, {
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    });

    p.on('open', (id) => {
      setMyId(id);
      const conn = p.connect(hostId, { reliable: true });

      conn.on('open', () => {
        hostConnRef.current = conn;
        connsRef.current[hostId] = conn;
        conn.send({ type: 'join', name: playerName });
      });

      conn.on('data', (data) => {
        if (data.type === 'welcome') {
          const myPos = data.players[data.id];
          setPlayers(data.players);
          // Center position for myself
          if (myPos) {
            setPlayers(prev => ({
              ...prev,
              [data.id]: { ...prev[data.id], x: MAP_CX, y: MAP_CY },
            }));
          }
          setIsConnected(true);
        } else if (data.type === 'move') {
          setPlayers(prev => {
            if (!prev[data.id]) return prev;
            return { ...prev, [data.id]: { ...prev[data.id], x: data.x, y: data.y } };
          });
        } else if (data.type === 'player-joined') {
          setPlayers(prev => ({ ...prev, [data.player.id]: data.player }));
        } else if (data.type === 'player-left') {
          setPlayers(prev => {
            const next = { ...prev };
            delete next[data.id];
            return next;
          });
        }
      });

      conn.on('close', () => {
        delete connsRef.current[hostId];
        hostConnRef.current = null;
        setIsConnected(false);
      });

      connsRef.current[hostId] = conn;
    });

    p.on('error', (err) => setError(err.message));
    peerRef.current = p;
  }, [playerName]);

  // --- Manual (simple-peer) mode ---

  const createManualOffer = useCallback(() => {
    setMode('manual');
    setIsHost(true);
    isHostRef.current = true;

    const color = pickColor([]);
    setMyColor(color);

    const sp = new SimplePeer({ initiator: true, trickle: false });
    manualPeerRef.current = sp;

    sp.on('signal', (data) => {
      // First signal is the offer — store it
      if (data.type === 'offer') {
        window.__manualOffer = JSON.stringify(data);
      }
    });

    sp.on('connect', () => {
      const id = 'manual-host';
      setMyId(id);
      setPlayers({ [id]: { id, name: playerName, x: MAP_CX, y: MAP_CY, color } });
      setIsConnected(true);

      sp.on('data', (raw) => {
        try {
          const data = JSON.parse(raw.toString());
          if (data.type === 'join') {
            setPlayers(prev => ({
              ...prev,
              [data.id]: { id: data.id, name: data.name, x: MAP_CX + jitter(), y: MAP_CY + jitter(), color: data.color },
            }));
          } else if (data.type === 'move') {
            setPlayers(prev => {
              if (!prev[data.id]) return prev;
              return { ...prev, [data.id]: { ...prev[data.id], x: data.x, y: data.y } };
            });
          }
        } catch (e) { /* ignore */ }
      });
    });

    sp.on('error', (err) => setError(err.message));

    // Return the offer string (slight delay for signal event)
    return new Promise((resolve) => {
      const check = () => {
        if (window.__manualOffer) {
          resolve(window.__manualOffer);
          delete window.__manualOffer;
        } else {
          setTimeout(check, 100);
        }
      };
      setTimeout(check, 200);
    });
  }, [playerName]);

  const acceptManualOffer = useCallback((offerStr, guestName) => {
    setMode('manual');
    setIsHost(false);
    isHostRef.current = false;

    const color = pickColor([]);
    setMyColor(color);

    const offer = JSON.parse(offerStr);
    const sp = new SimplePeer({ initiator: false, trickle: false });
    manualPeerRef.current = sp;

    sp.signal(offer);

    let answered = false;

    sp.on('signal', (data) => {
      if (data.type === 'answer' && !answered) {
        answered = true;
        window.__manualAnswer = JSON.stringify(data);
      }
    });

    sp.on('connect', () => {
      const id = 'manual-guest-' + Date.now();
      setMyId(id);
      setPlayers({ [id]: { id, name: guestName, x: MAP_CX, y: MAP_CY, color } });
      setIsConnected(true);

      // Send join info
      sp.send(JSON.stringify({ type: 'join', id, name: guestName, color }));

      sp.on('data', (raw) => {
        try {
          const data = JSON.parse(raw.toString());
          if (data.type === 'move') {
            setPlayers(prev => {
              if (!prev[data.id]) return prev;
              return { ...prev, [data.id]: { ...prev[data.id], x: data.x, y: data.y } };
            });
          }
        } catch (e) { /* ignore */ }
      });
    });

    sp.on('error', (err) => setError(err.message));

    return new Promise((resolve) => {
      const check = () => {
        if (window.__manualAnswer) {
          resolve(window.__manualAnswer);
          delete window.__manualAnswer;
        } else {
          setTimeout(check, 100);
        }
      };
      setTimeout(check, 200);
    });
  }, [playerName]);

  const completeManualConnection = useCallback((answerStr) => {
    const answer = JSON.parse(answerStr);
    if (manualPeerRef.current) {
      manualPeerRef.current.signal(answer);
    }
  }, []);

  // --- Shared sendMove ---

  const sendMove = useCallback((x, y) => {
    const now = Date.now();
    if (now - lastSentRef.current < UPDATE_MS) return;
    lastSentRef.current = now;

    if (mode === 'peerjs') {
      if (isHostRef.current) {
        // Host: update self and broadcast
        setPlayers(prev => {
          const me = prev[myId];
          if (!me) return prev;
          const updated = { ...prev, [myId]: { ...me, x, y } };
          broadcast({ type: 'move', id: myId, x, y });
          return updated;
        });
      } else {
        // Guest: send to host
        if (hostConnRef.current && hostConnRef.current.open) {
          hostConnRef.current.send({ type: 'move', x, y });
        }
      }
    } else if (mode === 'manual') {
      if (manualPeerRef.current && manualPeerRef.current.connected) {
        manualPeerRef.current.send(JSON.stringify({ type: 'move', id: myId, x, y }));
        setPlayers(prev => {
          const me = prev[myId];
          if (!me) return prev;
          return { ...prev, [myId]: { ...me, x, y } };
        });
      }
    }
  }, [mode, myId, broadcast]);

  // --- Cleanup ---

  const disconnect = useCallback(() => {
    if (mode === 'manual' && manualPeerRef.current) {
      manualPeerRef.current.destroy();
      manualPeerRef.current = null;
    }
    if (peerRef.current) {
      Object.values(connsRef.current).forEach(c => c.close());
      connsRef.current = {};
      hostConnRef.current = null;
      peerRef.current.destroy();
      peerRef.current = null;
    }
    setPlayers({});
    setIsConnected(false);
    setIsHost(false);
    setMode(null);
    setMyId(null);
  }, [mode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (peerRef.current) peerRef.current.destroy();
      if (manualPeerRef.current) manualPeerRef.current.destroy();
    };
  }, []);

  return {
    players,
    myId,
    myColor,
    isConnected,
    isHost,
    error,
    mode,
    createRoom,
    joinRoom,
    createManualOffer,
    acceptManualOffer,
    completeManualConnection,
    sendMove,
    disconnect,
  };
}

// Helpers
const MAP_CX = 800;
const MAP_CY = 600;
function jitter() { return (Math.random() - 0.5) * 120; }

// structuredClone polyfill for older browsers
if (!globalThis.structuredClone) {
  globalThis.structuredClone = (obj) => JSON.parse(JSON.stringify(obj));
}