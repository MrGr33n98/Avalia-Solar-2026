const SW_VERSION = '2026-08-17-v5';
const APP_SHELL_CACHE = `avalia-app-shell-${SW_VERSION}`;
const STATIC_CACHE = `avalia-static-${SW_VERSION}`;
const API_CACHE = `avalia-api-${SW_VERSION}`;
const OFFLINE_DB_NAME = 'avalia-mobile-offline';
const OFFLINE_MUTATION_STORE = 'mutationQueue';
const OFFLINE_SYNC_TAG = 'avalia-offline-sync';
const OFFLINE_FALLBACK_ROUTE = '/offline';
const NAVIGATION_PRECACHE_TIMEOUT_MS = 5000;
const OFFLINE_SUPPORTED_ROUTES = ['/', '/categories', '/companies', '/compare', '/blog', '/dashboard'];
const PRECACHE_URLS = [
  ...OFFLINE_SUPPORTED_ROUTES,
  OFFLINE_FALLBACK_ROUTE,
  '/favicon.ico',
  '/manifest.webmanifest',
  '/icons/avalia-solar-192x192.png',
  '/icons/avalia-solar-512x512.png',
  '/icons/avalia-solar-maskable-192x192.png',
  '/icons/avalia-solar-maskable-512x512.png',
  '/assets/categories/3d/mercado-livre-de-energia.png',
];

const normalizePath = (value) => {
  try {
    const url = value.startsWith('http') ? new URL(value) : new URL(value, self.location.origin);
    const pathname = url.pathname || '/';
    if (pathname === '/') return '/';
    return pathname.replace(/\/+$/, '') || '/';
  } catch {
    if (!value) return '/';
    return value === '/' ? value : value.replace(/\/+$/, '') || '/';
  }
};

const isStaticAssetPath = (pathname) =>
  pathname.startsWith('/_next/static/') ||
  pathname.startsWith('/images/') ||
  /\.(?:css|js|mjs|woff2?|png|jpe?g|webp|svg|ico)$/i.test(pathname);

const isApiCacheablePath = (pathname) =>
  /^\/api\/v1\/(categories|banners|products|companies|states|cities)\b/i.test(
    normalizePath(pathname)
  );

const isRetryableStatus = (status) =>
  status === 408 || status === 425 || status === 429 || status >= 500;

const getRetryDelayMs = (retryCount) =>
  Math.min(30000, 1500 * Math.pow(2, retryCount));

const buildOfflineDocumentResponse = () =>
  new Response(
    `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>AvaliaSolar offline</title>
    <style>
      :root { color-scheme: light; }
      body {
        margin: 0;
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #f3efe7;
        color: #2a241f;
      }
      main {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        box-sizing: border-box;
      }
      section {
        width: min(100%, 720px);
        background: #ffffff;
        border: 1px solid #e4ddd2;
        border-radius: 24px;
        padding: 24px;
        box-shadow: 0 10px 30px rgba(42, 36, 31, 0.08);
      }
      span {
        display: inline-flex;
        border-radius: 999px;
        background: #fef3c7;
        color: #92400e;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        padding: 6px 12px;
      }
      h1 {
        margin: 16px 0 12px;
        font-size: clamp(2rem, 4vw, 2.5rem);
        line-height: 1.1;
      }
      p {
        margin: 0;
        color: rgba(42, 36, 31, 0.8);
        line-height: 1.7;
      }
      ul {
        margin: 20px 0 0;
        padding-left: 18px;
        color: rgba(42, 36, 31, 0.76);
      }
      li + li {
        margin-top: 8px;
      }
      nav {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
        margin-top: 24px;
      }
      a {
        display: inline-flex;
        justify-content: center;
        padding: 14px 16px;
        border-radius: 16px;
        border: 1px solid #e4ddd2;
        color: #2a241f;
        font-weight: 600;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <main>
      <section>
        <span>Offline mode</span>
        <h1>Você está sem conexão no momento</h1>
        <p>O AvaliaSolar continua disponível nas páginas principais já preparadas para a Sprint 2. Quando a conexão voltar, a fila local será sincronizada automaticamente.</p>
        <ul>
          <li>Navegação offline para rotas públicas prioritárias</li>
          <li>Cache resiliente para dados públicos compatíveis</li>
          <li>Fila local para eventos com reenvio em background</li>
        </ul>
        <nav>
          <a href="/">Voltar para a home</a>
          <a href="/dashboard">Dashboard</a>
          <a href="/categories">Explorar categorias</a>
          <a href="/companies">Ver empresas</a>
          <a href="/compare">Comparar opções</a>
          <a href="/blog">Ler conteúdos</a>
        </nav>
      </section>
    </main>
  </body>
</html>`,
    {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    }
  );

const fetchWithTimeout = async (input, timeoutMs = NAVIGATION_PRECACHE_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
};

const cacheDocumentAtPath = async (cache, pathname, response) => {
  await cache.put(normalizePath(pathname), response.clone());
};

const ensureOfflineFallbackDocument = async (cache) => {
  const offlineFallbackResponse = buildOfflineDocumentResponse();

  try {
    const response = await fetchWithTimeout(OFFLINE_FALLBACK_ROUTE);
    if (response?.ok) {
      await cacheDocumentAtPath(cache, OFFLINE_FALLBACK_ROUTE, response);
      return response;
    }
  } catch {}

  await cacheDocumentAtPath(cache, OFFLINE_FALLBACK_ROUTE, offlineFallbackResponse);
  return offlineFallbackResponse;
};

const precacheSupportedRoutes = async (cache, fallbackResponse) => {
  await Promise.all(
    OFFLINE_SUPPORTED_ROUTES.map(async (route) => {
      try {
        const response = await fetchWithTimeout(route);
        if (response?.ok) {
          await cacheDocumentAtPath(cache, route, response);
          return;
        }
      } catch {}

      await cacheDocumentAtPath(cache, route, fallbackResponse);
    })
  );
};

const precacheStaticResources = async () => {
  const cache = await caches.open(STATIC_CACHE);

  await Promise.all(
    PRECACHE_URLS.filter((url) => url !== OFFLINE_FALLBACK_ROUTE).map(async (url) => {
      if (OFFLINE_SUPPORTED_ROUTES.includes(url)) {
        return;
      }

      try {
        const response = await fetchWithTimeout(url);
        if (response?.ok) {
          await cache.put(url, response.clone());
        }
      } catch {}
    })
  );
};

const openOfflineDb = () =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(OFFLINE_MUTATION_STORE)) {
        const store = db.createObjectStore(OFFLINE_MUTATION_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('requestKey', 'requestKey', { unique: false });
        store.createIndex('conflictKey', 'conflictKey', { unique: false });
        store.createIndex('nextRetryAt', 'nextRetryAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const transactionDone = (transaction) =>
  new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });

const getQueuedMutations = async (db) => {
  const transaction = db.transaction(OFFLINE_MUTATION_STORE, 'readonly');
  const store = transaction.objectStore(OFFLINE_MUTATION_STORE);

  const allRecords = await new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });

  await transactionDone(transaction);

  return allRecords
    .filter((record) => record.nextRetryAt <= Date.now())
    .sort((left, right) => left.createdAt - right.createdAt);
};

const getQueuedMutationCount = async (db) => {
  const transaction = db.transaction(OFFLINE_MUTATION_STORE, 'readonly');
  const store = transaction.objectStore(OFFLINE_MUTATION_STORE);

  const count = await new Promise((resolve, reject) => {
    const request = store.count();
    request.onsuccess = () => resolve(request.result || 0);
    request.onerror = () => reject(request.error);
  });

  await transactionDone(transaction);
  return count;
};

const deleteQueuedMutation = async (db, id) => {
  const transaction = db.transaction(OFFLINE_MUTATION_STORE, 'readwrite');
  transaction.objectStore(OFFLINE_MUTATION_STORE).delete(id);
  await transactionDone(transaction);
};

const retryQueuedMutation = async (db, mutation, errorMessage, status) => {
  const nextRetryCount = (mutation.retryCount || 0) + 1;

  if (
    (typeof status === 'number' && status >= 400 && !isRetryableStatus(status)) ||
    nextRetryCount > 5
  ) {
    await deleteQueuedMutation(db, mutation.id);
    return 'failed';
  }

  const transaction = db.transaction(OFFLINE_MUTATION_STORE, 'readwrite');
  const store = transaction.objectStore(OFFLINE_MUTATION_STORE);
  store.put({
    ...mutation,
    retryCount: nextRetryCount,
    nextRetryAt: Date.now() + getRetryDelayMs(mutation.retryCount || 0),
    updatedAt: Date.now(),
    lastError: errorMessage,
  });
  await transactionDone(transaction);
  return 'retried';
};

const notifyClients = async (payload) => {
  const clients = await self.clients.matchAll({
    includeUncontrolled: true,
    type: 'window',
  });

  clients.forEach((client) => client.postMessage(payload));
};

const processQueuedMutations = async () => {
  const db = await openOfflineDb();
  const queuedMutations = await getQueuedMutations(db);
  let succeeded = 0;
  let retried = 0;
  let failed = 0;

  for (const mutation of queuedMutations) {
    try {
      const response = await fetch(mutation.url, {
        method: mutation.method,
        headers: mutation.headers || {},
        body: mutation.body || undefined,
        credentials: 'include',
      });

      if (response.ok) {
        await deleteQueuedMutation(db, mutation.id);
        succeeded += 1;
        continue;
      }

      const result = await retryQueuedMutation(
        db,
        mutation,
        `[${response.status}] ${response.statusText}`,
        response.status
      );
      if (result === 'retried') {
        retried += 1;
      } else {
        failed += 1;
      }
    } catch (error) {
      const result = await retryQueuedMutation(
        db,
        mutation,
        error && error.message ? error.message : 'Offline mutation failed'
      );
      if (result === 'retried') {
        retried += 1;
      } else {
        failed += 1;
      }
    }
  }

  const remaining = await getQueuedMutationCount(db);

  await notifyClients({
    type: 'OFFLINE_QUEUE_CHANGED',
    queued: remaining,
  });

  await notifyClients({
    type: 'OFFLINE_QUEUE_SYNC',
    processed: queuedMutations.length,
    succeeded,
    retried,
    failed,
    remaining,
  });
};

const cacheNavigationResponse = async (request, response) => {
  if (!response || !response.ok) return response;
  const cache = await caches.open(APP_SHELL_CACHE);
  const normalizedPath = normalizePath(new URL(request.url).pathname);
  await cache.put(normalizedPath, response.clone());
  return response;
};

const handleNavigationRequest = async (request) => {
  const cache = await caches.open(APP_SHELL_CACHE);
  const normalizedPath = normalizePath(new URL(request.url).pathname);

  try {
    const response = await fetch(request);
    return await cacheNavigationResponse(request, response);
  } catch (error) {
    const cachedResponse =
      (await cache.match(normalizedPath)) ||
      (await cache.match(request)) ||
      (await cache.match(OFFLINE_FALLBACK_ROUTE));

    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
};

const handleCacheFirst = async (request) => {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) return cachedResponse;

  const networkResponse = await fetch(request);
  if (networkResponse && networkResponse.ok) {
    await cache.put(request, networkResponse.clone());
  }

  return networkResponse;
};

// Next.js chunks are immutable, but the HTML that references them can outlive
// a deployment in a browser or intermediary cache. Prefer the current chunk
// and use a previously cached copy only when the upstream is temporarily bad.
const handleNextStaticRequest = async (request) => {
  const cache = await caches.open(STATIC_CACHE);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }

    const cachedResponse = await cache.match(request);
    return cachedResponse || networkResponse;
  } catch {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) return cachedResponse;
    throw new Error('Next static asset unavailable');
  }
};

const handleStaleWhileRevalidate = async (request) => {
  const cache = await caches.open(API_CACHE);
  const cachedResponse = await cache.match(request);

  const networkPromise = fetch(request)
    .then(async (response) => {
      if (response && response.ok) {
        await cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cachedResponse) {
    return cachedResponse;
  }

  const networkResponse = await networkPromise;
  if (networkResponse) return networkResponse;

  return new Response(JSON.stringify({ error: 'Offline cache unavailable' }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  });
};

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const appShellCache = await caches.open(APP_SHELL_CACHE);
      const offlineFallbackResponse = await ensureOfflineFallbackDocument(appShellCache);

      await precacheSupportedRoutes(appShellCache, offlineFallbackResponse);
      await precacheStaticResources();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(
            (cacheName) =>
              ![APP_SHELL_CACHE, STATIC_CACHE, API_CACHE].includes(cacheName)
          )
          .map((cacheName) => caches.delete(cacheName))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  if (url.origin === self.location.origin && isStaticAssetPath(url.pathname)) {
    event.respondWith(
      url.pathname.startsWith('/_next/static/')
        ? handleNextStaticRequest(request)
        : handleCacheFirst(request)
    );
    return;
  }

  if (url.origin === self.location.origin && isApiCacheablePath(url.pathname)) {
    event.respondWith(handleStaleWhileRevalidate(request));
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (event.data && event.data.type === 'SYNC_OFFLINE_QUEUE') {
    event.waitUntil(processQueuedMutations());
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === OFFLINE_SYNC_TAG) {
    event.waitUntil(processQueuedMutations());
  }
});

// --- Push Notifications ---
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'Avalia Solar';
    const options = {
      body: data.body,
      icon: data.icon || '/avalia_symbol.png',
      badge: '/solar-market-ico-avalia-solar.png',
      data: data.data || {},
      vibrate: [200, 100, 200],
      tag: data.tag || 'avalia-solar-notification',
      renotify: data.renotify || false,
    };

    if (data.actions) {
      options.actions = data.actions;
    }

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('Error parsing push data', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/dashboard/inbox';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
