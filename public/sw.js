/**
 * Service Worker for NTTA Toll Expense Tracker
 *
 * IMPORTANT: This service worker attempts to proxy API requests to NTTA's servers.
 * However, due to CORS restrictions and browser security policies, this approach
 * has limitations. Service workers CANNOT modify Origin and Referer headers,
 * which NTTA's API requires. This means API calls will likely fail in production
 * without a backend proxy server.
 *
 * This service worker provides:
 * - API request interception
 * - Offline support with cached assets
 * - Transaction caching integration
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `ntta-toll-tracker-${CACHE_VERSION}`;
const NTTA_API_BASE = 'https://sptrips.ntta.org/CustomerPortal/api';

// Assets to cache for offline support
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/tollway-logo.png',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/apple-touch-icon.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      // Skip waiting to activate immediately
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      // Claim all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }

  // Handle static assets with cache-first strategy
  event.respondWith(handleStaticRequest(event.request));
});

/**
 * Handle API requests with network-first strategy
 *
 * LIMITATION: Cannot modify Origin/Referer headers due to browser security.
 * This will likely result in CORS errors when deployed.
 */
async function handleApiRequest(request) {
  try {
    const url = new URL(request.url);
    const apiPath = url.pathname.replace('/api', '');
    const nttaUrl = `${NTTA_API_BASE}${apiPath}${url.search}`;

    // Clone the request to modify it
    const modifiedRequest = new Request(nttaUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' ? await request.clone().blob() : null,
      credentials: 'omit',
      mode: 'cors',
    });

    console.log('[Service Worker] Proxying API request to:', nttaUrl);

    // Attempt to fetch from network
    const response = await fetch(modifiedRequest);

    return response;
  } catch (error) {
    console.error('[Service Worker] API request failed:', error);

    // Return error response
    return new Response(
      JSON.stringify({
        error: 'API request failed',
        message: error.message,
        note: 'This may be due to CORS restrictions. A backend proxy server is recommended.',
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Handle static assets with cache-first strategy
 * Falls back to network if not in cache
 */
async function handleStaticRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Fall back to network
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[Service Worker] Network request failed:', error);

    // Return offline page or error
    return new Response(
      'Offline - Unable to load resource',
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain' },
      }
    );
  }
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});
