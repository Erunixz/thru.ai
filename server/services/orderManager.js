// =============================================================================
// server/services/orderManager.js — Order State Manager
// =============================================================================
//
// PURPOSE:
//   Manages the lifecycle of drive-thru orders:
//     - Creates order records when a session starts
//     - Updates order state when AI extracts new items
//     - Tracks order status (in_progress → complete)
//     - Assigns incrementing order numbers (e.g., #001, #002, ...)
//
// HOW IT FITS:
//   ElevenLabs AI → updates order items/total → orderManager stores it
//   Socket.IO → broadcasts changes to connected clients for tracking
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
    id: sessionId,                                              // Links to the conversation session
    orderNumber: orderCounter,                                  // Human-friendly "#001"
    items: [],                                                  // Order items from AI
    total: 0,                                                   // Running total
    status: 'in_progress',                                      // Order lifecycle status (in_progress → complete)
    kitchenStatus: 'new',                                       // Kitchen status (new → preparing → ready → completed)
    createdAt: new Date().toISOString(),                        // When the order session started
    updatedAt: new Date().toISOString(),                        // Last update timestamp
    completedAt: null,                                          // When the customer confirmed
    kitchenCompletedAt: null,                                   // When kitchen finished preparing
  };

  orders.set(sessionId, order);
  return order;
}

/**
 * Update an order with new data from the AI's response.
 *
 * Called after every AI turn. The AI returns the FULL order state
 * (not just the diff), so we replace items/total/status entirely.
 *
 * @param {string} sessionId - The session ID
 * @param {Object} orderData - The order data from AI: { items, total, status }
 * @returns {Object|null} The updated order record, or null if not found
 */
function updateOrder(sessionId, orderData) {
  const order = orders.get(sessionId);
  if (!order) return null;

  // AI sends the full order state each turn — replace items and total
  order.items = orderData.items || [];
  order.total = orderData.total || 0;
  order.status = orderData.status || 'in_progress';
  order.updatedAt = new Date().toISOString();

  // If AI marked the order as complete, record the completion time
  if (orderData.status === 'complete' && !order.completedAt) {
    order.completedAt = new Date().toISOString();
  }

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
 * Get all active orders (in_progress status).
 *
 * Returns orders that are still in_progress (not yet completed),
 * sorted by creation time (oldest first — FIFO).
 *
 * @returns {Array} Array of order records
 */
function getActiveOrders() {
  const active = [];
  for (const order of orders.values()) {
    // Show orders that are still in progress
    if (order.status === 'in_progress') {
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
 * Update kitchen status for an order.
 *
 * @param {string} sessionId - The session ID
 * @param {string} kitchenStatus - The new kitchen status (new/preparing/ready/completed)
 * @returns {Object|null} The updated order record, or null if not found
 */
function updateKitchenStatus(sessionId, kitchenStatus) {
  const order = orders.get(sessionId);
  if (!order) return null;

  order.kitchenStatus = kitchenStatus;
  order.updatedAt = new Date().toISOString();

  // Record when kitchen completes the order
  if (kitchenStatus === 'completed' && !order.kitchenCompletedAt) {
    order.kitchenCompletedAt = new Date().toISOString();
  }

  orders.set(sessionId, order);
  return order;
}

/**
 * Get orders by kitchen status.
 *
 * @param {string} kitchenStatus - Filter by kitchen status
 * @returns {Array} Array of order records
 */
function getOrdersByKitchenStatus(kitchenStatus) {
  const filtered = [];
  for (const order of orders.values()) {
    if (order.kitchenStatus === kitchenStatus) {
      filtered.push(order);
    }
  }
  // Sort by creation time (oldest first)
  filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return filtered;
}

/**
 * Get all orders for kitchen display (excludes fully completed orders older than 1 hour).
 *
 * @returns {Array} Array of order records
 */
function getKitchenOrders() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const kitchenOrders = [];

  for (const order of orders.values()) {
    // Show orders that aren't kitchen-completed, or were completed less than 1 hour ago
    if (order.kitchenStatus !== 'completed' ||
        (order.kitchenCompletedAt && new Date(order.kitchenCompletedAt) > oneHourAgo)) {
      kitchenOrders.push(order);
    }
  }

  // Sort by creation time (oldest first)
  kitchenOrders.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return kitchenOrders;
}

/**
 * Restore a previously deleted order.
 *
 * @param {Object} orderData - The complete order object to restore
 * @returns {Object} The restored order record
 */
function restoreOrder(orderData) {
  // Put the order back into the map
  orders.set(orderData.id, orderData);
  return orderData;
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
  getOrdersByKitchenStatus,
  getKitchenOrders,
  restoreOrder,
  deleteOrder,
};
