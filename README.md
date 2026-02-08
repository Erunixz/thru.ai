# thru.ai 🍔🎤

AI-powered drive-through ordering system using ElevenLabs Conversational AI, Node.js, and React.

## Overview

thru.ai is a complete drive-through ordering solution featuring real-time voice AI ordering, a modern touch-screen kiosk interface, and a kitchen display system. Built with ElevenLabs' Conversational AI Agent for natural voice interactions and a React-based frontend for a beautiful ordering experience.

## Features

✅ **Voice AI Ordering** - Natural voice conversations powered by ElevenLabs Conversational AI
✅ **Modern Kiosk Interface** - React-based touch-screen ordering interface
✅ **Real-Time Order Management** - Live order tracking and updates
✅ **Kitchen Display System** - Dedicated display for order fulfillment
✅ **Dual Mode** - Manual touch ordering OR AI voice ordering

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
├── server/              # Express.js backend
│   ├── index.js         # Main server file
│   ├── config.js        # Server configuration
│   ├── services/        # Business logic services
│   └── utils/           # Utility functions
├── client/              # React frontend
│   ├── src/             # React source code
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

### Kiosk Interface
1. Open http://localhost:5173 in a browser
2. Click "Start Order" for manual ordering
3. Browse menu by category
4. Add items to cart
5. Complete your order

### Voice Ordering
1. Ensure your ElevenLabs Conversational AI Agent is configured
2. Use the voice interface to speak your order
3. The AI will process your order and provide confirmation
4. Orders appear live on the kiosk display

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
- **Real-time:** WebSocket (Socket.io)

## Support

For issues or questions:
- Check the ElevenLabs documentation: https://elevenlabs.io/docs
- Review server logs for error messages
- Ensure all environment variables are set correctly

## License

MIT

