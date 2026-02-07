// =============================================================================
// client/src/services/api.js — API Client for the Express Backend
// =============================================================================
//
// PURPOSE:
//   Clean wrapper around fetch() for all REST API calls to our backend.
//   Every API call the React app makes goes through these functions.
//
// WHY A SEPARATE FILE?
//   - Single source of truth for API URLs
//   - Consistent error handling across all requests
//   - Easy to swap out the backend URL (e.g., for production)
//   - Components stay clean — they just call api.startSession(), etc.
//
// NOTE ON URLs:
//   We use relative URLs (e.g., "/api/session/start") because Vite's proxy
//   forwards them to Express in development. In production, Express serves
//   both the API and the React build, so relative URLs work there too.
//
// =============================================================================

/**
 * Start a new drive-thru ordering session.
 *
 * Creates a new session on the server, gets a greeting message + audio.
 *
 * @returns {Promise<Object>} { sessionId, text, audio, order }
 *   - sessionId: UUID to use in all subsequent calls
 *   - text: Greeting text (e.g., "Welcome to Burger Express!")
 *   - audio: Base64-encoded MP3 of the greeting (or null)
 *   - order: Initial empty order object
 */
export async function startSession() {
  const res = await fetch('/api/session/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `API error: ${res.status}`);
  }

  return res.json();
}

/**
 * Send customer speech text to the AI and get a response.
 *
 * This is the MAIN API call — used every time the customer speaks.
 * The server processes the text through Claude AI → ElevenLabs,
 * and returns the AI's reply + audio + updated order.
 *
 * @param {string} sessionId - The session ID from startSession()
 * @param {string} text - What the customer said (from Web Speech API)
 * @returns {Promise<Object>} { text, audio, order, isComplete }
 *   - text: AI's reply (displayed in conversation)
 *   - audio: Base64 MP3 of the reply (played through speakers)
 *   - order: Updated order state { items, total, status }
 *   - isComplete: True when the customer confirmed their order
 */
export async function sendMessage(sessionId, text) {
  const res = await fetch('/api/conversation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, text }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `API error: ${res.status}`);
  }

  return res.json();
}

/**
 * Get all active orders (for the kitchen display).
 *
 * @returns {Promise<Array>} Array of order records
 */
export async function getOrders() {
  const res = await fetch('/api/orders');

  if (!res.ok) {
    throw new Error(`Failed to fetch orders: ${res.status}`);
  }

  return res.json();
}

/**
 * Update an order's kitchen status.
 *
 * Called by kitchen staff when they start preparing or finish an order.
 *
 * @param {string} orderId - The order/session ID
 * @param {string} kitchenStatus - "preparing" | "ready" | "completed"
 * @returns {Promise<Object>} The updated order record
 */
export async function updateOrderStatus(orderId, kitchenStatus) {
  const res = await fetch(`/api/orders/${orderId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kitchenStatus }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `API error: ${res.status}`);
  }

  return res.json();
}

/**
 * Play base64-encoded audio through the browser's speakers.
 *
 * ElevenLabs returns MP3 audio as a base64 string. This function
 * decodes it, creates an audio element, and plays it.
 *
 * Returns a Promise that resolves when the audio finishes playing.
 * This is important because we want to wait for the AI to finish speaking
 * before turning the microphone back on.
 *
 * @param {string} base64Audio - Base64-encoded MP3 audio data
 * @returns {Promise<void>} Resolves when playback is complete
 */
export function playAudio(base64Audio) {
  return new Promise((resolve, reject) => {
    if (!base64Audio) {
      // No audio available (TTS failed) — resolve immediately
      resolve();
      return;
    }

    // Create an audio element with the base64 data as a data URI
    const audio = new Audio(`data:audio/mpeg;base64,${base64Audio}`);

    // Resolve the promise when audio finishes playing
    audio.onended = () => resolve();

    // Reject if there's a playback error
    audio.onerror = (err) => reject(new Error('Audio playback failed'));

    // Start playback
    audio.play().catch(reject);
  });
}
