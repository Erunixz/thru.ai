// =============================================================================
// server/index.js — Express + Socket.IO Server (Backend Entry Point)
// =============================================================================
//
// PURPOSE:
//   This is the BACKEND of the drive-thru AI system. It:
//     1. Serves REST API endpoints for conversation + order management
//     2. Runs Socket.IO for real-time kitchen display updates
//     3. Orchestrates the AI pipeline: Customer text → Claude → ElevenLabs → Response
//     4. In production mode, serves the built React frontend
//
// ARCHITECTURE:
//
//   React Frontend (Customer Kiosk / Kitchen Display)
//          │                    │
//          │ REST API           │ Socket.IO
//          │ (fetch)            │ (real-time)
//          ▼                    ▼
//   ┌─────────────────────────────────────┐
//   │         Express + Socket.IO          │
//   │                                      │
//   │  POST /api/session/start             │  → Creates session, returns greeting + audio
//   │  POST /api/conversation              │  → Processes speech, returns AI reply + audio
//   │  GET  /api/orders                    │  → Returns active orders for kitchen
//   │  POST /api/orders/:id/status         │  → Kitchen updates order status
//   │  GET  /api/menu                      │  → Returns the restaurant menu
//   │                                      │
//   │  Socket.IO events:                   │
//   │    → order:new      (to kitchen)     │
//   │    → order:update   (to kitchen)     │
//   │    → order:complete (to kitchen)     │
//   └─────────────────────────────────────┘
//          │                    │
//          ▼                    ▼
//     Claude AI          ElevenLabs TTS
//   (conversation)       (voice synthesis)
//
// HOW TO RUN:
//   Development: npm run server:dev  (auto-restarts on changes via nodemon)
//   Production:  npm start
//   Both:        npm run dev  (runs server + React client concurrently)
//
// =============================================================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');

// --- Our service modules ---
const claude = require('./services/claude');
const elevenlabs = require('./services/elevenlabs');
const orderManager = require('./services/orderManager');

// --- Load menu data (for the GET /api/menu endpoint) ---
const menu = require('./menu.json');

// =============================================================================
// CREATE EXPRESS APP + HTTP SERVER + SOCKET.IO
// =============================================================================

const app = express();

// Create an HTTP server from the Express app (needed for Socket.IO)
const server = http.createServer(app);

// Attach Socket.IO to the HTTP server
// CORS is configured to allow connections from the Vite dev server (port 5173)
// and any other origin in development. Tighten this in production.
const io = new Server(server, {
  cors: {
    origin: config.nodeEnv === 'development'
      ? ['http://localhost:5173', 'http://localhost:3000']
      : false,  // In production, served from same origin — no CORS needed
    methods: ['GET', 'POST'],
  },
});

// =============================================================================
// MIDDLEWARE
// =============================================================================

// Parse JSON request bodies (for POST endpoints)
app.use(express.json());

// Enable CORS for development (React dev server runs on a different port)
app.use(cors());

// Serve the built React frontend in production
// The React build output goes to client/dist/ (Vite default)
if (config.nodeEnv === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
}

// =============================================================================
// REST API ROUTES
// =============================================================================

// ---------------------------------------------------------------------------
// POST /api/session/start — Start a new drive-thru ordering session
// ---------------------------------------------------------------------------
// Called when a customer taps "Start Order" on the kiosk screen.
// Creates a new conversation session + order record, generates a greeting
// with ElevenLabs TTS, and returns everything to the frontend.
//
// Request:  (no body needed)
// Response: { sessionId, text, audio }
//   - sessionId: UUID to include in all subsequent requests
//   - text: The greeting text ("Welcome to Burger Express! ...")
//   - audio: Base64-encoded MP3 of the greeting spoken by ElevenLabs
// ---------------------------------------------------------------------------
app.post('/api/session/start', async (req, res) => {
  try {
    // Generate a unique session ID
    const sessionId = uuidv4();

    // Create conversation session (Claude service)
    const { greeting } = claude.createSession(sessionId);

    // Create order record (Order Manager)
    const order = orderManager.createOrder(sessionId);

    // Generate spoken greeting via ElevenLabs
    let audio = null;
    try {
      audio = await elevenlabs.textToSpeech(greeting);
    } catch (ttsError) {
      // If TTS fails, we still return the text — the customer can read it.
      // The kiosk continues to work even without voice.
      console.warn('⚠️  TTS failed for greeting:', ttsError.message);
    }

    // Notify kitchen displays that a new ordering session has started
    io.emit('order:new', order);

    console.log(`✅ New session started: ${sessionId} (Order #${order.orderNumber})`);

    res.json({
      sessionId,
      text: greeting,
      audio,  // base64 MP3 or null if TTS failed
      order,
    });
  } catch (error) {
    console.error('❌ Failed to start session:', error);
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/conversation — Process customer speech and get AI response
// ---------------------------------------------------------------------------
// Called every time the customer speaks. This is the main AI pipeline:
//   Customer text → Claude AI → ElevenLabs TTS → Response
//
// Request:  { sessionId, text }
//   - sessionId: The session ID from /api/session/start
//   - text: What the customer said (transcribed from Web Speech API)
//
// Response: { text, audio, order, isComplete }
//   - text: AI's reply (displayed in conversation panel)
//   - audio: Base64 MP3 of the reply (played through speakers)
//   - order: Current order state { items, total, status }
//   - isComplete: True when the customer has confirmed their order
// ---------------------------------------------------------------------------
app.post('/api/conversation', async (req, res) => {
  try {
    const { sessionId, text } = req.body;

    // Validate required fields
    if (!sessionId || !text) {
      return res.status(400).json({
        error: 'Missing required fields: sessionId and text',
      });
    }

    console.log(`🎤 [${sessionId.slice(0, 8)}] Customer: "${text}"`);

    // Step 1: Process with Claude AI (understand order + craft reply)
    const aiResult = await claude.processMessage(sessionId, text);

    console.log(`🤖 [${sessionId.slice(0, 8)}] AI: "${aiResult.text}"`);

    // Step 2: Update the order record
    const updatedOrder = orderManager.updateOrder(sessionId, aiResult.order);

    // Step 3: Generate spoken response via ElevenLabs
    let audio = null;
    try {
      audio = await elevenlabs.textToSpeech(aiResult.text);
    } catch (ttsError) {
      console.warn('⚠️  TTS failed:', ttsError.message);
    }

    // Step 4: Notify kitchen displays of the order update
    if (aiResult.isComplete) {
      // Order is finalized — send a "complete" event
      io.emit('order:complete', updatedOrder);
      console.log(`✅ [${sessionId.slice(0, 8)}] Order complete! Total: $${aiResult.order.total}`);
    } else {
      // Order is still in progress — send an "update" event
      io.emit('order:update', updatedOrder);
    }

    // Step 5: Send everything back to the frontend
    res.json({
      text: aiResult.text,
      audio,
      order: updatedOrder,
      isComplete: aiResult.isComplete,
    });
  } catch (error) {
    console.error('❌ Conversation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/orders — Get all active orders (for kitchen display)
// ---------------------------------------------------------------------------
// Returns orders that are still in the kitchen pipeline (not completed).
// The kitchen display polls this or receives real-time Socket.IO events.
// ---------------------------------------------------------------------------
app.get('/api/orders', (req, res) => {
  const orders = orderManager.getActiveOrders();
  res.json(orders);
});

// ---------------------------------------------------------------------------
// POST /api/orders/:id/status — Kitchen staff updates order status
// ---------------------------------------------------------------------------
// Called when kitchen staff marks an order as "preparing", "ready", etc.
//
// Request:  { kitchenStatus: "preparing" | "ready" | "completed" }
// Response: The updated order record
// ---------------------------------------------------------------------------
app.post('/api/orders/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { kitchenStatus } = req.body;

    if (!kitchenStatus) {
      return res.status(400).json({ error: 'Missing kitchenStatus field' });
    }

    const order = orderManager.updateKitchenStatus(id, kitchenStatus);

    if (!order) {
      return res.status(404).json({ error: `Order ${id} not found` });
    }

    // Broadcast the status change to all kitchen displays
    io.emit('order:update', order);

    console.log(`📦 Order #${order.orderNumber} → ${kitchenStatus}`);
    res.json(order);
  } catch (error) {
    console.error('❌ Status update error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/menu — Return the restaurant menu
// ---------------------------------------------------------------------------
// Used by the frontend to display menu items if needed.
// ---------------------------------------------------------------------------
app.get('/api/menu', (req, res) => {
  res.json(menu);
});

// ---------------------------------------------------------------------------
// Catch-all: Serve React app for any non-API routes (production only)
// ---------------------------------------------------------------------------
if (config.nodeEnv === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  });
}

// =============================================================================
// SOCKET.IO — Real-time Kitchen Display Connection
// =============================================================================
// Kitchen displays connect via Socket.IO to receive instant order updates
// without polling. The server emits events when orders change.
//
// Events emitted by server:
//   - order:new      → New ordering session started
//   - order:update   → Order items/status changed
//   - order:complete → Customer confirmed order
//
// Events received from kitchen:
//   - order:status   → Kitchen staff changes order status

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Send all active orders to the newly connected client
  // (so the kitchen display is immediately populated)
  socket.emit('orders:init', orderManager.getActiveOrders());

  // Handle kitchen staff changing an order's status
  socket.on('order:status', ({ orderId, kitchenStatus }) => {
    try {
      const order = orderManager.updateKitchenStatus(orderId, kitchenStatus);
      if (order) {
        // Broadcast to ALL connected clients (including other kitchen displays)
        io.emit('order:update', order);
        console.log(`📦 [Socket] Order #${order.orderNumber} → ${kitchenStatus}`);
      }
    } catch (error) {
      console.error('❌ Socket order:status error:', error.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// =============================================================================
// START SERVER
// =============================================================================

server.listen(config.port, () => {
  console.log('');
  console.log('='.repeat(55));
  console.log('  🍔  thru.ai — Drive-Through AI Server');
  console.log('='.repeat(55));
  console.log(`  Server:    http://localhost:${config.port}`);
  console.log(`  Mode:      ${config.nodeEnv}`);
  console.log(`  Claude:    ${config.claudeModel}`);
  console.log(`  Voice:     ${config.elevenLabsVoiceId}`);
  console.log('');
  console.log('  API Endpoints:');
  console.log('    POST /api/session/start    → Start new order session');
  console.log('    POST /api/conversation     → Send customer speech to AI');
  console.log('    GET  /api/orders           → Get kitchen orders');
  console.log('    POST /api/orders/:id/status → Update order status');
  console.log('    GET  /api/menu             → Get restaurant menu');
  console.log('');
  console.log('  Socket.IO: Real-time kitchen display updates');
  console.log('='.repeat(55));
  console.log('');
});
