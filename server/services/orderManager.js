// =============================================================================
// server/services/orderManager.js — Order State Manager
// =============================================================================
//
// PURPOSE:
//   Manages the lifecycle of drive-thru orders:
//     - Creates order records when a session starts
//     - Updates order state when Claude extracts new items
//     - Tracks order status (in_progress → preparing → ready → completed)
//     - Provides order data for the kitchen display
//     - Assigns incrementing order numbers (e.g., #001, #002, ...)
//
// HOW IT FITS:
//   main.py (Python version) had a simple dict. This is the Node.js equivalent
//   with proper order numbering, status tracking, and kitchen display support.
//
//   Claude AI → updates order items/total → orderManager stores it
//   Kitchen Display → reads orders → staff marks as preparing/ready
//   Socket.IO → broadcasts changes to all connected kitchen displays
//
// =============================================================================

// ---------------------------------------------------------------------------
// In-memory order storage
// ---------------------------------------------------------------------------
// Map<orderId, OrderRecord>
// In production, replace with Firebase/Firestore or PostgreSQL.
const orders = new Map();

// Auto-incrementing order number (resets when server restarts)
let orderCounter = 0;

/**
 * Create a new order record for a drive-thru session.
 *
 * Called when a customer starts a new ordering session.
 * The order starts with no items and status "in_progress".
 *
 * @param {string} sessionId - The conversation session ID
 * @returns {Object} The new order record
 */
function createOrder(sessionId) {
  orderCounter += 1;

  const order = {
    id: sessionId,                                              // Links to the Claude session
    orderNumber: orderCounter,                                  // Human-friendly "#001"
    items: [],                                                  // Order items from Claude
    total: 0,                                                   // Running total
    status: 'in_progress',                                      // Order lifecycle status
    kitchenStatus: 'waiting',                                   // Kitchen workflow status
    createdAt: new Date().toISOString(),                        // When the order session started
    updatedAt: new Date().toISOString(),                        // Last update timestamp
    completedAt: null,                                          // When the customer confirmed
  };

  orders.set(sessionId, order);
  return order;
}

/**
 * Update an order with new data from Claude's response.
 *
 * Called after every Claude AI turn. Claude returns the FULL order state
 * (not just the diff), so we replace items/total/status entirely.
 *
 * @param {string} sessionId - The session ID
 * @param {Object} orderData - The order data from Claude: { items, total, status }
 * @returns {Object|null} The updated order record, or null if not found
 */
function updateOrder(sessionId, orderData) {
  const order = orders.get(sessionId);
  if (!order) return null;

  // Claude sends the full order state each turn — replace items and total
  order.items = orderData.items || [];
  order.total = orderData.total || 0;
  order.status = orderData.status || 'in_progress';
  order.updatedAt = new Date().toISOString();

  // If Claude marked the order as complete, record the completion time
  if (orderData.status === 'complete' && !order.completedAt) {
    order.completedAt = new Date().toISOString();
  }

  orders.set(sessionId, order);
  return order;
}

/**
 * Update the kitchen status of an order.
 *
 * Called by kitchen staff via the kitchen display:
 *   - "waiting"   → Order received, not yet started
 *   - "preparing" → Kitchen is making the order
 *   - "ready"     → Order is ready for pickup
 *   - "completed" → Order has been handed to customer
 *
 * @param {string} sessionId - The session/order ID
 * @param {string} kitchenStatus - The new kitchen status
 * @returns {Object|null} The updated order, or null if not found
 */
function updateKitchenStatus(sessionId, kitchenStatus) {
  const order = orders.get(sessionId);
  if (!order) return null;

  const validStatuses = ['waiting', 'preparing', 'ready', 'completed'];
  if (!validStatuses.includes(kitchenStatus)) {
    throw new Error(`Invalid kitchen status: ${kitchenStatus}. Must be one of: ${validStatuses.join(', ')}`);
  }

  order.kitchenStatus = kitchenStatus;
  order.updatedAt = new Date().toISOString();

  orders.set(sessionId, order);
  return order;
}

/**
 * Get a single order by session ID.
 *
 * @param {string} sessionId
 * @returns {Object|null}
 */
function getOrder(sessionId) {
  return orders.get(sessionId) || null;
}

/**
 * Get all active orders (for the kitchen display).
 *
 * Returns orders that are NOT "completed" in kitchen status,
 * sorted by creation time (oldest first — FIFO).
 *
 * @returns {Array} Array of order records
 */
function getActiveOrders() {
  const active = [];
  for (const order of orders.values()) {
    // Show orders that are still in the kitchen pipeline
    if (order.kitchenStatus !== 'completed') {
      active.push(order);
    }
  }
  // Sort by creation time (oldest first — first in, first out)
  active.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return active;
}

/**
 * Get all orders (active + completed) for debugging/history.
 *
 * @returns {Array} All order records
 */
function getAllOrders() {
  return Array.from(orders.values());
}

/**
 * Delete an order (cleanup).
 *
 * @param {string} sessionId
 */
function deleteOrder(sessionId) {
  orders.delete(sessionId);
}

module.exports = {
  createOrder,
  updateOrder,
  updateKitchenStatus,
  getOrder,
  getActiveOrders,
  getAllOrders,
  deleteOrder,
};
