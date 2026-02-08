// =============================================================================
// server/index.js — Express + Socket.IO Server
// =============================================================================
//
// ARCHITECTURE (ElevenLabs Conversational AI Agent):
//
//   Browser ←→ ElevenLabs Agent (handles STT + LLM + TTS all-in-one)
//       ↓ (client tool: update_order)
//   Express Server (orders + Socket.IO → Kitchen Display)
//
// The agent handles the ENTIRE voice conversation pipeline.
// Our server just:
//   1. Provides signed URLs to securely start agent sessions
//   2. Receives order updates from the frontend (via client tool callbacks)
//   3. Broadcasts order data to kitchen displays via Socket.IO
//
// =============================================================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('./config');

// Services (only order management — agent handles conversation)
const orderManager = require('./services/orderManager');
const menuService = require('./services/menuService');

// Menu data
const menu = require('../menu.json'); // Root menu.json (comprehensive menu)

// =============================================================================
// EXPRESS + SOCKET.IO SETUP
// =============================================================================

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.nodeEnv === 'development'
      ? ['http://localhost:5173', 'http://localhost:3000']
      : false,
    methods: ['GET', 'POST'],
  },
});

app.use(express.json());
app.use(cors());

if (config.nodeEnv === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
}

// =============================================================================
// API ROUTES
// =============================================================================

// ---------------------------------------------------------------------------
// GET /api/agent/signed-url — Get a signed URL for the ElevenLabs agent
// ---------------------------------------------------------------------------
app.get('/api/agent/signed-url', async (req, res) => {
  try {
    if (!config.elevenLabsAgentId) {
      return res.status(500).json({
        error: 'Agent not configured. Set ELEVENLABS_AGENT_ID in .env',
      });
    }
    if (!config.elevenLabsApiKey) {
      return res.status(500).json({ error: 'ELEVENLABS_API_KEY not set in .env' });
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${config.elevenLabsAgentId}`,
      { headers: { 'xi-api-key': config.elevenLabsApiKey } }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ElevenLabs signed URL error:', response.status, errorText);
      throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    // Create an order record for this session
    const orderId = uuidv4();
    const order = orderManager.createOrder(orderId);
    io.emit('order:new', order);

    console.log(`✅ New agent session → Order #${order.orderNumber} (${orderId.slice(0, 8)})`);
    res.json({ signedUrl: data.signed_url, orderId, order });
  } catch (error) {
    console.error('❌ Signed URL error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/orders/update — Receive order updates from client tool callback
// ---------------------------------------------------------------------------
app.post('/api/orders/update', (req, res) => {
  try {
    const { orderId, items, total, status } = req.body;
    if (!orderId) return res.status(400).json({ error: 'Missing orderId' });

    // Debug: Log if items count is abnormal
    if (items && items.length > 10) {
      console.warn(`⚠️  ABNORMAL ITEM COUNT: ${items.length} items received`);
      console.warn('First 3 items:', JSON.stringify(items.slice(0, 3), null, 2));
      console.warn('Last 3 items:', JSON.stringify(items.slice(-3), null, 2));
    }

    const order = orderManager.updateOrder(orderId, { items, total, status });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (status === 'complete') {
      io.emit('order:complete', order);
      console.log(`✅ Order #${order.orderNumber} complete! $${total}`);
    } else {
      io.emit('order:update', order);
      console.log(`🛒 Order #${order.orderNumber} updated: ${items?.length || 0} items, $${total || 0}`);
    }

    res.json(order);
  } catch (error) {
    console.error('❌ Order update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/orders — All active orders (for tracking/debugging)
// ---------------------------------------------------------------------------
app.get('/api/orders', (req, res) => {
  res.json(orderManager.getActiveOrders());
});

app.get('/api/menu', (req, res) => res.json(menu));

// ---------------------------------------------------------------------------
// POST /api/admin/refresh-menu — Refresh agent with current menu
// ---------------------------------------------------------------------------
app.post('/api/admin/refresh-menu', async (req, res) => {
  try {
    await menuService.refreshAgentMenu();
    res.json({ success: true, message: 'Agent menu refreshed successfully' });
  } catch (error) {
    console.error('❌ Failed to refresh menu:', error);
    res.status(500).json({ error: error.message });
  }
});

if (config.nodeEnv === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  });
}

// =============================================================================
// SOCKET.IO — Real-time order updates
// =============================================================================

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  socket.emit('orders:init', orderManager.getActiveOrders());

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// =============================================================================
// START
// =============================================================================

server.listen(config.port, () => {
  console.log('');
  console.log('='.repeat(58));
  console.log('  🍔  thru.ai — Drive-Through AI (ElevenLabs Agent)');
  console.log('='.repeat(58));
  console.log(`  Server:      http://localhost:${config.port}`);
  console.log(`  Agent:       ${config.elevenLabsAgentId ? '✅ ' + config.elevenLabsAgentId : '❌ Not configured'}`);
  console.log(`  ElevenLabs:  ${config.elevenLabsApiKey ? '✅ API Key Set' : '❌ Missing'}`);
  console.log(`  Kiosk:       http://localhost:${config.port}`);
  console.log('='.repeat(58));
  console.log('');

  // Refresh agent menu on startup
  if (config.elevenLabsAgentId && config.elevenLabsApiKey) {
    menuService.refreshAgentMenu()
      .then(() => console.log('✓ Agent menu refreshed with latest menu.json'))
      .catch(err => console.error('❌ Failed to refresh agent menu:', err.message));
  }
});
