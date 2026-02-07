# =============================================================================
# frontend_server.py — Kitchen Display Backend for thru.ai
# =============================================================================
#
# WHAT THIS FILE DOES:
#   Runs a lightweight Flask web server that acts as the KITCHEN DISPLAY backend.
#   It receives real-time order updates from main.py (the AI engine) and exposes
#   REST API endpoints so a kitchen display UI can poll for the latest orders.
#
# HOW IT FITS IN THE ARCHITECTURE:
#
#   main.py (AI Engine)                    Kitchen Display (Browser/Screen)
#        │                                          │
#        │  POST /api/order                         │  GET /api/orders
#        │  (sends order JSON after each AI turn)   │  (fetches all orders)
#        ▼                                          ▼
#   ┌─────────────────────────────────────────────────────┐
#   │              frontend_server.py (Flask)              │
#   │                                                      │
#   │   • Receives order updates from AI engine            │
#   │   • Stores orders in memory (list)                   │
#   │   • Serves order data to kitchen display UI          │
#   │   • Prints order updates to console (for debugging)  │
#   └─────────────────────────────────────────────────────-┘
#
# WHY FLASK?
#   Flask is the simplest Python web framework — perfect for a hackathon prototype.
#   It runs in ~10 lines of code, requires minimal configuration, and is easy to debug.
#   For production, you'd upgrade to FastAPI (async) or add WebSocket support.
#
# ENDPOINTS:
#   POST /api/order          — Receive order update from AI engine
#   GET  /api/orders         — Get all orders (for kitchen display)
#   GET  /api/orders/latest  — Get most recent order only
#
# HOW TO RUN:
#   python frontend_server.py
#   → Starts on http://localhost:5000
#
# =============================================================================

from flask import Flask, request, jsonify  # Flask web framework
from flask_cors import CORS                # Cross-Origin Resource Sharing (allows browser access)
from datetime import datetime              # Timestamp each order update

# --- Flask App Initialisation ---
# Create the Flask application instance.
# __name__ tells Flask where to find templates/static files (standard convention).
app = Flask(__name__)

# Enable CORS (Cross-Origin Resource Sharing)
# This allows the kitchen display frontend (running on a different port/domain)
# to make API requests to this server. Without CORS, browsers block cross-origin requests.
CORS(app)

# --- In-Memory Order Storage ---
# For this prototype, we store orders in a simple Python list.
# Each item is a dict with order data + timestamp.
#
# IN PRODUCTION, you'd replace this with:
#   - Firebase/Firestore (real-time sync to kitchen displays)
#   - PostgreSQL/MySQL (persistent storage)
#   - Redis (fast in-memory with persistence)
#
# WARNING: This list resets when the server restarts. That's fine for a hackathon demo.
orders = []


# =============================================================================
# ENDPOINT: POST /api/order — Receive order updates from the AI engine
# =============================================================================

@app.route('/api/order', methods=['POST'])
def receive_order():
    """
    Receive an order update from main.py and store it.

    CALLED BY: main.py → send_to_frontend() after each AI conversation turn.

    REQUEST BODY (JSON):
      {
        "items": [
          {"name": "Cheeseburger", "quantity": 1, "price": 6.49, "modifiers": [], "size": null}
        ],
        "total": 6.49,
        "status": "in_progress"  // or "complete"
      }

    WHAT IT DOES:
      1. Parses the incoming JSON order data
      2. Adds a timestamp (so we know when each update arrived)
      3. Appends to the orders list
      4. Prints a formatted summary to the console (for debugging / demo)
      5. Returns a success response with the order's position in the list

    RESPONSE:
      {"success": true, "order_id": 1}  // order_id = position in list (1-indexed)
    """
    # Parse the JSON body from the request
    order_data = request.json

    # Add a timestamp so we can track when this order update was received.
    # ISO format: "2024-01-15T10:30:00.123456"
    order_data['timestamp'] = datetime.now().isoformat()

    # Store the order update in our in-memory list
    orders.append(order_data)

    # --- Console Output (Kitchen Display Debug View) ---
    # In a real kitchen display, this would update a UI.
    # For now, we print a formatted summary to the terminal.
    print("\n" + "=" * 50)
    print("📦 NEW ORDER UPDATE")
    print("=" * 50)
    print(f"Items: {len(order_data.get('items', []))}")
    print(f"Total: ${order_data.get('total', 0):.2f}")
    print(f"Status: {order_data.get('status', 'unknown')}")
    print(f"Full order: {order_data}")
    print("=" * 50 + "\n")

    # Return success with the order's list index as a simple ID
    return jsonify({"success": True, "order_id": len(orders)}), 200


# =============================================================================
# ENDPOINT: GET /api/orders — Retrieve ALL orders
# =============================================================================

@app.route('/api/orders', methods=['GET'])
def get_orders():
    """
    Return all stored orders as a JSON array.

    USED BY: Kitchen display UI to render all active/completed orders.

    In a real system, you'd add:
      - Pagination (don't return 10,000 orders at once)
      - Filtering by status (e.g., ?status=in_progress)
      - Sorting (newest first, oldest first)

    RESPONSE: [ {order1}, {order2}, ... ]
    """
    return jsonify(orders), 200


# =============================================================================
# ENDPOINT: GET /api/orders/latest — Retrieve only the most recent order
# =============================================================================

@app.route('/api/orders/latest', methods=['GET'])
def get_latest_order():
    """
    Return the most recent order update.

    USED BY: Kitchen display to quickly check the current order state
    without fetching the entire history.

    RESPONSE:
      200: The latest order object
      404: {"error": "No orders yet"} if no orders have been placed

    NOTE: This returns the latest UPDATE, not the latest unique order.
    Multiple updates for the same order (as items are added) all get stored.
    """
    if orders:
        return jsonify(orders[-1]), 200  # Last item in the list = most recent
    return jsonify({"error": "No orders yet"}), 404


# =============================================================================
# SERVER STARTUP
# =============================================================================

if __name__ == '__main__':
    # Print a startup banner with endpoint documentation
    print("\n🖥️  Frontend Server Starting...")
    print("Listening on http://localhost:5000")
    print("Endpoints:")
    print("  POST /api/order          - Receive order updates from AI engine")
    print("  GET  /api/orders         - Get all orders (for kitchen display)")
    print("  GET  /api/orders/latest  - Get latest order update")
    print("\n")

    # Start the Flask development server
    # - host='0.0.0.0': Listen on all network interfaces (not just localhost)
    #   This allows access from other devices on the same network (e.g., a tablet
    #   mounted in the kitchen running the display UI).
    # - port=5000: Default Flask port. Must match config.FRONTEND_URL in config.py.
    # - debug=True: Auto-reload on code changes + detailed error pages.
    #   DISABLE THIS IN PRODUCTION (security risk + performance hit).
    app.run(host='0.0.0.0', port=5000, debug=True)
