import React from 'react';
import { createRoot } from 'react-dom/client';
import FitApp from './FitApp';
import './index.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FitApp />
  </React.StrictMode>,
);

// Register the service worker for offline / installable PWA support.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline support is best-effort; the app works without it */
    });
  });
}
