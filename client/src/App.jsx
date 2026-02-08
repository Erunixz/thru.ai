// =============================================================================
// client/src/App.jsx — Root Application Component
// =============================================================================
//
// PURPOSE:
//   Sets up the customer kiosk interface for the drive-thru ordering system.
//   The kiosk shows conversation, order summary, and voice interaction.
//
// ARCHITECTURE:
//   Customer Kiosk connects to ElevenLabs Conversational AI Agent via WebSocket.
//   The agent handles speech-to-text, natural language processing, and text-to-speech.
//   Order updates are sent to Express backend and broadcast for tracking.
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

        {/* Kitchen display — employee-facing order management system */}
        <Route path="/kitchen" element={<KitchenDisplay />} />
      </Routes>
    </BrowserRouter>
  );
}
