# Testing Checklist ✅

Use this checklist to verify everything works correctly.

## Prerequisites

- [ ] Python 3.8+ installed
- [ ] All dependencies installed (`pip install -r requirements.txt`)
- [ ] Flask server can start without errors

## Frontend Tests

### 1. Server Startup
- [ ] Run `python frontend_server.py`
- [ ] Server starts on http://localhost:3001
- [ ] No error messages in terminal

### 2. Welcome Screen
- [ ] Open http://localhost:3001 in browser
- [ ] See golden/red gradient background
- [ ] See "BURGER EXPRESS" logo with "B" icon
- [ ] See burger and fries emojis
- [ ] See "Touch to Order" button
- [ ] Button has pulse animation

### 3. Menu Screen
- [ ] Click "Touch to Order"
- [ ] Transitions to menu screen
- [ ] Red header appears with logo
- [ ] Category tabs visible (All, Burgers, Combos, Sides, Drinks)
- [ ] Menu grid shows items with icons
- [ ] Order summary sidebar on right shows "No items yet"
- [ ] Cart count shows "0"

### 4. Menu Browsing
- [ ] Click each category tab
- [ ] Items filter correctly
- [ ] All category shows all items
- [ ] Burgers category shows only burgers
- [ ] Each item shows: icon, name, description, price
- [ ] "Add to Order" button on each item

### 5. Adding Items
- [ ] Click "Add to Order" on a burger
- [ ] Item appears in order summary on right
- [ ] Cart count increases
- [ ] Subtotal updates
- [ ] Tax calculates (8%)
- [ ] Grand total shows correct amount
- [ ] Green notification appears briefly

### 6. Items with Sizes
- [ ] Click "Add to Order" on Fries
- [ ] Prompt appears asking for size
- [ ] Enter "medium"
- [ ] Item added with correct size and price
- [ ] Try "small" and "large" - both work

### 7. Quantity Management
- [ ] Item shows quantity controls (-, number, +)
- [ ] Click + button, quantity increases
- [ ] Price multiplies correctly
- [ ] Click - button, quantity decreases
- [ ] Click - on quantity 1, item removes from cart
- [ ] Cart count updates correctly

### 8. Order Summary
- [ ] Multiple items show correctly
- [ ] Subtotal adds all items
- [ ] Tax calculates at 8%
- [ ] Grand total = subtotal + tax
- [ ] "Complete Order" button enabled when items exist
- [ ] "Complete Order" button disabled when cart empty

### 9. Checkout
- [ ] Click "Complete Order"
- [ ] Transitions to green checkout screen
- [ ] Shows ✅ success icon
- [ ] Shows "Order Confirmed!"
- [ ] Shows order number (random 4-digit)
- [ ] Shows final order summary
- [ ] Shows final total
- [ ] "Start New Order" button visible

### 10. New Order
- [ ] Click "Start New Order"
- [ ] Returns to welcome screen
- [ ] Cart resets to 0
- [ ] Order summary clears
- [ ] Can start ordering again

### 11. Navigation
- [ ] Click "Back" button on menu screen
- [ ] Returns to welcome screen
- [ ] Order resets
- [ ] Click cart icon
- [ ] Scrolls to order summary

## Backend Integration Tests

### 12. API Endpoints
- [ ] Run test: `python demo_test.py`
- [ ] Order sent successfully
- [ ] Server logs show order received
- [ ] Browser shows order in AI Assistant screen
- [ ] Order items display correctly
- [ ] Total displays correctly

### 13. Manual API Test
Open new terminal and test endpoints:

```bash
# Test latest order endpoint
curl http://localhost:3001/api/orders/latest

# Should return: {"error": "No orders yet"} or latest order JSON
```

- [ ] API responds correctly
- [ ] CORS headers present (no errors in browser console)

### 14. AI Voice Integration (if available)
- [ ] API keys configured in config.py
- [ ] Run `python main.py` in separate terminal
- [ ] Speak an order
- [ ] Kiosk switches to AI Assistant screen
- [ ] Items appear as spoken
- [ ] Total updates in real-time
- [ ] Status shows "Processing your order..."
- [ ] When complete, status shows "Order Complete!"
- [ ] Auto-redirects to checkout after 3 seconds

## Browser Compatibility

Test on different browsers:
- [ ] Chrome/Edge - Works perfectly
- [ ] Firefox - Works perfectly
- [ ] Safari - Works perfectly

## Responsive Design

Test on different screen sizes:
- [ ] Desktop (1920x1080) - Full layout with sidebar
- [ ] Laptop (1366x768) - Comfortable layout
- [ ] Tablet (768x1024) - Adapts correctly
- [ ] Mobile (375x667) - Order summary hides, core functions work

## Performance

- [ ] Page loads in < 1 second
- [ ] Transitions smooth (no lag)
- [ ] Animations run at 60fps
- [ ] No console errors
- [ ] No 404 errors for resources

## Visual Polish

- [ ] Colors match McDonald's theme (red #DA291C, gold #FFC72C)
- [ ] Fonts are readable
- [ ] Spacing looks professional
- [ ] Hover effects work on buttons
- [ ] Shadows and depth look good
- [ ] Emoji icons display correctly

## Edge Cases

- [ ] Add 10+ items - still displays correctly
- [ ] Add item, remove all items - checkout button disables
- [ ] Refresh page - starts fresh (no persistence)
- [ ] Close browser, reopen - starts at welcome screen
- [ ] Backend not running - manual ordering still works
- [ ] Backend running but no AI - polling doesn't break UI

## Known Limitations

Note any issues found:
- Order data not persisted (in-memory only)
- No user authentication
- No payment processing
- Images are emojis (not real photos)
- No printer integration
- No receipt generation

## Production Readiness

For production deployment, need:
- [ ] Database for order persistence
- [ ] Payment gateway integration
- [ ] Real product images
- [ ] Receipt printing
- [ ] Kitchen display system
- [ ] Analytics/reporting
- [ ] Admin dashboard
- [ ] Error logging
- [ ] HTTPS/SSL
- [ ] Load balancing

---

## Quick Test Summary

Minimum viable test (2 minutes):
1. Start server
2. Open http://localhost:3001
3. Click "Touch to Order"
4. Add burger, fries, drink
5. Adjust quantity
6. Complete order
7. Start new order

If all works ✅ - Ship it!
