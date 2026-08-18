# Pixelverse

Pixelverse is a multiplayer 2D social arena. Players create a space, select an
avatar, move together in real time, chat, and start one-to-one video calls when
they are nearby.

## Features

- JWT-based sign-up and sign-in
- Avatar selection and immediate procedural fallback while avatar data loads
- Shared arenas with real-time movement over WebSockets
- Global chat, proximity private chat, blocking, and chat moderation
- One-to-one WebRTC video, audio, screen sharing, and local recording
- Space creation and management

## Project layout

```
apps/
  fe/          React + Vite frontend
  http/        Express API for auth, spaces, and avatar metadata
  websocket/   WebSocket server for arena events and WebRTC signalling
packages/
  db/          Prisma and MongoDB schema
```

## Requirements

- Node.js 18+
- MongoDB
- A configured JWT secret
- For reliable video calls across different networks: a TURN server

## Configuration

Create a root `.env` from `.env.example`:

```env
MONGO_URL=mongodb+srv://...
JWT_SECRET=replace_with_a_long_random_secret
PORT=8080
```

Create `apps/fe/.env.local` from `apps/fe/.env.example`:

```env
VITE_BACKEND_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8081

# Recommended for deployed video calls where direct peer connections are blocked.
VITE_TURN_URL=turn:turn.example.com:3478
VITE_TURN_USERNAME=turn_username
VITE_TURN_CREDENTIAL=turn_credential
```

TURN credentials are exposed to the browser by design, so use time-limited
credentials from your TURN provider rather than a long-lived admin password.

## Run locally

```bash
npm install
npm run db:generate
npm run dev
```

The frontend runs on Vite's printed URL (normally `http://localhost:5173`).
The API defaults to port 8080 and the WebSocket service to port 8081.

## Video call notes

Calls use WebRTC. The WebSocket service only relays offer, answer, and ICE
messages; audio/video streams go directly between browsers or through TURN.
Camera and microphone permission is required. HTTPS is required for camera
access outside of localhost.

## Build checks

```bash
npm run check-types
npm run build
```
