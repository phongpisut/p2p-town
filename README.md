# 🏘️ P2P Town

A tiny virtual town where you and your friends can hang out as little colored squares — no server installation required.

**[Play now on GitHub Pages](https://phongpisut.github.io/p2p-town/)**

![screenshot](./screenshot.png)

## How it works

P2P Town uses **WebRTC** to connect players directly in their browsers. There is no game server, no backend, and no account to create.

### Two connection modes

| Mode | How it works | Best for |
|------|-------------|----------|
| **🌐 Easy Connect** (PeerJS) | Uses a free cloud signaling server to negotiate the WebRTC connection. Host shares a room ID, guests paste it to join. | Playing over the internet with friends |
| **🔌 Offline Mode** (simple-peer) | No external services whatsoever. Host generates a connection code, guests copy/paste it back. Fully peer-to-peer. | LAN parties, air-gapped networks, or when the signaling server is unreachable |

> **Note:** WebRTC always needs STUN servers for NAT traversal. Both modes use Google's free STUN servers. No other infrastructure is needed either way.

## Features

- 🎮 **Real-time movement** — walk around the town with WASD or arrow keys
- 👥 **See everyone** — player squares with names update live
- 🏘️ **A tiny town** — buildings, trees, paths, and a town square to explore
- 📋 **No sign-up** — just type a name and share a room ID
- 🔒 **Peer-to-peer** — your position data goes directly between browsers
- 🧑‍🤝‍🧑 **Up to ~10 players** in a single room (limited by browser network capacity)

## How to play

### Online (no install)

1. **Host** opens [the game](https://phongpisut.github.io/p2p-town/), types a name, and clicks **Create Room**
2. **Share** the generated room ID (e.g. `town-3f8a2b`) with your friends
3. **Friends** open the same URL, type a name, paste the room ID, and click **Join Room**

### Offline / LAN

1. Switch to the **Offline Mode** tab
2. **Host** clicks **Generate Invite Code** — a long text blob appears
3. **Send** that code to your friend (paste in chat, email, USB stick, etc.)
4. **Friend** pastes the code and clicks **Connect** — a reply code is generated
5. **Friend sends** the reply code back to the host
6. **Host** pastes the reply code and clicks **Complete Connection**

Yes, it's manual. But it works with **zero servers**.

## Local development

```bash
npm install
npm run dev      # → http://localhost:3000
```

## Deployment

```bash
npm run build    # outputs to dist/
npm run deploy   # pushes dist/ to gh-pages branch
```

## Built with

- [React](https://react.dev) — UI framework
- [Vite](https://vitejs.dev) — build tool
- [PeerJS](https://peerjs.com) — simplified WebRTC signaling
- [simple-peer](https://github.com/feross/simple-peer) — raw WebRTC for offline mode
- [Google STUN](https://developers.google.com/turn) — free NAT traversal

## License

MIT