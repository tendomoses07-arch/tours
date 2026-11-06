import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Ensure all /api and /uploads requests resolve to the KOLA TOURS backend (port 5000)
// even if the frontend is opened via a separate dev server port, 127.0.0.1, or Live Server.
const nativeFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input?.url || '';
  const isApiOrUpload = url.startsWith('/api/') || url === '/api' || url.startsWith('/uploads/');

  if (!isApiOrUpload) {
    return nativeFetch(input, init);
  }

  const currentPort = window.location.port;
  const isDirectBackendOrigin = currentPort === '5000';

  // If opened from a non-5000 port (e.g., Live Server 5500 or static preview), try backend origins directly if relative fails
  const candidateUrls = isDirectBackendOrigin
    ? [url, `http://localhost:5000${url}`, `http://127.0.0.1:5000${url}`]
    : [`http://localhost:5000${url}`, `http://127.0.0.1:5000${url}`, url];

  let lastError = null;
  for (const candidate of candidateUrls) {
    try {
      const response = await nativeFetch(candidate, init);
      // If a static server returned 404/405 HTML for an /api route, try the next candidate
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

  throw lastError || new Error('Unable to connect to the KOLA TOURS server on port 5000.');
};

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
