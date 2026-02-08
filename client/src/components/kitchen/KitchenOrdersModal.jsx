import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter } from 'lucide-react';
import { useState } from 'react';
import KitchenOrderCard from '../KitchenOrderCard';

export default function KitchenOrdersModal({ orders, isOpen, onClose, onStatusUpdate }) {
  const [statusFilter, setStatusFilter] = useState('all');

  // Filter orders by status
  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(order => order.kitchenStatus === statusFilter);

  // Count orders by status
  const statusCounts = {
    all: orders.length,
    waiting: orders.filter(o => o.kitchenStatus === 'waiting').length,
    preparing: orders.filter(o => o.kitchenStatus === 'preparing').length,
    ready: orders.filter(o => o.kitchenStatus === 'ready').length,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-60 z-40"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 z-50 bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-white">Active Orders</h2>
                <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-sm font-bold">
                  {orders.length} Total
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>

            {/* Status Filter Tabs */}
            <div className="bg-slate-800 px-6 py-3 flex items-center gap-2 border-b border-slate-700">
              <Filter size={18} className="text-slate-400" />
              <div className="flex gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  All ({statusCounts.all})
                </button>
                <button
                  onClick={() => setStatusFilter('waiting')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    statusFilter === 'waiting'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Waiting ({statusCounts.waiting})
                </button>
                <button
                  onClick={() => setStatusFilter('preparing')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    statusFilter === 'preparing'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Preparing ({statusCounts.preparing})
                </button>
                <button
                  onClick={() => setStatusFilter('ready')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    statusFilter === 'ready'
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Ready ({statusCounts.ready})
                </button>
              </div>
            </div>

            {/* Orders Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold text-slate-400 mb-2">
                    {statusFilter === 'all' ? 'No active orders' : `No ${statusFilter} orders`}
                  </h3>
                  <p className="text-slate-500">
                    {statusFilter === 'all'
                      ? 'New orders will appear here when customers place them'
                      : 'Try a different filter to see other orders'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredOrders.map(order => (
                    <KitchenOrderCard
                      key={order.id}
                      order={order}
                      onStatusChange={onStatusUpdate}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
