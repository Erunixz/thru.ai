// =============================================================================
// client/src/main.jsx — React App Entry Point
// =============================================================================
// This file bootstraps the React application. It renders <App /> into the
// #root div in index.html. That's it — all routing and logic lives in App.jsx.
// =============================================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
