# Frontend - Drive Thru Kiosk Display

This folder contains all frontend files for the drive-thru kiosk display system.

## 📁 Folder Structure

```
frontend/
├── README.md                    # This file
├── kiosk-display.html          # Main kiosk display (responsive)
├── touch-interface.html        # Touch ordering interface (optional)
├── css/
│   └── style.css              # Styles for touch interface
├── js/
│   ├── kiosk-display.js       # Kiosk display logic
│   ├── app.js                 # Touch interface logic
│   └── menu-data.js           # Menu items data
└── images/
    └── (product images go here)
```

## 🖥️ Main Files

### **kiosk-display.html**
- The main display for the drive-thru kiosk
- Fully responsive (works on any screen size)
- Display-only (no touch interaction)
- Shows orders as they're built by AI voice system
- Access at: `http://localhost:3001/`

### **touch-interface.html**
- Optional touch-screen ordering interface
- Full manual ordering capability
- Shopping cart, menu browsing, checkout
- Access at: `http://localhost:3001/touch`

## 🎨 Styling

### **css/style.css**
- Styles for the touch interface
- McDonald's color scheme
- Responsive design

### **Kiosk Display Styles**
- Embedded in `kiosk-display.html`
- Uses viewport units (vw, vh)
- Fluid typography with clamp()
- Works on portrait and landscape

## 📜 JavaScript

### **kiosk-display.js**
- Polls backend every 1 second for order updates
- Displays items in real-time
- Handles welcome/active/complete screens
- Auto-reset after order completion

### **app.js**
- Touch interface logic
- Cart management
- Manual ordering flow
- API integration

### **menu-data.js**
- Menu items with prices
- Emoji icons for items
- Modifiers and sizes

## 🚀 Usage

### Access the Kiosk Display
```
http://localhost:3001/
```

### Access Touch Interface
```
http://localhost:3001/touch
```

## 🔧 Customization

### Change Menu Items
Edit `js/menu-data.js` to add/modify menu items.

### Change Colors
Edit the embedded `<style>` in `kiosk-display.html`:
- Primary Red: `#DA291C`
- Golden Yellow: `#FFC72C`
- Success Green: `#27AE60`

### Add Product Images
1. Place images in `images/` folder
2. Update menu data to reference image paths
3. Modify display templates to show images

### Adjust Polling Rate
Edit `js/kiosk-display.js`:
```javascript
const POLL_INTERVAL = 1000; // milliseconds
```

## 📡 API Integration

The kiosk display connects to these endpoints:

- **GET /api/orders/latest** - Get current order (polled every 1s)
- **POST /api/order** - Receive order updates from backend

## 🎯 Responsive Design

The display uses:
- **clamp()** for fluid typography
- **vh/vw** units for viewport-based sizing
- **Flexbox** for flexible layouts
- **Media queries** for mobile/landscape adjustments

Works perfectly on:
- Desktop monitors (any resolution)
- Portrait kiosk displays (1080x1920)
- Tablets and mobile devices
- Landscape displays

## 📱 Production Deployment

### For Kiosk Machine:
1. Set browser to fullscreen/kiosk mode
2. Auto-start on boot
3. Disable screensaver
4. Point to: `http://localhost:3001/`

### Fullscreen Command:
```bash
chromium-browser --kiosk --app=http://localhost:3001
```

## 🧪 Testing

Run test simulation:
```bash
cd ..
python3 tests/test_kiosk_display.py
```

## 📚 Documentation

Full documentation is in the `docs/` folder:
- `KIOSK_DISPLAY.md` - Technical documentation
- `DISPLAY_README.md` - Quick start guide
- `FRONTEND_GUIDE.md` - Frontend development guide

---

**Ready to use!** The frontend is fully functional and waiting for your backend integration.
