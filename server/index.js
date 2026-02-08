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

// Services
const orderManager = require('./services/orderManager');
const geminiService = require('./services/geminiService');

// Menu data
const menu = require('./menu.json');

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

    // Format menu as a simple text list for the agent
    const menuText = Object.entries(menu).map(([category, items]) => {
      const itemList = Object.entries(items).map(([name, data]) => {
        let itemStr = `- ${name}: $${data.price}`;
        if (data.sizes) {
          const sizes = Object.entries(data.size_prices || {})
            .map(([size, price]) => `${size} $${price}`)
            .join(', ');
          itemStr += ` (${sizes})`;
        }
        if (data.modifiers) {
          itemStr += ` [Modifiers: ${data.modifiers.join(', ')}]`;
        }
        if (data.flavors) {
          itemStr += ` [Flavors: ${data.flavors.join(', ')}]`;
        }
        return itemStr;
      }).join('\n');
      return `${category.toUpperCase()}:\n${itemList}`;
    }).join('\n\n');

    // Request signed URL with menu as a variable
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${config.elevenLabsAgentId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': config.elevenLabsApiKey,
          'Content-Type': 'application/json'
        }
      }
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
    console.log(`📋 Menu sent to agent (${Object.keys(menu).length} categories)`);

    // Return signed URL with menu data for client to pass to agent
    res.json({
      signedUrl: data.signed_url,
      orderId,
      order,
      menuData: menuText
    });
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
// GET /api/orders — All active orders (kitchen display)
// ---------------------------------------------------------------------------
app.get('/api/orders', (req, res) => {
  res.json(orderManager.getActiveOrders());
});

// ---------------------------------------------------------------------------
// POST /api/orders/:id/status — Kitchen staff updates order status
// ---------------------------------------------------------------------------
app.post('/api/orders/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { kitchenStatus } = req.body;
    if (!kitchenStatus) return res.status(400).json({ error: 'Missing kitchenStatus' });

    const order = orderManager.updateKitchenStatus(id, kitchenStatus);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    io.emit('order:update', order);
    console.log(`📦 Order #${order.orderNumber} → ${kitchenStatus}`);
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/menu — Menu items as array with metadata (for kitchen display)
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// GET /api/menu — Menu items as array with metadata
// ---------------------------------------------------------------------------
app.get('/api/menu', (req, res) => {
  const menuArray = [];

  Object.entries(menu).forEach(([category, items]) => {
    if (category.startsWith('_')) return; // Skip comments

    Object.entries(items).forEach(([name, data]) => {
      menuArray.push({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        category,
        description: data.description || '',
        price: data.price || 0,
        image: `/images/menu/${name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
        modifiers: data.modifiers || [],
        sizes: data.sizes || null,
        sizePrices: data.size_prices || null,
        flavors: data.flavors || null,
        includes: data.includes || null,
        popular: ['burgers', 'combos'].includes(category),
        available: true
      });
    });
  });

  res.json(menuArray);
});

// ---------------------------------------------------------------------------
// POST /api/chat — Send message to Gemini AI and get response
// ---------------------------------------------------------------------------
app.post('/api/chat', async (req, res) => {
  try {
    const { orderId, message, isFirstMessage } = req.body;

    if (!orderId || !message) {
      return res.status(400).json({ error: 'Missing orderId or message' });
    }

    console.log(`💬 Chat [Order #${orderId.slice(0, 8)}]: "${message}"`);

    // Get response from Gemini
    const aiResponse = await geminiService.handleMessage(orderId, message, isFirstMessage);

    console.log(`🤖 AI: "${aiResponse.message}"`);

    // If there's order data, update the order
    if (aiResponse.order) {
      const order = orderManager.updateOrder(orderId, {
        items: aiResponse.order.items,
        total: aiResponse.order.total,
        status: aiResponse.order.status === 'complete' ? 'complete' : 'in_progress'
      });

      if (order) {
        // Broadcast to kitchen displays
        if (aiResponse.order.status === 'complete') {
          io.emit('order:complete', order);
        } else {
          io.emit('order:update', order);
        }
      }
    }

    res.json({
      message: aiResponse.message,
      order: aiResponse.order
    });

  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

if (config.nodeEnv === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  });
}

// =============================================================================
// SOCKET.IO — Real-time kitchen display
// =============================================================================

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  socket.emit('orders:init', orderManager.getActiveOrders());

  socket.on('order:status', ({ orderId, kitchenStatus }) => {
    try {
      const order = orderManager.updateKitchenStatus(orderId, kitchenStatus);
      if (order) io.emit('order:update', order);
    } catch (err) {
      console.error('Socket error:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// =============================================================================
// START
// =============================================================================

server.listen(config.port, () => {
  console.log('');
  console.log('='.repeat(60));
  console.log('  🍔  thru.ai — Drive-Through AI (Gemini LLM)');
  console.log('='.repeat(60));
  console.log(`  Server:       http://localhost:${config.port}`);
  console.log(`  Gemini:       ${config.geminiApiKey ? '✅ API Key Set' : '❌ Not configured'}`);
  console.log(`  ElevenLabs:   ${config.elevenLabsApiKey ? '✅ TTS Ready' : '❌ Missing'}`);
  console.log(`  Customer:     http://localhost:${config.port}/`);
  console.log('='.repeat(60));
  console.log('');
});
