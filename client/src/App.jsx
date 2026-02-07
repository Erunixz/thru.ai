// =============================================================================
// client/src/App.jsx — Root Application Component with Routing
// =============================================================================
//
// PURPOSE:
//   Sets up client-side routing for the two main views:
//     /         → Customer Kiosk (the screen at the drive-thru speaker box)
//     /kitchen  → Kitchen Display (the screen in the kitchen)
//
// WHY TWO VIEWS?
//   The drive-thru has two physical screens:
//     1. CUSTOMER KIOSK: Mounted outside at the speaker box where customers order.
//        Shows conversation, order summary, and mic button.
//     2. KITCHEN DISPLAY: Mounted inside the kitchen where staff prepares food.
//        Shows all active orders with status tracking.
//
//   Both connect to the same Express backend. The kitchen display uses
//   Socket.IO for real-time updates; the customer kiosk uses REST API.
//
// ROUTING:
//   We use React Router v7 for client-side routing.
//   In production, Express serves index.html for all non-API routes,
//   and React Router handles the path on the client side.
//
// =============================================================================

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CustomerKiosk from './pages/CustomerKiosk';
import KitchenDisplay from './pages/KitchenDisplay';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer-facing kiosk — the main drive-thru ordering screen */}
        <Route path="/" element={<CustomerKiosk />} />

        {/* Kitchen display — real-time order dashboard for kitchen staff */}
        <Route path="/kitchen" element={<KitchenDisplay />} />
      </Routes>
    </BrowserRouter>
  );
}
