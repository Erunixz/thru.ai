// =============================================================================
// client/src/services/api.js — API Client (Agent Architecture)
// =============================================================================

/**
 * Get a signed URL to start an ElevenLabs agent session.
 * Also creates a new order on the server.
 */
export async function getAgentSession() {
  const res = await fetch('/api/agent/signed-url');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server error: ${res.status}`);
  }
  return res.json();
}

/**
 * Send an order update to the server (from client tool callback).
 */
export async function updateOrderOnServer(orderId, orderData) {
  const res = await fetch('/api/orders/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, ...orderData }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Server error: ${res.status}`);
  }
  return res.json();
}
