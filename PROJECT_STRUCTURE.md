# 📂 Project Structure

Clean, organized folder structure for the Drive-Thru AI Kiosk System.

## 🗂️ Complete Structure

```
thru.ai/
│
├── 📄 README.md                      # Main project documentation
├── 📄 PROJECT_STRUCTURE.md           # This file
├── 📄 requirements.txt               # Python dependencies
│
├── 🐍 Backend (Python)
│   ├── main.py                       # AI voice ordering system
│   ├── frontend_server.py            # Flask API server
│   ├── config.py                     # Configuration settings
│   └── menu.json                     # Menu data
│
├── 🎨 frontend/                      # All frontend files
│   ├── README.md                     # Frontend documentation
│   ├── kiosk-display.html           # Main kiosk display ⭐
│   ├── touch-interface.html         # Touch ordering UI
│   ├── css/
│   │   └── style.css                # Touch interface styles
│   ├── js/
│   │   ├── kiosk-display.js        # Kiosk display logic ⭐
│   │   ├── app.js                   # Touch interface logic
│   │   └── menu-data.js             # Menu items data
│   └── images/
│       └── (product images)
│
├── 📚 docs/                          # Documentation
│   ├── KIOSK_DISPLAY.md             # Kiosk display technical docs
│   ├── DISPLAY_README.md            # Quick start guide
│   ├── FRONTEND_GUIDE.md            # Frontend development
│   ├── QUICKSTART.md                # Getting started
│   └── TESTING_CHECKLIST.md         # Testing guide
│
└── 🧪 tests/                         # Test scripts
    ├── test_kiosk_display.py        # Kiosk display simulation ⭐
    └── demo_test.py                 # API testing
```

## ⭐ Key Files

### Primary Kiosk Display
- **`frontend/kiosk-display.html`** - The main display interface
- **`frontend/js/kiosk-display.js`** - Display logic and API polling

### Backend
- **`frontend_server.py`** - Flask server (runs on port 3001)
- **`main.py`** - AI voice system (to be integrated later)

### Testing
- **`tests/test_kiosk_display.py`** - Drive-thru order simulation

## 🚀 Quick Start

```bash
# 1. Start the server
python3 frontend_server.py

# 2. Open kiosk display
# http://localhost:3001/

# 3. Run test simulation
python3 tests/test_kiosk_display.py
```

## 📁 Folder Purposes

### `/frontend/`
All HTML, CSS, and JavaScript files for the user interface.
- **Kiosk display** - Main drive-thru screen (display-only)
- **Touch interface** - Optional manual ordering UI

### `/docs/`
All documentation and guides.
- Setup guides
- Technical documentation
- Testing procedures

### `/tests/`
Test scripts and simulations.
- Kiosk display testing
- API endpoint testing
- Integration tests

### Root Directory
Core backend files and configuration.
- Python backend code
- Configuration files
- Dependencies

## 🔄 File Relationships

```
User Pulls Up
     ↓
Camera Detects (backend - to be built)
     ↓
AI Conversation (main.py - to be built)
     ↓
POST /api/order (frontend_server.py)
     ↓
Kiosk Display Polls (kiosk-display.js)
     ↓
Display Shows Items (kiosk-display.html)
```

## 🎯 What's Done vs. To-Do

### ✅ Complete
- [x] Kiosk display interface (responsive)
- [x] Flask API server
- [x] API endpoints
- [x] Real-time polling system
- [x] Test scripts
- [x] Documentation
- [x] Organized folder structure

### ⏳ To Build (Backend)
- [ ] Camera detection system
- [ ] Speech-to-text (Whisper)
- [ ] AI conversation (Claude/Anthropic)
- [ ] Text-to-speech (ElevenLabs)
- [ ] Order processing logic
- [ ] Integration with display

## 📝 Development Workflow

1. **Frontend changes**: Edit files in `frontend/`
2. **Backend changes**: Edit `main.py` or `frontend_server.py`
3. **Documentation**: Update files in `docs/`
4. **Testing**: Run scripts in `tests/`

## 🌐 URLs

- **Kiosk Display**: http://localhost:3001/
- **Touch Interface**: http://localhost:3001/touch
- **API Orders**: http://localhost:3001/api/orders/latest

## 📦 Dependencies

Install all dependencies:
```bash
pip3 install -r requirements.txt
```

Required for frontend server:
- flask
- flask-cors

Required for AI backend (when building):
- anthropic
- elevenlabs
- faster-whisper
- sounddevice
- scipy
- numpy

## 🔧 Configuration

Edit `config.py` for:
- API keys (Anthropic, ElevenLabs)
- Server port (default: 3001)
- Model settings
- Audio settings

## 📊 File Sizes

- Frontend HTML: ~11KB (kiosk-display.html)
- Frontend JS: ~5KB (kiosk-display.js)
- Documentation: ~50KB total
- Backend: ~12KB (main.py + frontend_server.py)

---

**Everything is organized and ready!** 🎉

The frontend is complete and the backend is ready to be built.
