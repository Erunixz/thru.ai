// =============================================================================
// client/src/hooks/useSocket.js — Socket.IO React Hook
// =============================================================================
//
// PURPOSE:
//   A custom React hook that manages a Socket.IO connection to the backend.
//   Used by the Kitchen Display to receive real-time order updates.
//
// HOW IT WORKS:
//   1. On mount: Creates a Socket.IO connection to the Express server
//   2. Listens for events: orders:init, order:new, order:update, order:complete
//   3. Maintains a state array of all active orders
//   4. On unmount: Disconnects the socket (cleanup)
//
// USAGE:
//   const { orders, connected, updateStatus } = useSocket();
//   // orders: Array of active order objects (auto-updated in real-time)
//   // connected: Boolean — is the socket connected?
//   // updateStatus: Function to change an order's kitchen status
//
// WHY A CUSTOM HOOK?
//   Encapsulates all Socket.IO logic in one place. The KitchenDisplay
//   component doesn't need to know about socket events, reconnection,
//   or state management — it just reads from `orders`.
//
// =============================================================================

import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

export function useSocket() {
  // State: list of active orders (displayed in the kitchen grid)
  const [orders, setOrders] = useState([]);

  // State: is the socket currently connected?
  const [connected, setConnected] = useState(false);

  // Ref to hold the socket instance (persists across renders)
  const socketRef = useRef(null);

  useEffect(() => {
    // --- Create Socket.IO connection ---
    // In development, Vite proxies /socket.io to Express (see vite.config.js).
    // So we connect to the same origin (no URL needed).
    const socket = io();
    socketRef.current = socket;

    // --- Connection status tracking ---
    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setConnected(false);
    });

    // --- Event: Initial load ---
    // When the kitchen display first connects, the server sends ALL active orders.
    // This populates the grid immediately without needing a separate API call.
    socket.on('orders:init', (initialOrders) => {
      console.log(`📦 Received ${initialOrders.length} initial orders`);
      setOrders(initialOrders);
    });

    // --- Event: New order started ---
    // A customer just started a new ordering session. Add the empty order to the grid.
    socket.on('order:new', (order) => {
      console.log(`📦 New order: #${order.orderNumber}`);
      setOrders((prev) => [...prev, order]);
    });

    // --- Event: Order updated ---
    // An order's items, total, or status changed. Replace the existing order in state.
    socket.on('order:update', (updatedOrder) => {
      console.log(`📦 Order updated: #${updatedOrder.orderNumber}`);
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      );
    });

    // --- Event: Order complete ---
    // The customer confirmed their order. Update it in the grid.
    // (We keep it visible so kitchen staff can mark it as "preparing" / "ready")
    socket.on('order:complete', (completedOrder) => {
      console.log(`✅ Order complete: #${completedOrder.orderNumber}`);
      setOrders((prev) =>
        prev.map((o) => (o.id === completedOrder.id ? completedOrder : o))
      );
    });

    // --- Cleanup on unmount ---
    return () => {
      socket.disconnect();
    };
  }, []);

  // --- Action: Update an order's kitchen status ---
  // Called by kitchen staff clicking "Start Preparing" / "Ready" / "Complete"
  const updateStatus = useCallback((orderId, kitchenStatus) => {
    if (socketRef.current) {
      socketRef.current.emit('order:status', { orderId, kitchenStatus });
    }
  }, []);

  return { orders, connected, updateStatus };
}
