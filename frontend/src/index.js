import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/**
 * 📲 PWA SERVICE WORKER REGISTRATION
 * Iske bina mobile download/install ka option nahi aayega.
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('✅ LPU HUB: Service Worker Sync Successful');
      })
      .catch(error => {
        console.log('❌ LPU HUB: Service Worker Sync Failed', error);
      });
  });
}