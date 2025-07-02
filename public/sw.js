const CACHE_NAME = 'chatli-v1.1.0';
const STATIC_CACHE_NAME = 'chatli-static-v1.1.0';
const DYNAMIC_CACHE_NAME = 'chatli-dynamic-v1.1.0';

// Files to cache for offline functionality - using patterns instead of specific filenames
const STATIC_FILES = [
  '/',
  '/manifest.json',
  '/img/logo.png'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/auth\/me/,
  /\/api\/chats/,
  /\/api\/posts/
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .catch((error) => {
        console.error('❌ Service Worker: Cache installation failed', error);
      })
  );
  
  // Force activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('🗑️ Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('🚀 Service Worker: Activated and ready');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) {
    return;
  }

  event.respondWith(handleRequest(request, url));
});

async function handleRequest(request, url) {
  try {
    // Strategy 1: Static build files (JS/CSS) - Network First with cache fallback
    if (url.pathname.includes('/static/') || 
        url.pathname.endsWith('.js') || 
        url.pathname.endsWith('.css')) {
      return await networkFirstWithFallback(request, DYNAMIC_CACHE_NAME);
    }

    // Strategy 2: API calls - Network First with cache fallback
    if (url.pathname.startsWith('/api/') || 
        API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
      return await networkFirst(request, DYNAMIC_CACHE_NAME);
    }

    // Strategy 3: Images and media - Cache First
    if (request.destination === 'image' || 
        url.pathname.includes('/uploads/') ||
        url.pathname.includes('/img/') ||
        url.hostname.includes('cloudinary.com')) {
      return await cacheFirst(request, DYNAMIC_CACHE_NAME);
    }

    // Strategy 4: Navigation requests - Network First with offline fallback
    if (request.mode === 'navigate') {
      return await navigationHandler(request);
    }

    // Strategy 5: Everything else - Network First
    return await networkFirst(request, DYNAMIC_CACHE_NAME);

  } catch (error) {
    console.error('❌ Service Worker: Request failed', error);
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>Офлайн - CHATLI</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .logo { width: 64px; height: 64px; margin: 20px auto; }
          </style>
        </head>
        <body>
          <img src="/img/logo.png" alt="CHATLI" class="logo" />
          <h1>Офлайн байна</h1>
          <p>Интернет холболтоо шалгаад дахин оролдоно уу</p>
          <button onclick="window.location.reload()">Дахин ачаалах</button>
        </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }
    
    throw error;
  }
}

// Navigation handler with proper fallback
async function navigationHandler(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    throw new Error('Network response not ok');
  } catch (error) {
    // Try to serve from cache
    const cachedResponse = await caches.match('/');
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to basic HTML
    return new Response(
      `<!DOCTYPE html>
      <html>
      <head>
        <title>CHATLI</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body>
        <div id="root"></div>
        <script>window.location.reload()</script>
      </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// Network First with better fallback for build files
async function networkFirstWithFallback(request, cacheName) {
  try {
    console.log('🌐 Network first (build file):', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('📦 Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // For critical files, try to fetch without cache
    console.log('🔄 Trying direct fetch:', request.url);
    return fetch(request, { cache: 'no-cache' });
  }
}

// Cache First strategy - good for static files
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    console.log('📦 Cache hit:', request.url);
    return cachedResponse;
  }

  console.log('🌐 Cache miss, fetching:', request.url);
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Network First strategy - good for dynamic content
async function networkFirst(request, cacheName) {
  try {
    console.log('🌐 Network first:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('📦 Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Background sync for offline message queue
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'background-sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  try {
    console.log('📤 Syncing offline messages...');
    // Implementation would depend on your offline message storage
  } catch (error) {
    console.error('❌ Message sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Шинэ мессеж ирлээ!',
    icon: '/img/logo.png',
    badge: '/img/logo.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Харах',
        icon: '/img/logo.png'
      },
      {
        action: 'close',
        title: 'Хаах'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('CHATLI', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  console.log('💬 Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('🚀 CHATLI Service Worker loaded successfully!'); 