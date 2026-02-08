// =============================================================================
// client/src/pages/KitchenDisplay.jsx — Redesigned Kitchen Display
// =============================================================================
//
// PURPOSE:
//   Modern visual menu-based interface for kitchen staff to:
//   - View all menu items with images and categories
//   - Search and filter menu items
//   - View active orders in a modal overlay
//   - Track order statistics and revenue in real-time
//   - Update order status (waiting → preparing → ready → completed)
//
// FEATURES:
//   - Visual menu grid with category navigation
//   - Search functionality
//   - Dine-in / Take-out filter toggle
//   - Real-time order updates via Socket.IO
//   - Order management modal with status filters
//   - Bottom bar with order stats and revenue tracking
//
// =============================================================================

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useSocket } from '../hooks/useSocket';
import KitchenTopBar from '../components/kitchen/KitchenTopBar';
import KitchenCategorySidebar from '../components/kitchen/KitchenCategorySidebar';
import KitchenMenuGrid from '../components/kitchen/KitchenMenuGrid';
import KitchenBottomBar from '../components/kitchen/KitchenBottomBar';
import KitchenOrdersModal from '../components/kitchen/KitchenOrdersModal';

export default function KitchenDisplay() {
  // Socket.IO connection for real-time orders
  const { orders, connected, updateStatus } = useSocket();

  // Menu data state
  const [menu, setMenu] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showOrdersModal, setShowOrdersModal] = useState(false);

  // Fetch menu data
  useEffect(() => {
    fetch('/api/menu')
      .then(res => res.json())
      .then(data => {
        setMenu(data);
        setMenuLoading(false);
      })
      .catch(error => {
        console.error('Error fetching menu:', error);
        setMenuLoading(false);
      });
  }, []);

  // Extract categories from menu
  const categories = useMemo(() => {
    const categoryMap = {};
    menu.forEach(item => {
      if (!categoryMap[item.category]) {
        categoryMap[item.category] = 0;
      }
      categoryMap[item.category]++;
    });

    return Object.entries(categoryMap).map(([name, count]) => ({
      name,
      count,
    }));
  }, [menu]);

  // Calculate order statistics
  const orderStats = useMemo(() => {
    const activeOrders = orders.filter(o => o.kitchenStatus !== 'completed');
    return {
      waiting: activeOrders.filter(o => o.kitchenStatus === 'waiting').length,
      preparing: activeOrders.filter(o => o.kitchenStatus === 'preparing').length,
      ready: activeOrders.filter(o => o.kitchenStatus === 'ready').length,
      total: activeOrders.reduce((sum, o) => sum + (o.total || 0), 0),
    };
  }, [orders]);

  // Handle category click from sidebar
  const handleCategoryClick = useCallback((category) => {
    setActiveCategory(category);
  }, []);

  // Handle category view (from intersection observer in MenuGrid)
  const handleCategoryView = useCallback((category) => {
    setActiveCategory(category);
  }, []);

  // Handle order status update
  const handleStatusUpdate = useCallback((orderId, newStatus) => {
    updateStatus(orderId, newStatus);

    // Auto-close modal when order is completed
    if (newStatus === 'completed') {
      setTimeout(() => {
        const remainingOrders = orders.filter(
          o => o.id !== orderId && o.kitchenStatus !== 'completed'
        );
        if (remainingOrders.length === 0) {
          setShowOrdersModal(false);
        }
      }, 500);
    }
  }, [updateStatus, orders]);

  // Filter active orders (exclude completed)
  const activeOrders = useMemo(() => {
    return orders.filter(o => o.kitchenStatus !== 'completed');
  }, [orders]);

  if (menuLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🍔</div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Loading menu...</h3>
          <p className="text-slate-500">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Top Bar */}
      <KitchenTopBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterType={filterType}
        onFilterChange={setFilterType}
        isConnected={connected}
      />

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Menu Grid */}
        <KitchenMenuGrid
          menuItems={menu}
          searchQuery={searchQuery}
          activeCategory={activeCategory}
          onCategoryView={handleCategoryView}
        />

        {/* Category Sidebar */}
        <KitchenCategorySidebar
          categories={categories}
          activeCategory={activeCategory}
          onCategoryClick={handleCategoryClick}
        />
      </div>

      {/* Bottom Bar */}
      <KitchenBottomBar
        orderStats={orderStats}
        revenue={orderStats.total}
        onViewOrders={() => setShowOrdersModal(true)}
      />

      {/* Orders Modal */}
      <KitchenOrdersModal
        orders={activeOrders}
        isOpen={showOrdersModal}
        onClose={() => setShowOrdersModal(false)}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
}
