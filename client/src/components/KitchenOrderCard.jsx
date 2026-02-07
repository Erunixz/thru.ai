// =============================================================================
// client/src/components/KitchenOrderCard.jsx — Single Order Card for Kitchen
// =============================================================================
//
// PURPOSE:
//   Displays one order as a card in the kitchen display grid.
//   Shows order number, items, total, time elapsed, and action buttons
//   for kitchen staff to update the order's status.
//
// STATUS COLORS:
//   - waiting   → Blue border (new order, not started)
//   - preparing → Yellow border (kitchen is working on it)
//   - ready     → Green border (ready for pickup)
//   - completed → Grey (done, will auto-remove)
//
// PROPS:
//   order: Full order record from the server
//   onStatusChange(orderId, newStatus): Called when staff clicks a status button
//
// =============================================================================

import { motion } from 'framer-motion';
import { Clock, ChefHat, CheckCircle2, Package } from 'lucide-react';

export default function KitchenOrderCard({ order, onStatusChange }) {
  // Calculate how long ago the order was placed
  const elapsed = getElapsedTime(order.createdAt);

  // Determine styling based on kitchen status
  const statusConfig = {
    waiting: {
      border: 'border-blue-500',
      bg: 'bg-blue-500/10',
      badge: 'bg-blue-500/20 text-blue-400',
      label: 'New Order',
      icon: <Package className="w-4 h-4" />,
    },
    preparing: {
      border: 'border-yellow-500',
      bg: 'bg-yellow-500/10',
      badge: 'bg-yellow-500/20 text-yellow-400',
      label: 'Preparing',
      icon: <ChefHat className="w-4 h-4" />,
    },
    ready: {
      border: 'border-green-500',
      bg: 'bg-green-500/10',
      badge: 'bg-green-500/20 text-green-400',
      label: 'Ready',
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
    completed: {
      border: 'border-slate-600',
      bg: 'bg-slate-800/50',
      badge: 'bg-slate-500/20 text-slate-400',
      label: 'Done',
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
  };

  const config = statusConfig[order.kitchenStatus] || statusConfig.waiting;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className={`rounded-xl border-2 ${config.border} ${config.bg} p-5 flex flex-col`}
    >
      {/* --- Header: Order number + status badge + elapsed time --- */}
      <div className="flex items-center justify-between mb-4">
        {/* Order number (large, clear) */}
        <h3 className="text-2xl font-bold text-white">
          #{String(order.orderNumber).padStart(3, '0')}
        </h3>

        {/* Status badge */}
        <span
          className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full ${config.badge}`}
        >
          {config.icon}
          {config.label}
        </span>
      </div>

      {/* --- Time elapsed --- */}
      <div className="flex items-center gap-1.5 text-sm text-slate-400 mb-3">
        <Clock className="w-3.5 h-3.5" />
        <span>{elapsed}</span>
      </div>

      {/* --- Items list --- */}
      <div className="flex-1 space-y-2 mb-4">
        {(order.items || []).length === 0 ? (
          <p className="text-slate-500 text-sm italic">Ordering in progress...</p>
        ) : (
          order.items.map((item, i) => (
            <div
              key={i}
              className="flex justify-between items-start text-sm"
            >
              <div className="flex-1">
                <span className="text-white font-medium">
                  {item.quantity > 1 && (
                    <span className="text-brand-400">{item.quantity}x </span>
                  )}
                  {item.name}
                </span>
                {/* Size */}
                {item.size && (
                  <span className="text-slate-500 ml-1 capitalize">
                    ({item.size})
                  </span>
                )}
                {/* Modifiers */}
                {item.modifiers && item.modifiers.length > 0 && (
                  <p className="text-slate-500 text-xs mt-0.5">
                    {item.modifiers.join(', ')}
                  </p>
                )}
              </div>
              <span className="text-slate-400 ml-2">
                ${(item.price * (item.quantity || 1)).toFixed(2)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* --- Total --- */}
      <div className="flex justify-between items-center py-2 border-t border-slate-700/50 mb-4">
        <span className="text-slate-400 font-medium">Total</span>
        <span className="text-white font-bold text-lg">
          ${(order.total || 0).toFixed(2)}
        </span>
      </div>

      {/* --- Action Buttons --- */}
      {/* Show different buttons based on current kitchen status */}
      <div className="flex gap-2">
        {order.kitchenStatus === 'waiting' && order.status === 'complete' && (
          <button
            onClick={() => onStatusChange(order.id, 'preparing')}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            Start Preparing
          </button>
        )}

        {order.kitchenStatus === 'preparing' && (
          <button
            onClick={() => onStatusChange(order.id, 'ready')}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            Mark Ready
          </button>
        )}

        {order.kitchenStatus === 'ready' && (
          <button
            onClick={() => onStatusChange(order.id, 'completed')}
            className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            Complete
          </button>
        )}

        {order.kitchenStatus === 'waiting' && order.status !== 'complete' && (
          <p className="text-slate-500 text-sm italic w-full text-center py-2">
            Customer still ordering...
          </p>
        )}
      </div>
    </motion.div>
  );
}

// =============================================================================
// Helper: Calculate elapsed time since order was created
// =============================================================================

function getElapsedTime(createdAt) {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now - created;
  const diffMin = Math.floor(diffMs / 60000);
  const diffSec = Math.floor((diffMs % 60000) / 1000);

  if (diffMin === 0) return `${diffSec}s ago`;
  return `${diffMin}m ${diffSec}s ago`;
}
