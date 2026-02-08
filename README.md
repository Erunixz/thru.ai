# thru.ai 🍔🎤

AI-powered drive-through ordering system using ElevenLabs Conversational AI, Node.js, and React.

## Overview

thru.ai is a complete drive-through ordering solution featuring real-time voice AI ordering, a modern touch-screen kiosk interface, and a kitchen display system. Built with ElevenLabs' Conversational AI Agent for natural voice interactions and a React-based frontend for a beautiful ordering experience.

## Features

### 🎤 Voice AI Ordering
- Natural voice conversations powered by ElevenLabs Conversational AI
- Real-time speech-to-speech with automatic order processing
- Supports modifications, sizes, and special requests

### 📹 Camera-Based Auto-Start
- Automatically detects when a customer approaches using TensorFlow.js and COCO-SSD
- Auto-starts voice conversation after 1 second
- Auto-stops conversation 3.5 seconds after customer leaves
- Performance-based FPS auto-tuning (1-5 FPS)
- Graceful fallback to manual mode if camera unavailable
- Smooth return to welcome screen on conversation end (no page refresh needed)

### 🔊 Minimal Sound Effects
- Modern UI sound effects using Web Audio API (no audio files required)
- Welcome chime when conversation starts
- Confirmation beep when items are added to order
- Success sound on order completion
- Goodbye tone when conversation ends
- Subtle and non-intrusive (30% volume)
- Automatically initializes on first user interaction

### 🖥️ Modern Kiosk Interface
- React-based touch-screen ordering interface
- Real-time order updates and live totals
- Displays menu items, prices, and modifiers
- Optimized layout - all menu items visible on one page
- Manual "Start Order" button as backup

### 👨‍🍳 Kitchen Display System
- Dedicated employee-facing order management at `/kitchen`
- Four-column Kanban layout: New → Preparing → Ready → Completed
- Real-time order updates via Socket.IO
- Live timer showing order age with color coding (green/yellow/red)
- One-click status advancement buttons
- Order modifiers and customizations clearly displayed (70% opacity)
- Delete button with 5-second undo window
- Auto-hide completed orders after 1 hour
- Syncs across all connected kitchen displays

### ⚡ Real-Time Updates
- Socket.IO for instant order synchronization
- Live order tracking across kiosk and kitchen displays
- Real-time status changes broadcast to all clients

## Architecture

**Backend:**
- Node.js + Express.js server
- ElevenLabs Conversational AI Agent integration
- WebSocket support for real-time updates
- Order management and tracking

**Frontend:**
- React + Vite
- Tailwind CSS for styling
- Responsive kiosk and kitchen displays

**AI:**
- ElevenLabs Conversational AI Agent for voice interactions
- Natural language order processing
- Real-time speech-to-speech conversation

**Computer Vision:**
- TensorFlow.js with COCO-SSD model for real-time person detection
- Automatic camera-based customer detection to trigger voice ordering
- Adaptive FPS with performance-based auto-tuning

## Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 2. Configure Environment Variables

Copy the example environment file and add your ElevenLabs credentials:

```bash
cp .env.example .env
```

Edit `.env` and set:
- `ELEVENLABS_API_KEY` - Your ElevenLabs API key
- `ELEVENLABS_AGENT_ID` - Your Conversational AI Agent ID
- `ELEVENLABS_VOICE_ID` - Voice ID for TTS (optional, defaults to Rachel)
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment mode (development/production)

**Get your ElevenLabs credentials:**
- Sign up at https://elevenlabs.io/
- Create a Conversational AI Agent
- Copy your API key and Agent ID

### 3. Build the Client

```bash
npm run build
```

This builds the React frontend and places the production files in `/client/dist/`.

### 4. Start the Server

```bash
npm start
```

The server will start on http://localhost:3001 (or your configured PORT).

## Development

For development with hot reload:

```bash
npm run dev
```

This runs both the Express server and the Vite dev server concurrently with automatic reloading.

**Development URLs:**
- Frontend (Vite dev server): http://localhost:5173
- Backend API: http://localhost:3001

## Project Structure

```
/thru.ai/
├── server/                        # Express.js backend
│   ├── index.js                   # Main server + Socket.IO setup
│   ├── config.js                  # Server configuration
│   ├── services/
│   │   ├── orderManager.js        # Order state management + kitchen status
│   │   └── menuService.js         # ElevenLabs menu synchronization
│   └── utils/                     # Utility functions
├── client/                        # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── CustomerKiosk.jsx  # Customer ordering interface
│   │   │   └── KitchenDisplay.jsx # Kitchen order management system
│   │   ├── components/
│   │   │   ├── OrderPanel.jsx              # Order summary display
│   │   │   ├── MenuDisplay.jsx             # Menu items grid
│   │   │   ├── DetectionStatusIndicator.jsx # Camera detection status
│   │   │   └── CameraPreview.jsx           # Optional camera preview
│   │   ├── hooks/
│   │   │   └── usePersonDetection.js       # TensorFlow.js person detection
│   │   └── utils/
│   │       └── personDetectionHelper.js    # Detection config & helpers
│   ├── public/          # Static assets
│   ├── dist/            # Built frontend (generated)
│   ├── index.html       # Entry HTML
│   ├── vite.config.js   # Vite configuration
│   └── package.json     # Client dependencies
├── menu.json            # Menu data
├── .env                 # Environment variables (not in git)
├── .env.example         # Environment variables template
├── package.json         # Root project configuration
└── README.md            # This file
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ELEVENLABS_API_KEY` | Your ElevenLabs API key | Yes |
| `ELEVENLABS_AGENT_ID` | Your Conversational AI Agent ID | Yes |
| `ELEVENLABS_VOICE_ID` | Voice ID for TTS responses | No |
| `PORT` | Server port number | No (default: 3001) |
| `NODE_ENV` | Environment mode | No (default: development) |

## Usage

### Customer Kiosk Interface
**URL:** http://localhost:3001 (or http://localhost:5173 in development)

**Auto-Detection Mode:**
1. Grant camera permissions when prompted
2. Approach the kiosk - voice conversation starts automatically after 1 second (welcome chime plays)
3. Speak your order naturally (e.g., "I'd like a cheeseburger with no pickles and a medium Coke")
4. AI confirms items and modifications (confirmation beep on each item)
5. Complete your order (success sound plays)
6. Move away - conversation ends automatically after 3.5 seconds (goodbye tone plays)

**Manual Mode:**
1. Click "Start Order" button
2. Speak or type your order
3. View order summary on the right panel
4. Click "End Conversation" when done

**Camera Detection Settings:**
- Toggle auto-detection on/off via status indicator
- Optional camera preview (click "Show Camera Preview" button)
- Detection runs at 3 FPS by default (auto-adjusts for performance)

### Kitchen Display System
**URL:** http://localhost:3001/kitchen

**Order Management:**
1. New orders appear in the "New Orders" column automatically
2. Click "Start Preparing" to move order to "Preparing" column
3. Click "Mark Ready" when food is ready
4. Click "Complete" to finish the order
5. Completed orders auto-hide after 1 hour

**Order Cards Show:**
- Order number (e.g., #001, #002)
- All items with quantities and prices
- **Modifiers** (no pickles, extra cheese, etc.) - displayed with reduced opacity
- Size information (for drinks)
- Order total
- Live timer with color coding:
  - 🟢 Green: < 3 minutes
  - 🟡 Yellow: 3-5 minutes
  - 🔴 Red: > 5 minutes

**Delete Orders:**
1. Click trash icon on any order card
2. Order removed immediately with 5-second undo window
3. Toast appears: "Order deleted - will be permanently deleted in 5 seconds"
4. Click "Undo" to restore if accidental
5. After 5 seconds, order permanently deleted

**Multi-Display Support:**
- Open multiple kitchen displays on different devices
- All displays sync in real-time via Socket.IO
- Status changes broadcast instantly

## API Endpoints

### Customer/Kiosk Endpoints
- `GET /api/agent/signed-url` - Get ElevenLabs agent session URL
- `POST /api/orders/update` - Update order from AI agent
- `GET /api/orders` - Get all active orders
- `GET /api/menu` - Get menu data

### Kitchen Display Endpoints
- `GET /api/kitchen/orders` - Get all kitchen orders
- `POST /api/kitchen/status` - Update order kitchen status
  - Body: `{ orderId, kitchenStatus: 'new'|'preparing'|'ready'|'completed' }`
- `DELETE /api/kitchen/order/:orderId` - Delete an order
- `POST /api/kitchen/restore` - Restore a deleted order
  - Body: `{ order: {...} }`

### Admin Endpoints
- `POST /api/admin/refresh-menu` - Sync menu to ElevenLabs agent

### Socket.IO Events
**Emitted by server:**
- `orders:init` - Initial orders on connect
- `kitchen:init` - Initial kitchen orders
- `order:new` - New order created
- `order:update` - Order items/total updated
- `order:complete` - Order marked complete
- `kitchen:status` - Kitchen status changed
- `kitchen:delete` - Order deleted
- `kitchen:restore` - Order restored

## Menu Configuration

Edit `menu.json` to customize your menu:
- Add/remove categories
- Update items, prices, and descriptions
- Configure item options and customizations

The menu structure supports:
- Categories (Burgers, Combos, Sides, Drinks, etc.)
- Items with prices and descriptions
- Customization options

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development mode with hot reload |
| `npm run build` | Build React frontend for production |
| `npm run preview` | Preview production build locally |

## Tech Stack

- **Runtime:** Node.js
- **Backend:** Express.js
- **Frontend:** React, Vite
- **Styling:** Tailwind CSS
- **AI:** ElevenLabs Conversational AI Agent
- **Computer Vision:** TensorFlow.js, COCO-SSD
- **Real-time:** WebSocket (Socket.io)

## Support

For issues or questions:
- Check the ElevenLabs documentation: https://elevenlabs.io/docs
- Review server logs for error messages
- Ensure all environment variables are set correctly

## License

MIT

