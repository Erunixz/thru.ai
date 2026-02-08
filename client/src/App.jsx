// =============================================================================
// client/src/App.jsx — Root Application Component
// =============================================================================
//
// PURPOSE:
//   Simple single-page drive-thru ordering kiosk application.
//   Customers order via voice and see a visual menu with their order updating.
//
// =============================================================================

import CustomerKiosk from './pages/CustomerKiosk';

export default function App() {
  return <CustomerKiosk />;
}
