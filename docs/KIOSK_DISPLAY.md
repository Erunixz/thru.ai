# Kiosk Display - Drive Thru Screen

A **display-only** interface optimized for 1080x1920 portrait kiosk screens. This is what customers see at the drive-thru as they order.

## 🖥️ Display Specifications

- **Resolution**: 1080 x 1920 (Portrait)
- **Orientation**: Vertical
- **Interaction**: None (Display only)
- **Purpose**: Show order items as AI voice assistant builds the order

## 🎯 How It Works

1. **Customer pulls up** → Display shows welcome screen
2. **Camera detects customer** → Backend signals to start listening
3. **AI asks "What would you like?"** → Via speakers
4. **Customer speaks order** → "I'll have a cheeseburger and fries"
5. **Items appear on display** → Shows items as they're added
6. **Order completes** → Shows completion screen
7. **Display resets** → Back to welcome screen for next customer

## 📺 Display Screens

### 1. Welcome Screen (Idle)
```
┌─────────────────────┐
│   🍔 BURGER EXPRESS │
│                     │
│    Welcome to       │
│    Drive-Thru       │
│                     │
│  Pull up and we'll  │
│  take your order!   │
└─────────────────────┘
```

### 2. Active Order Screen
```
┌─────────────────────┐
│   YOUR ORDER        │
│ Listening...        │
├─────────────────────┤
│ Cheeseburger   ×1  │
│ 📝 no pickles      │
│         $6.49      │
├─────────────────────┤
│ Fries (Medium) ×1  │
│         $3.49      │
├─────────────────────┤
│ Subtotal    $9.98  │
│ Tax         $0.80  │
│ TOTAL      $10.78  │
└─────────────────────┘
```

### 3. Completion Screen
```
┌─────────────────────┐
│                     │
│        ✅          │
│                     │
│  Order Complete!    │
│                     │
│  Please pull        │
│  forward            │
│                     │
└─────────────────────┘
```

## 🚀 Running the Display

### Start the Server
```bash
python3 frontend_server.py
```

### Access the Display
Open browser to: **http://localhost:3001**

The display will fill the entire 1080x1920 screen.

### Fullscreen Mode (Kiosk)
Press **F11** in Chrome to enter fullscreen kiosk mode.

## 🔄 How It Receives Orders

The display **polls** the backend every 1 second:
```javascript
GET http://localhost:3001/api/orders/latest
```

When the backend receives an order update from the AI voice system, it returns the current order state:

```json
{
  "items": [
    {
      "name": "Cheeseburger",
      "quantity": 1,
      "price": 6.49,
      "modifiers": ["no pickles"],
      "size": null
    }
  ],
  "total": 10.78,
  "status": "in_progress"
}
```

The display automatically updates to show the items.

## 🎨 Display Features

### Real-Time Updates
- Polls backend every **1 second**
- Items appear immediately as added
- Smooth animations when items added

### Visual Feedback
- **Green status dot** - System ready
- **Yellow status** - Taking order
- **Green checkmark** - Order complete

### Auto-Reset
- Shows completion screen for **5 seconds**
- Automatically returns to welcome screen
- Ready for next customer

### Large Typography
- Item names: **48px**
- Prices: **52px**
- Total: **72px**
- Optimized for visibility from car

## 🛠️ Testing the Display

### Test with Demo Script
```bash
# Terminal 1: Server running
python3 frontend_server.py

# Terminal 2: Send test order
python3 demo_test.py
```

You'll see the items appear on the display!

### Test with curl
```bash
# Send a test order
curl -X POST http://localhost:3001/api/order \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "name": "Cheeseburger",
        "quantity": 2,
        "price": 6.49,
        "modifiers": ["no pickles"]
      }
    ],
    "total": 12.98,
    "status": "in_progress"
  }'
```

The display will immediately show the order!

## 🎯 Production Deployment

### Hardware Requirements
- **Screen**: 1080x1920 portrait LCD/LED display
- **Computer**: Any device that can run Chrome
- **Network**: Connected to backend server
- **Mount**: Weatherproof outdoor kiosk enclosure

### Browser Setup (Kiosk Mode)
1. Install Chrome on kiosk computer
2. Create startup script:
   ```bash
   chromium-browser --kiosk --app=http://localhost:3001
   ```
3. Auto-start browser on boot
4. Disable sleep/screensaver

### Network Configuration
- Display connects to same network as backend
- If backend is on different machine, update API URL in `kiosk-display.js`:
  ```javascript
  const API_BASE_URL = 'http://192.168.1.100:3001';
  ```

## 📝 Customization

### Change Poll Interval
Edit `static/js/kiosk-display.js`:
```javascript
const POLL_INTERVAL = 1000; // milliseconds (1000 = 1 second)
```

### Change Completion Display Time
```javascript
const COMPLETION_DISPLAY_TIME = 5000; // milliseconds (5000 = 5 seconds)
```

### Change Colors
Edit `static/kiosk-display.html` `<style>` section:
- Primary Red: `#DA291C`
- Golden Yellow: `#FFC72C`
- Success Green: `#27AE60`

### Add Branding
Replace the logo section in HTML:
```html
<div class="logo-circle">B</div>
<div class="logo-text">BURGER EXPRESS</div>
```

## 🔧 Troubleshooting

**Q: Display shows "Ready" but no orders appear**
A: Backend is not sending orders. Check that your AI voice system is running and posting to `/api/order`

**Q: Items appear delayed**
A: Reduce `POLL_INTERVAL` in `kiosk-display.js` (currently 1 second)

**Q: Display doesn't fit screen**
A: Ensure browser zoom is at 100% and screen resolution is 1080x1920

**Q: Browser shows scrollbars**
A: Press F11 for fullscreen or use `--kiosk` mode in Chrome

## 🎬 Backend Integration (Later)

Your backend will need to:
1. **Detect customer** (camera/sensor)
2. **Start AI conversation** (Anthropic)
3. **Convert speech to text** (Whisper)
4. **Process with AI** (Claude)
5. **Speak response** (ElevenLabs)
6. **Update order** → `POST /api/order` (this display receives it!)
7. **Mark complete** → Status: "complete"

The display is **ready** and waiting for your backend! 🎯

---

**Next Step**: Build the backend that sends orders to this display!
