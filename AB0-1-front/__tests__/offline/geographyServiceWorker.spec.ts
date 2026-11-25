import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import {
  Headers as FetchHeaders,
  Request as FetchRequest,
  Response as FetchResponse,
} from 'node-fetch';

type Listener = (event: Record<string, unknown>) => void;

const serviceWorkerSource = readFileSync(resolve(process.cwd(), 'public/sw.js'), 'utf8');
const CACHE_TIMESTAMP_HEADER = 'x-avalia-geo-cache-stored-at';
const ORIGIN = 'https://avaliasolar.test';

function createRequest(url: string, init: RequestInit = {}) {
  const request = new FetchRequest(url, init);
  Object.defineProperty(request, 'credentials', {
    value: init.credentials || 'same-origin',
  });
  if (init.mode) Object.defineProperty(request, 'mode', { value: init.mode });
  return request;
}

function createServiceWorkerHarness() {
  const listeners = new Map<string, Listener>();
  const entriesByCache = new Map<string, Map<string, FetchResponse>>();
  const fetchMock = jest.fn();
  const cacheFor = (name: string) => {
    const entries = entriesByCache.get(name) || new Map<string, FetchResponse>();
    entriesByCache.set(name, entries);
    const keyFor = (request: Request | string) =>
      request instanceof FetchRequest ? request.url : new URL(request, ORIGIN).toString();

    return {
      match: jest.fn(async (request: Request | string) => entries.get(keyFor(request))?.clone()),
      put: jest.fn(async (request: FetchRequest | string, response: FetchResponse) => {
        entries.set(keyFor(request), response.clone());
      }),
      delete: jest.fn(async (request: Request | string) => entries.delete(keyFor(request))),
    };
  };
  const cacheObjects = new Map<string, ReturnType<typeof cacheFor>>();
  const caches = {
    open: jest.fn(async (name: string) => {
      if (!cacheObjects.has(name)) cacheObjects.set(name, cacheFor(name));
      return cacheObjects.get(name)!;
    }),
    keys: jest.fn(async () => Array.from(entriesByCache.keys())),
    delete: jest.fn(async (name: string) => entriesByCache.delete(name)),
  };
  const self = {
    location: { origin: ORIGIN },
    clients: { claim: jest.fn(async () => undefined) },
    addEventListener: jest.fn((type: string, listener: Listener) => listeners.set(type, listener)),
    skipWaiting: jest.fn(async () => undefined),
  };

  vm.runInNewContext(serviceWorkerSource, {
    self,
    caches,
    fetch: fetchMock,
    Request: FetchRequest,
    Response: FetchResponse,
    Headers: FetchHeaders,
    URL,
    URLSearchParams,
    AbortController,
    Date,
    Math,
    Promise,
    Set,
    Array,
    String,
    Number,
    RegExp,
    JSON,
    Error,
    console,
    setTimeout,
    clearTimeout,
    indexedDB: {},
  });

  return { listeners, entriesByCache, fetchMock, caches, cacheObjects };
}

function publicCatalogResponse(body = { cities: ['Florianópolis'] }) {
  return new FetchResponse(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      ETag: '"catalog-r1"',
      'X-Locations-Version': 'catalog-r1',
    },
  });
}

async function dispatchFetch(
  harness: ReturnType<typeof createServiceWorkerHarness>,
  url: string,
  init: RequestInit = { credentials: 'omit' }
) {
  let responsePromise: Promise<FetchResponse> | undefined;
  const backgroundTasks: Promise<unknown>[] = [];
  harness.listeners.get('fetch')?.({
    request: createRequest(url, init),
    respondWith: (promise: Promise<FetchResponse>) => {
      responsePromise = promise;
    },
    waitUntil: (promise: Promise<unknown>) => backgroundTasks.push(promise),
  });

  if (!responsePromise) return { intercepted: false as const, backgroundTasks };
  const response = await responsePromise;
  return { intercepted: true as const, response, backgroundTasks };
}

describe('geographic Service Worker cache boundary', () => {
  it('does not intercept company records or malformed geography queries', async () => {
    const harness = createServiceWorkerHarness();

    const company = await dispatchFetch(harness, `${ORIGIN}/api/v1/companies/42`);
    const invalidUf = await dispatchFetch(harness, `${ORIGIN}/api/v1/companies/cities?state=XX`);
    const extraQuery = await dispatchFetch(
      harness,
      `${ORIGIN}/api/v1/companies/cities?state=SC&status=active`
    );

    expect(company.intercepted).toBe(false);
    expect(invalidUf.intercepted).toBe(false);
    expect(extraQuery.intercepted).toBe(false);
    expect(harness.fetchMock).not.toHaveBeenCalled();
  });

  it('stores only public catalog JSON in a versioned geography namespace', async () => {
    const harness = createServiceWorkerHarness();
    harness.fetchMock.mockResolvedValue(publicCatalogResponse());

    const result = await dispatchFetch(harness, `${ORIGIN}/api/v1/companies/cities?state=SC`);

    expect(result.intercepted).toBe(true);
    if (!result.intercepted) return;
    expect(result.response.status).toBe(200);
    expect(result.response.headers.get(CACHE_TIMESTAMP_HEADER)).toBeNull();
    expect(harness.caches.open).toHaveBeenCalledWith(expect.stringMatching(/^avalia-geography-/));
    expect(Array.from(harness.entriesByCache.keys())).toEqual([
      expect.stringMatching(/^avalia-geography-/),
    ]);
  });

  it('rejects credentialed requests and does not cache private or error responses', async () => {
    const credentialed = createServiceWorkerHarness();
    const authRequest = await dispatchFetch(
      credentialed,
      `${ORIGIN}/api/v1/companies/cities?state=SC`,
      { credentials: 'omit', headers: { Authorization: 'Bearer opaque' } }
    );
    expect(authRequest.intercepted).toBe(false);

    const privateResponseHarness = createServiceWorkerHarness();
    privateResponseHarness.fetchMock.mockResolvedValue(
      new FetchResponse('{"cities":[]}', {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, no-store',
        },
      })
    );
    await dispatchFetch(privateResponseHarness, `${ORIGIN}/api/v1/companies/states`);
    expect(
      Array.from(privateResponseHarness.entriesByCache.values()).flatMap((entries) =>
        Array.from(entries)
      )
    ).toHaveLength(0);

    const setCookieHarness = createServiceWorkerHarness();
    setCookieHarness.fetchMock.mockResolvedValue(
      new FetchResponse('{"states":["SC"]}', {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400',
          'Set-Cookie': 'session=opaque; HttpOnly',
        },
      })
    );
    await dispatchFetch(setCookieHarness, `${ORIGIN}/api/v1/companies/states`);
    expect(
      Array.from(setCookieHarness.entriesByCache.values()).flatMap((entries) => Array.from(entries))
    ).toHaveLength(0);

    const errorHarness = createServiceWorkerHarness();
    errorHarness.fetchMock.mockResolvedValue(new FetchResponse('{"error":"no"}', { status: 404 }));
    const error = await dispatchFetch(errorHarness, `${ORIGIN}/api/v1/companies/cities?state=SC`);
    expect(error.intercepted && error.response.status).toBe(404);
    expect(
      Array.from(errorHarness.entriesByCache.values()).flatMap((entries) => Array.from(entries))
    ).toHaveLength(0);
  });

  it('returns an explicit no-store 503 for an offline cache miss', async () => {
    const harness = createServiceWorkerHarness();
    harness.fetchMock.mockRejectedValue(new TypeError('Network unavailable'));

    const result = await dispatchFetch(harness, `${ORIGIN}/api/v1/companies/cities?state=SC`);

    expect(result.intercepted).toBe(true);
    if (!result.intercepted) return;
    expect(result.response.status).toBe(503);
    expect(result.response.headers.get('cache-control')).toBe('no-store');
  });

  it('reuses a fresh catalog without another network request', async () => {
    const harness = createServiceWorkerHarness();
    const cacheName = 'avalia-geography-2026-11-25-spec019-v6';
    const url = `${ORIGIN}/api/v1/companies/cities?state=SC`;
    const cache = await harness.caches.open(cacheName);
    await cache.put(
      createRequest(url, { credentials: 'omit' }),
      new FetchResponse('{"cities":["Florianópolis"]}', {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400',
          [CACHE_TIMESTAMP_HEADER]: String(Date.now()),
        },
      })
    );

    const result = await dispatchFetch(harness, url);

    expect(result.intercepted).toBe(true);
    if (!result.intercepted) return;
    expect(result.response.status).toBe(200);
    expect(harness.fetchMock).not.toHaveBeenCalled();
  });

  it('does not cache user navigation and only precache-safe anonymous HTML', async () => {
    const credentialed = createServiceWorkerHarness();
    credentialed.fetchMock.mockResolvedValue(
      new FetchResponse('<html>public</html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html', 'Cache-Control': 'public, max-age=300' },
      })
    );
    const credentialedResult = await dispatchFetch(credentialed, `${ORIGIN}/companies`, {
      credentials: 'same-origin',
      mode: 'navigate' as RequestMode,
    });
    expect(credentialedResult.intercepted).toBe(true);
    expect(
      Array.from(credentialed.entriesByCache.values()).flatMap((entries) => Array.from(entries))
    ).toHaveLength(0);

    const anonymous = createServiceWorkerHarness();
    anonymous.fetchMock.mockResolvedValue(
      new FetchResponse('<html>public</html>', {
        status: 200,
        headers: { 'Content-Type': 'text/html', 'Cache-Control': 'public, max-age=300' },
      })
    );
    await dispatchFetch(anonymous, `${ORIGIN}/companies`, {
      credentials: 'omit',
      mode: 'navigate' as RequestMode,
    });
    expect(
      Array.from(anonymous.entriesByCache.values()).flatMap((entries) => Array.from(entries))
    ).toHaveLength(1);
  });

  it('cleans only old Avalia caches and preserves caches owned by other features', async () => {
    const harness = createServiceWorkerHarness();
    harness.entriesByCache.set('avalia-api-2026-08-17-v5', new Map());
    harness.entriesByCache.set('other-feature-cache', new Map());

    const activation: Promise<unknown>[] = [];
    harness.listeners.get('activate')?.({
      waitUntil: (promise: Promise<unknown>) => activation.push(promise),
    });
    await Promise.all(activation);

    expect(harness.caches.delete).toHaveBeenCalledWith('avalia-api-2026-08-17-v5');
    expect(harness.caches.delete).not.toHaveBeenCalledWith('other-feature-cache');
    expect(harness.entriesByCache.has('other-feature-cache')).toBe(true);
  });
});
