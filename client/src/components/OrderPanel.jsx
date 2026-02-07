// =============================================================================
// client/src/components/OrderPanel.jsx — Current Order Summary Display
// =============================================================================
//
// PURPOSE:
//   Shows the customer's current order as it's being built.
//   Displays on the right side of the customer kiosk screen.
//   Items animate in as they're added by the AI.
//
// FEATURES:
//   - Animated list of order items with prices
//   - Shows modifiers/sizes for each item
//   - Running total at the bottom
//   - "Order Complete" badge when finalized
//   - Empty state when no items yet
//
// PROPS:
//   order: { items: [...], total: number, status: string }
//
// =============================================================================

import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Check } from 'lucide-react';

export default function OrderPanel({ order }) {
  // Safely access order properties (order might be null initially)
  const items = order?.items || [];
  const total = order?.total || 0;
  const isComplete = order?.status === 'complete';

  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 h-full flex flex-col">
      {/* --- Header --- */}
      <div className="px-6 py-4 border-b border-slate-700/50 flex items-center gap-3">
        <ShoppingBag className="w-5 h-5 text-brand-400" />
        <h2 className="text-lg font-semibold text-white">Your Order</h2>
        {/* Item count badge */}
        {items.length > 0 && (
          <span className="ml-auto bg-brand-500/20 text-brand-400 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {items.length} item{items.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* --- Items List --- */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            // Empty state — no items yet
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-slate-500"
            >
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg">No items yet</p>
              <p className="text-sm mt-1">Start speaking to add items</p>
            </motion.div>
          ) : (
            // List of order items
            items.map((item, index) => (
              <motion.div
                key={`${item.name}-${index}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30"
              >
                <div className="flex justify-between items-start">
                  {/* Item name + quantity */}
                  <div className="flex-1">
                    <p className="text-white font-medium text-base">
                      {item.quantity > 1 && (
                        <span className="text-brand-400 mr-1">
                          {item.quantity}x
                        </span>
                      )}
                      {item.name}
                    </p>

                    {/* Size (if applicable) */}
                    {item.size && (
                      <p className="text-sm text-slate-400 mt-0.5 capitalize">
                        {item.size}
                      </p>
                    )}

                    {/* Modifiers (no pickles, extra cheese, etc.) */}
                    {item.modifiers && item.modifiers.length > 0 && (
                      <p className="text-sm text-slate-500 mt-0.5">
                        {item.modifiers.join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Price */}
                  <p className="text-white font-semibold ml-4">
                    ${(item.price * (item.quantity || 1)).toFixed(2)}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* --- Total + Status --- */}
      <div className="px-6 py-4 border-t border-slate-700/50">
        {/* Order complete badge */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 flex items-center gap-2 bg-green-500/20 text-green-400 rounded-lg px-4 py-2"
            >
              <Check className="w-5 h-5" />
              <span className="font-medium">Order Confirmed!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Total price */}
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-lg">Total</span>
          <motion.span
            key={total}
            initial={{ scale: 1.1, color: '#f97316' }}
            animate={{ scale: 1, color: '#ffffff' }}
            transition={{ duration: 0.3 }}
            className="text-2xl font-bold text-white"
          >
            ${total.toFixed(2)}
          </motion.span>
        </div>
      </div>
    </div>
  );
}
