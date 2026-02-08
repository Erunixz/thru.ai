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
    <div className="bg-white rounded-2xl border border-gray-200 h-full flex flex-col shadow-sm">
      {/* --- Header --- */}
      <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-900 rounded-lg flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Your Order</h2>
          {/* Item count badge */}
          {items.length > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-auto bg-gray-900 text-white text-xs font-bold px-2.5 py-1 rounded-full"
            >
              {items.length}
            </motion.span>
          )}
        </div>
      </div>

      {/* --- Items List --- */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            // Empty state — no items yet
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center py-16 text-gray-400"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-200">
                <ShoppingBag className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-base font-semibold text-gray-500">No items yet</p>
              <p className="text-sm mt-2 text-gray-400">Start speaking to add items</p>
            </motion.div>
          ) : (
            // List of order items
            items.map((item, index) => (
              <motion.div
                key={`${item.name}-${index}`}
                initial={{ opacity: 0, x: 20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.9 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 300
                }}
                className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-colors"
              >
                <div className="flex justify-between items-start">
                  {/* Item name + quantity */}
                  <div className="flex-1">
                    <p className="text-gray-900 font-semibold text-base">
                      {item.quantity > 1 && (
                        <span className="inline-block bg-gray-900 text-white text-xs font-bold px-2 py-0.5 rounded-md mr-2">
                          {item.quantity}x
                        </span>
                      )}
                      {item.name}
                    </p>

                    {/* Size (if applicable) */}
                    {item.size && (
                      <p className="text-sm text-gray-600 mt-1 capitalize font-medium">
                        {item.size}
                      </p>
                    )}

                    {/* Modifiers (no pickles, extra cheese, etc.) */}
                    {item.modifiers && item.modifiers.length > 0 && (
                      <p className="text-sm text-gray-500 mt-1 italic">
                        {item.modifiers.join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Price */}
                  <p className="text-gray-900 font-bold text-lg ml-4">
                    ${(item.price * (item.quantity || 1)).toFixed(2)}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* --- Total + Status --- */}
      <div className="px-6 py-5 border-t border-gray-200 bg-gray-50 flex-shrink-0">
        {/* Order complete badge */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="mb-4 flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-5 py-3"
            >
              <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                <Check className="w-4 h-4 text-green-700" />
              </div>
              <span className="font-bold text-base">Order Confirmed!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Total price */}
        <div className="flex justify-between items-center bg-white rounded-xl px-5 py-4 border border-gray-200">
          <span className="text-gray-600 text-lg font-semibold">Total</span>
          <motion.span
            key={total}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="text-3xl font-black text-gray-900"
          >
            ${total.toFixed(2)}
          </motion.span>
        </div>
      </div>
    </div>
  );
}
