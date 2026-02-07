# frontend_server.py
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime
import os

app = Flask(__name__, static_folder='frontend')
CORS(app)

# Store orders in memory (in production, use database)
orders = []

@app.route('/api/order', methods=['POST'])
def receive_order():
    """Receive order updates from AI"""
    order_data = request.json
    
    # Add timestamp
    order_data['timestamp'] = datetime.now().isoformat()
    
    # Store order
    orders.append(order_data)
    
    # Print to console (in production, update UI)
    print("\n" + "="*50)
    print("📦 NEW ORDER UPDATE")
    print("="*50)
    print(f"Items: {len(order_data.get('items', []))}")
    print(f"Total: ${order_data.get('total', 0):.2f}")
    print(f"Status: {order_data.get('status', 'unknown')}")
    print(f"Full order: {order_data}")
    print("="*50 + "\n")
    
    return jsonify({"success": True, "order_id": len(orders)}), 200

@app.route('/api/orders', methods=['GET'])
def get_orders():
    """Get all orders"""
    return jsonify(orders), 200

@app.route('/api/orders/latest', methods=['GET'])
def get_latest_order():
    """Get most recent order"""
    if orders:
        return jsonify(orders[-1]), 200
    return jsonify({"error": "No orders yet"}), 404

@app.route('/')
def index():
    """Serve the kiosk display (portrait responsive)"""
    return send_from_directory('frontend', 'kiosk-display.html')

@app.route('/touch')
def touch_interface():
    """Serve the touch ordering interface (if needed)"""
    return send_from_directory('frontend', 'touch-interface.html')

@app.route('/css/<path:path>')
def send_css(path):
    """Serve CSS files"""
    return send_from_directory('frontend/css', path)

@app.route('/js/<path:path>')
def send_js(path):
    """Serve JavaScript files"""
    return send_from_directory('frontend/js', path)

@app.route('/images/<path:path>')
def send_images(path):
    """Serve image files"""
    return send_from_directory('frontend/images', path)

if __name__ == '__main__':
    print("\n🖥️  Frontend Server Starting...")
    print("Listening on http://localhost:3001")
    print("Endpoints:")
    print("  GET  / - Kiosk Interface")
    print("  POST /api/order - Receive order updates")
    print("  GET /api/orders - Get all orders")
    print("  GET /api/orders/latest - Get latest order")
    print("\n")
    app.run(host='0.0.0.0', port=3001, debug=True)