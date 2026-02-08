// =============================================================================
// client/src/pages/KitchenDisplay.jsx — Kitchen Display System
// =============================================================================
//
// PURPOSE:
//   Employee-facing display for managing incoming orders.
//   Shows orders organized by status: New → Preparing → Ready → Completed
//
// FEATURES:
//   - Real-time order updates via Socket.IO
//   - Visual order cards with items and totals
//   - Status management buttons
//   - Auto-refresh on new orders
//   - Timer showing order age
//
// =============================================================================

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChefHat, CheckCircle, Package, Trash2, Undo2 } from 'lucide-react';
import { io } from 'socket.io-client';

export default function KitchenDisplay() {
  const [orders, setOrders] = useState([]);
  const [socket, setSocket] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [deletedOrder, setDeletedOrder] = useState(null);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const undoTimerRef = useRef(null);

  // Connect to Socket.IO
  useEffect(() => {
    const newSocket = io(window.location.origin);

    newSocket.on('kitchen:init', (initialOrders) => {
      console.log('Kitchen orders loaded:', initialOrders);
      setOrders(initialOrders);
    });

    newSocket.on('order:new', (order) => {
      console.log('New order:', order);
      setOrders((prev) => [...prev, order]);
    });

    newSocket.on('order:update', (updatedOrder) => {
      console.log('Order updated:', updatedOrder);
      setOrders((prev) =>
        prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
      );
    });

    newSocket.on('kitchen:status', (updatedOrder) => {
      console.log('Kitchen status updated:', updatedOrder);
      setOrders((prev) =>
        prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
      );
    });

    newSocket.on('order:complete', (completedOrder) => {
      console.log('Order completed:', completedOrder);
      setOrders((prev) =>
        prev.map((order) => (order.id === completedOrder.id ? completedOrder : order))
      );
    });

    newSocket.on('kitchen:delete', ({ orderId }) => {
      console.log('Order deleted:', orderId);
      setOrders((prev) => prev.filter((order) => order.id !== orderId));
    });

    newSocket.on('kitchen:restore', (restoredOrder) => {
      console.log('Order restored:', restoredOrder);
      setOrders((prev) => [...prev, restoredOrder]);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  // Update current time every second for timers
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update kitchen status
  const updateKitchenStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch('/api/kitchen/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, kitchenStatus: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update kitchen status:', error);
    }
  };

  // Delete order with undo option
  const deleteOrder = async (order) => {
    try {
      // Clear any existing undo timer
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }

      // Store the order for potential undo
      setDeletedOrder(order);
      setShowUndoToast(true);

      // Remove from UI immediately
      setOrders((prev) => prev.filter((o) => o.id !== order.id));

      // Set timer to permanently delete after 5 seconds
      undoTimerRef.current = setTimeout(async () => {
        const response = await fetch(`/api/kitchen/order/${order.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete order');
        }

        setShowUndoToast(false);
        setDeletedOrder(null);
      }, 5000);
    } catch (error) {
      console.error('Failed to delete order:', error);
      // Restore order on error
      setOrders((prev) => [...prev, order]);
    }
  };

  // Undo order deletion
  const undoDelete = async () => {
    if (!deletedOrder) return;

    try {
      // Clear the deletion timer
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }

      // Restore order in UI
      setOrders((prev) => [...prev, deletedOrder]);

      // Restore on server
      await fetch('/api/kitchen/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: deletedOrder }),
      });

      setShowUndoToast(false);
      setDeletedOrder(null);
    } catch (error) {
      console.error('Failed to undo deletion:', error);
    }
  };

  // Cleanup undo timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  // Calculate time since order was created
  const getOrderAge = (createdAt) => {
    const created = new Date(createdAt);
    const diff = Math.floor((currentTime - created) / 1000); // seconds

    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  // Get color based on order age
  const getAgeColor = (createdAt) => {
    const created = new Date(createdAt);
    const minutes = Math.floor((currentTime - created) / (1000 * 60));

    if (minutes < 3) return 'text-green-600';
    if (minutes < 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Group orders by kitchen status
  const ordersByStatus = {
    new: orders.filter((o) => o.kitchenStatus === 'new'),
    preparing: orders.filter((o) => o.kitchenStatus === 'preparing'),
    ready: orders.filter((o) => o.kitchenStatus === 'ready'),
    completed: orders.filter((o) => o.kitchenStatus === 'completed'),
  };

  // Status column configuration
  const statusColumns = [
    {
      status: 'new',
      title: 'New Orders',
      icon: Package,
      color: 'bg-blue-500',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      nextStatus: 'preparing',
      nextLabel: 'Start Preparing',
    },
    {
      status: 'preparing',
      title: 'Preparing',
      icon: ChefHat,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      nextStatus: 'ready',
      nextLabel: 'Mark Ready',
    },
    {
      status: 'ready',
      title: 'Ready',
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-700',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      nextStatus: 'completed',
      nextLabel: 'Complete',
    },
    {
      status: 'completed',
      title: 'Completed',
      icon: CheckCircle,
      color: 'bg-gray-500',
      textColor: 'text-gray-700',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      nextStatus: null,
      nextLabel: null,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kitchen Display</h1>
              <p className="text-sm text-gray-500">Manage incoming orders</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="text-xs text-gray-500">
                {orders.length} total orders
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Status Columns */}
      <div className="p-6">
        <div className="grid grid-cols-4 gap-6">
          {statusColumns.map((column) => (
            <div key={column.status} className="flex flex-col">
              {/* Column Header */}
              <div className={`${column.color} text-white rounded-t-xl px-4 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <column.icon className="w-5 h-5" />
                  <span className="font-bold">{column.title}</span>
                </div>
                <span className="bg-white/20 px-2 py-1 rounded-full text-sm font-bold">
                  {ordersByStatus[column.status].length}
                </span>
              </div>

              {/* Orders */}
              <div className="bg-gray-100 rounded-b-xl p-3 flex-1 space-y-3 min-h-[calc(100vh-280px)]">
                <AnimatePresence>
                  {ordersByStatus[column.status].map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`${column.bgColor} border-2 ${column.borderColor} rounded-xl p-4 shadow-sm`}
                    >
                      {/* Order Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-gray-900">
                            #{order.orderNumber.toString().padStart(3, '0')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center gap-1 ${getAgeColor(order.createdAt)}`}>
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-bold">
                              {getOrderAge(order.createdAt)}
                            </span>
                          </div>
                          {/* Delete Button */}
                          <motion.button
                            onClick={() => deleteOrder(order)}
                            className="p-1.5 hover:bg-red-100 rounded-lg transition-colors group"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Delete order"
                          >
                            <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                          </motion.button>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="space-y-2 mb-3">
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item, idx) => (
                            <div key={idx} className="border-b border-gray-200 pb-2 last:border-0">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-900 font-semibold">
                                  {item.quantity > 1 && (
                                    <span className="inline-block bg-gray-900 text-white text-xs px-1.5 py-0.5 rounded mr-1">
                                      {item.quantity}x
                                    </span>
                                  )}
                                  {item.name}
                                </span>
                                <span className="text-gray-700 font-bold">
                                  ${(item.price * (item.quantity || 1)).toFixed(2)}
                                </span>
                              </div>
                              {/* Modifiers with lower opacity */}
                              {item.modifiers && (
                                <div className="mt-1 ml-6 text-xs text-gray-600 opacity-70 italic">
                                  {Array.isArray(item.modifiers)
                                    ? item.modifiers.map((mod, i) => (
                                        <div key={i}>
                                          {typeof mod === 'string' ? mod : mod.type || mod.name || JSON.stringify(mod)}
                                        </div>
                                      ))
                                    : <div>{item.modifiers}</div>
                                  }
                                </div>
                              )}
                              {/* Size if applicable */}
                              {item.size && (
                                <div className="mt-1 ml-6 text-xs text-gray-600 opacity-70 italic">
                                  Size: {item.size}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm italic">No items yet</p>
                        )}
                      </div>

                      {/* Order Total */}
                      <div className="border-t-2 border-gray-300 pt-2 mb-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 font-bold">Total</span>
                          <span className="text-xl font-black text-gray-900">
                            ${order.total.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      {column.nextStatus && (
                        <motion.button
                          onClick={() => updateKitchenStatus(order.id, column.nextStatus)}
                          className={`w-full ${column.color} hover:opacity-90 text-white font-bold py-3 rounded-lg transition-opacity`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {column.nextLabel}
                        </motion.button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {ordersByStatus[column.status].length === 0 && (
                  <div className="text-center text-gray-400 py-12">
                    <column.icon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No {column.title.toLowerCase()}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Undo Toast */}
      <AnimatePresence>
        {showUndoToast && deletedOrder && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4">
              <Trash2 className="w-5 h-5 text-red-400" />
              <div>
                <p className="font-bold">
                  Order #{deletedOrder.orderNumber.toString().padStart(3, '0')} deleted
                </p>
                <p className="text-sm text-gray-300">
                  Will be permanently deleted in 5 seconds
                </p>
              </div>
              <motion.button
                onClick={undoDelete}
                className="ml-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Undo2 className="w-4 h-4" />
                Undo
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
