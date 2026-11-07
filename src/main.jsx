import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Ensure all /api and /uploads requests hit the current origin first with no-store caching,
// and only fall back to localhost:5000 if running on a local static dev port (e.g., 5173 / 5500).
const nativeFetch = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input?.url || '';
  const isApiOrUpload = url.startsWith('/api/') || url === '/api' || url.startsWith('/uploads/');

  if (!isApiOrUpload) {
    return nativeFetch(input, init);
  }

  const fetchOptions = url.startsWith('/api/')
    ? { ...init, cache: 'no-store' }
    : init;

  const isLocalHost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.protocol === 'file:';

  // Always try the current server origin (url) FIRST so deployed cloud instances never hit local localhost:5000
  const candidateUrls = isLocalHost && window.location.port !== '5000'
    ? [url, `http://localhost:5000${url}`, `http://127.0.0.1:5000${url}`]
    : [url];

  let lastError = null;
  for (const candidate of candidateUrls) {
    try {
      const response = await nativeFetch(candidate, fetchOptions);
      const contentType = response.headers.get('content-type') || '';
      if (
        url.startsWith('/api/') &&
        !contentType.includes('application/json') &&
        (response.status === 404 || response.status === 405 || response.status === 502)
      ) {
        continue;
      }
      return response;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Unable to connect to the KOLA TOURS server.');
};

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
