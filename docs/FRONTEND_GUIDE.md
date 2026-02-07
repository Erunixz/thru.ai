# Burger Express Kiosk Frontend

A McDonald's-style drive-thru kiosk interface that connects to the AI voice ordering system.

## Features

✅ **Beautiful Touch-Screen Interface**
- McDonald's-inspired design with golden arches aesthetic
- Responsive menu grid with emoji icons
- Real-time order summary sidebar
- Smooth animations and transitions

✅ **Dual Ordering Modes**
- **Manual Mode**: Touch-screen ordering like a McDonald's kiosk
- **AI Voice Mode**: Live updates from the voice AI assistant

✅ **Real-Time Integration**
- Polls backend every 2 seconds for AI order updates
- Auto-switches to AI assistant screen when voice orders come in
- Displays live order status and totals

✅ **Complete Order Flow**
1. Welcome screen with "Touch to Order" button
2. Menu browsing with category filters (Burgers, Combos, Sides, Drinks)
3. Cart management with quantity controls
4. Order confirmation screen

## Quick Start

### 1. Start the Frontend Server

```bash
python frontend_server.py
```

The server will start on http://localhost:3001

### 2. Open the Kiosk Interface

Open your browser and navigate to:
```
http://localhost:3001
```

### 3. Start the AI Voice System (Optional)

In a separate terminal:
```bash
python main.py
```

This will start the voice AI drive-thru assistant. Any orders taken via voice will automatically appear on the kiosk screen!

## How It Works

### Manual Ordering
1. Click "Touch to Order" on the welcome screen
2. Browse menu items by category
3. Click "Add to Order" on any item
4. Adjust quantities in the order summary sidebar
5. Click "Complete Order" to checkout

### AI Voice Ordering
1. Start the AI system with `python main.py`
2. The kiosk will automatically switch to "AI Assistant" mode when voice orders come in
3. Watch as items are added in real-time as the customer speaks
4. Order completes automatically when customer confirms

### API Endpoints

The frontend connects to these backend endpoints:

- `POST /api/order` - Receive order updates from AI
- `GET /api/orders` - Get all orders
- `GET /api/orders/latest` - Get most recent order (polled every 2 seconds)

## File Structure

```
thru.ai/
├── frontend_server.py          # Flask backend server
├── main.py                      # AI voice ordering system
├── menu.json                    # Menu data
├── static/
│   ├── index.html              # Main kiosk interface
│   ├── css/
│   │   └── style.css           # McDonald's-style styling
│   └── js/
│       ├── menu-data.js        # Menu items with icons
│       └── app.js              # Application logic & API integration
```

## Customization

### Change Colors
Edit `static/css/style.css`:
- Primary red: `#DA291C`
- Golden yellow: `#FFC72C`
- Success green: `#27AE60`

### Add Menu Items
Edit `static/js/menu-data.js` to add new items with:
- name
- price
- icon (emoji)
- description
- category

### Adjust Polling Rate
In `static/js/app.js`, change the interval:
```javascript
pollInterval = setInterval(() => {
    // ...
}, 2000); // 2000ms = 2 seconds
```

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge (recommended for kiosk mode)
- Firefox
- Safari

## Kiosk Mode (Fullscreen)

For a true kiosk experience, press F11 in Chrome to enter fullscreen mode.

## Troubleshooting

**Q: Frontend shows "No orders yet"**
A: This is normal if the AI voice system isn't running. Orders will appear when voice orders are taken.

**Q: Can't connect to backend**
A: Make sure `frontend_server.py` is running on port 5000.

**Q: CORS errors**
A: Make sure Flask-CORS is installed: `pip install flask-cors`

## Demo Flow

1. Customer sees welcome screen with burgers and fries
2. Customer taps "Touch to Order"
3. Menu appears with categories
4. Customer adds items (burgers, fries, drinks)
5. Order summary updates in real-time
6. Customer reviews order and taps "Complete Order"
7. Success screen shows order number
8. Customer can start new order

---

Made with ❤️ for drive-thru AI automation
