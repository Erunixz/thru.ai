# thru.ai — AI-Powered Drive-Through Ordering System

> Replaces the human order-taker at a drive-through stall with an AI that **listens**, **understands**, **responds in a natural voice**, and **relays orders to the kitchen** — all in real-time.

---

## How It Works

A customer pulls up to the drive-through speaker. Instead of a person, an AI handles the entire ordering conversation — taking items, asking about sizes and modifications, suggesting combos, confirming the order, and speaking back in a natural human voice. The kitchen sees the order appear in real-time on a separate display.

```
                          thru.ai — Full Architecture
                          ===========================

  CUSTOMER (in car)                                           KITCHEN (inside)
  ─────────────────                                           ─────────────────
                                                              
  🗣️ Speaks order        ┌─────────────────────────────┐     📺 Kitchen Display
         │               │     Express + Socket.IO       │          │
         ▼               │         (Node.js)             │          │
  ┌─────────────┐       │                               │    ┌─────────────┐
  │  Customer    │ REST  │   ┌──────┐     ┌──────────┐  │ WS │   Kitchen    │
  │  Kiosk      │──────►│   │Claude│     │ElevenLabs│  │───►│   Display    │
  │  (React)    │◄──────│   │  AI  │     │   TTS    │  │    │   (React)    │
  │             │       │   └──────┘     └──────────┘  │    │             │
  │  • Mic input│       │                               │    │  • Order grid│
  │  • Chat UI  │       │   ┌────────────────────────┐  │    │  • Status    │
  │  • Order    │       │   │   Order Manager        │  │    │  • Actions   │
  │    summary  │       │   │   (in-memory store)    │  │    └─────────────┘
  └─────────────┘       │   └────────────────────────┘  │
                         └─────────────────────────────┘
  Browser: Chrome                                         Browser: Chrome
  Screen: Drive-thru                                      Screen: Kitchen
  speaker box                                             mounted display
```

### One Conversation Turn (What Happens When Customer Speaks)

| Step | Where | What Happens | Latency |
|------|-------|-------------|---------|
| 1. **LISTEN** | Browser (Web Speech API) | Chrome captures speech → text | Real-time |
| 2. **SEND** | Client → Server | Text sent via `POST /api/conversation` | ~50ms |
| 3. **THINK** | Server → Claude AI | Claude understands order, crafts reply | ~0.5-1.5s |
| 4. **SPEAK** | Server → ElevenLabs | Converts reply text → natural voice audio | ~0.5-1.0s |
| 5. **SYNC** | Server → Kitchen | Socket.IO broadcasts order update to kitchen | ~10ms |
| 6. **PLAY** | Browser → Speakers | AI voice plays through drive-thru speakers | Audio length |

**Total response time: ~1-3 seconds** (then audio plays)

---

## Tech Stack

| Component | Technology | Role |
|-----------|-----------|------|
| **Backend** | Node.js + Express | REST API + server orchestration |
| **Real-time** | Socket.IO | Live kitchen display updates |
| **AI Brain** | Claude Haiku (Anthropic) | Understands orders, crafts replies |
| **Voice** | ElevenLabs (`eleven_turbo_v2_5`) | Text-to-speech (natural human voice) |
| **Speech Input** | Web Speech API (Chrome) | Browser-native speech-to-text |
| **Frontend** | React + Vite + Tailwind CSS | Customer kiosk + kitchen display |
| **Animations** | Framer Motion | Smooth UI transitions |
| **Icons** | Lucide React | Clean icon set |

### Why These Choices?

- **Web Speech API** — Free, zero-setup speech-to-text built into Chrome. No GPU needed.
- **Claude Haiku** — Fastest Claude model (sub-second). Cheapest too. Reliable structured output.
- **ElevenLabs Turbo** — Most natural AI voices. Low-latency model. Hackathon sponsor.
- **Socket.IO** — Instant kitchen updates. Auto-reconnects. Battle-tested.
- **Vite** — Fastest React dev server. Hot reload in milliseconds.

---

## Project Structure

```
thru.ai/
├── server/                     # Node.js Backend
│   ├── index.js                # Express + Socket.IO entry point + all API routes
│   ├── config.js               # Loads .env, exports typed config object
│   ├── menu.json               # Restaurant menu (prices, sizes, modifiers)
│   └── services/
│       ├── claude.js           # Claude AI: sessions, conversation, order extraction
│       ├── elevenlabs.js       # ElevenLabs: text → base64 MP3 audio
│       └── orderManager.js     # Order lifecycle: create, update, status tracking
│
├── client/                     # React Frontend
│   ├── index.html              # HTML shell (React mounts here)
│   ├── package.json            # Client dependencies
│   ├── vite.config.js          # Vite config + API proxy
│   ├── tailwind.config.js      # Tailwind theme (brand colors, animations)
│   ├── postcss.config.js       # PostCSS (loads Tailwind)
│   └── src/
│       ├── main.jsx            # React entry point
│       ├── App.jsx             # Router: / = kiosk, /kitchen = kitchen
│       ├── index.css           # Tailwind imports + global styles
│       ├── pages/
│       │   ├── CustomerKiosk.jsx    # Customer-facing drive-thru screen
│       │   └── KitchenDisplay.jsx   # Kitchen order dashboard
│       ├── components/
│       │   ├── VoiceInput.jsx       # Mic button + Web Speech API
│       │   ├── Conversation.jsx     # Chat transcript (bubbles)
│       │   ├── OrderPanel.jsx       # Current order summary
│       │   └── KitchenOrderCard.jsx # Single order card for kitchen grid
│       ├── hooks/
│       │   └── useSocket.js         # Socket.IO React hook (kitchen updates)
│       └── services/
│           └── api.js               # REST API client (fetch wrappers)
│
├── package.json                # Root: server deps + run scripts
├── .env.example                # Environment variables template
├── .gitignore                  # Ignores node_modules, .env, dist
│
└── (Python prototype files)    # Original Python version (for reference)
    ├── main.py
    ├── frontend_server.py
    ├── config.py
    ├── menu.json
    └── requirements.txt
```

---

## Setup & Running

### Prerequisites

- **Node.js 18+** (for native `fetch`)
- **Chrome or Edge** (for Web Speech API)
- **Anthropic API key** (https://console.anthropic.com/)
- **ElevenLabs API key** (https://elevenlabs.io/)

### 1. Install Dependencies

```bash
# Install server + client dependencies in one command:
npm run install:all

# Or manually:
npm install          # server deps
cd client && npm install  # client deps
```

### 2. Configure API Keys

```bash
# Copy the template
cp .env.example .env

# Edit .env and add your real API keys:
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_API_KEY=xi-...
```

### 3. Run (Development)

```bash
# Start BOTH server and client with one command:
npm run dev
```

This runs:
- **Express server** on `http://localhost:3001` (auto-restarts on changes)
- **React dev server** on `http://localhost:5173` (hot reloads)

### 4. Open in Browser

| View | URL | Description |
|------|-----|-------------|
| Customer Kiosk | http://localhost:5173 | Drive-thru ordering screen |
| Kitchen Display | http://localhost:5173/kitchen | Kitchen order dashboard |

Open both in separate Chrome windows to see the full system working together.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/session/start` | Start new ordering session → returns greeting + audio |
| `POST` | `/api/conversation` | Send customer text → returns AI reply + audio + order |
| `GET` | `/api/orders` | Get all active orders (for kitchen) |
| `POST` | `/api/orders/:id/status` | Kitchen updates order status |
| `GET` | `/api/menu` | Get restaurant menu |

### Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `orders:init` | Server → Client | All active orders (on connect) |
| `order:new` | Server → Client | New ordering session started |
| `order:update` | Server → Client | Order items/status changed |
| `order:complete` | Server → Client | Customer confirmed order |
| `order:status` | Client → Server | Kitchen changes order status |

---

## How to Demo

1. Open **Customer Kiosk** (http://localhost:5173) — this is the drive-thru screen
2. Open **Kitchen Display** (http://localhost:5173/kitchen) — this is the kitchen screen
3. On the kiosk, tap **"Start Order"** — AI greets you with voice
4. Speak your order: *"I'll have a cheeseburger with no pickles and a medium fries"*
5. AI responds with voice, order panel updates, kitchen display shows the order
6. Continue ordering, then say *"That's all"* to confirm
7. On the kitchen display, click **"Start Preparing"** → **"Mark Ready"** → **"Complete"**

---

## Configuration Reference

All settings in `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | (required) | Claude API key |
| `ELEVENLABS_API_KEY` | (required) | ElevenLabs API key |
| `CLAUDE_MODEL` | `claude-haiku-4-5-20251001` | Claude model name |
| `ELEVENLABS_VOICE_ID` | `21m00Tcm4TlvDq8ikWAM` | ElevenLabs voice (Rachel) |
| `ELEVENLABS_MODEL` | `eleven_turbo_v2_5` | TTS model (turbo = fastest) |
| `PORT` | `3001` | Express server port |
