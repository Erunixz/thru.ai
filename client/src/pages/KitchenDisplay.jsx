// =============================================================================
// client/src/pages/KitchenDisplay.jsx — Real-Time Kitchen Order Dashboard
// =============================================================================
//
// PURPOSE:
//   The screen mounted in the kitchen that shows all active orders in real-time.
//   Kitchen staff uses this to see incoming orders, mark them as "preparing"
//   or "ready", and track order completion.
//
// FEATURES:
//   - Real-time updates via Socket.IO (no page refresh needed)
//   - Grid of order cards with color-coded status
//   - Status action buttons (Preparing → Ready → Complete)
//   - Header with stats (active count, connection status)
//   - Auto-updates elapsed time every second
//   - Responsive grid (adapts to screen size)
//
// LAYOUT:
//   ┌──────────────────────────────────────────────────────┐
//   │  Header: "Kitchen Display"  |  Active: 5  |  🟢 Live│
//   ├──────────────────────────────────────────────────────┤
//   │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐            │
//   │  │ #001 │  │ #002 │  │ #003 │  │ #004 │            │
//   │  │ 🔵   │  │ 🟡   │  │ 🟢   │  │ 🔵   │            │
//   │  │ New  │  │ Prep │  │ Ready│  │ New  │            │
//   │  └──────┘  └──────┘  └──────┘  └──────┘            │
//   └──────────────────────────────────────────────────────┘
//
// =============================================================================

import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ChefHat, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import KitchenOrderCard from '../components/KitchenOrderCard';

export default function KitchenDisplay() {
  // Get real-time orders + connection status from the Socket.IO hook
  const { orders, connected, updateStatus } = useSocket();

  // Force re-render every 5 seconds to update elapsed time on cards
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  // Filter out completed orders from the display
  const activeOrders = orders.filter((o) => o.kitchenStatus !== 'completed');

  // Count orders by kitchen status (for the stats header)
  const stats = {
    waiting: orders.filter((o) => o.kitchenStatus === 'waiting').length,
    preparing: orders.filter((o) => o.kitchenStatus === 'preparing').length,
    ready: orders.filter((o) => o.kitchenStatus === 'ready').length,
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* === HEADER === */}
      <header className="bg-slate-900 border-b border-slate-800 px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Kitchen Display
              </h1>
              <p className="text-xs text-slate-500">Burger Express</p>
            </div>
          </div>

          {/* Stats badges */}
          <div className="flex items-center gap-4">
            {/* Waiting count */}
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-sm text-slate-400">
                {stats.waiting} new
              </span>
            </div>

            {/* Preparing count */}
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span className="text-sm text-slate-400">
                {stats.preparing} preparing
              </span>
            </div>

            {/* Ready count */}
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-sm text-slate-400">
                {stats.ready} ready
              </span>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-slate-700" />

            {/* Connection status */}
            {connected ? (
              <span className="flex items-center gap-1.5 text-sm text-green-400">
                <Wifi className="w-4 h-4" />
                Live
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-sm text-red-400">
                <WifiOff className="w-4 h-4" />
                Disconnected
              </span>
            )}
          </div>
        </div>
      </header>

      {/* === ORDER GRID === */}
      <main className="p-6">
        {activeOrders.length === 0 ? (
          // --- Empty State ---
          <div className="flex flex-col items-center justify-center py-32 text-slate-500">
            <RefreshCw className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-2xl font-medium">No active orders</p>
            <p className="text-base mt-2">
              Orders will appear here in real-time when customers place them
            </p>
          </div>
        ) : (
          // --- Order Cards Grid ---
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <AnimatePresence mode="popLayout">
              {activeOrders.map((order) => (
                <KitchenOrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={updateStatus}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
