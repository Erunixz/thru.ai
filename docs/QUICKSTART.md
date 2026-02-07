# Quick Start Guide 🚀

Get the McDonald's-style drive-thru kiosk running in 3 minutes!

## Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

## Step 2: Start the Server

```bash
python frontend_server.py
```

You should see:
```
🖥️  Frontend Server Starting...
Listening on http://localhost:3001
```

## Step 3: Open the Kiosk

Open your browser to:
```
http://localhost:3001
```

You should see the beautiful welcome screen with the "Touch to Order" button!

## Step 4: Try Manual Ordering

1. Click "Touch to Order"
2. Browse the menu
3. Click "Add to Order" on items
4. Watch your order summary update on the right
5. Click "Complete Order" when done

## Step 5: Test the Integration (Optional)

In a new terminal, run the test script:

```bash
python demo_test.py
```

This will send a test order to the kiosk and you'll see it appear on screen!

## Step 6: Try Voice AI (Optional)

If you have a microphone and GPU:

1. Configure your API keys in `config.py`:
   - Anthropic API key
   - ElevenLabs API key

2. Start the AI voice system:
   ```bash
   python main.py
   ```

3. Speak your order

4. Watch it appear LIVE on the kiosk screen!

## Troubleshooting

**Q: Port 3001 already in use?**

Edit `frontend_server.py` and change:
```python
app.run(host='0.0.0.0', port=3002, debug=True)
```

Also update `config.py` and `static/js/app.js`:
```python
FRONTEND_URL = "http://localhost:3002/api/order"
```

**Q: Can't see the kiosk interface?**

Check that these files exist:
- `static/index.html`
- `static/css/style.css`
- `static/js/app.js`
- `static/js/menu-data.js`

**Q: Getting CORS errors?**

Make sure Flask-CORS is installed:
```bash
pip install flask-cors
```

## What's Next?

- Customize the menu in `static/js/menu-data.js`
- Change colors in `static/css/style.css`
- Add real product images to `static/images/`
- Connect to a real payment system
- Deploy to production!

## Demo Flow

### Manual Mode:
1. Welcome screen → Touch to Order
2. Menu screen → Browse & Add Items
3. Cart → Adjust Quantities
4. Checkout → Order Confirmed

### AI Voice Mode:
1. Customer speaks at drive-thru
2. Kiosk auto-switches to AI Assistant screen
3. Live order updates appear
4. Auto-checkout when complete

Enjoy! 🍔🎉
