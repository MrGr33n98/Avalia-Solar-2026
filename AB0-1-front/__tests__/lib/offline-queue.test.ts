import {
  flushOfflineMutationQueue,
  queueOfflineMutation,
  requestOfflineQueueSync,
} from '@/lib/offline/mutationQueue';
import {
  isQueuedOfflineMutationResult,
  sendMutationWithOfflineQueue,
} from '@/lib/offline/offlineTransport';
import type { QueuedMutationRecord } from '@/lib/offline/db';

jest.mock('@/lib/offline/db', () => ({
  getOfflineDb: jest.fn(),
}));

const { getOfflineDb } = jest.requireMock('@/lib/offline/db') as {
  getOfflineDb: jest.Mock;
};

describe('offline mutation queue', () => {
  const originalFetch = global.fetch;
  const originalOfflineFlag = process.env.NEXT_PUBLIC_ENABLE_MOBILE_OFFLINE;
  let records: QueuedMutationRecord[];
  let nextId: number;

  const createDb = () => ({
    mutationQueue: {
      toArray: jest.fn(async () => records.map((record) => ({ ...record }))),
      count: jest.fn(async () => records.length),
      add: jest.fn(async (record: QueuedMutationRecord) => {
        const id = nextId++;
        records.push({ ...record, id });
        return id;
      }),
      where: jest.fn((index: keyof QueuedMutationRecord) => ({
        equals: (value: unknown) => ({
          toArray: async () =>
            records
              .filter((record) => record[index] === value)
              .map((record) => ({ ...record })),
        }),
      })),
      bulkDelete: jest.fn(async (ids: number[]) => {
        records = records.filter((record) => !ids.includes(record.id as number));
      }),
      update: jest.fn(async (id: number, patch: Partial<QueuedMutationRecord>) => {
        records = records.map((record) =>
          record.id === id ? { ...record, ...patch } : record
        );
      }),
      delete: jest.fn(async (id: number) => {
        records = records.filter((record) => record.id !== id);
      }),
    },
  });

  const setNavigatorOnline = (online: boolean) => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: online,
    });
  };

  beforeEach(() => {
    process.env.NEXT_PUBLIC_ENABLE_MOBILE_OFFLINE = 'true';
    records = [];
    nextId = 1;
    getOfflineDb.mockReturnValue(createDb());
    global.fetch = jest.fn();
    setNavigatorOnline(true);
    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: undefined,
    });
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_ENABLE_MOBILE_OFFLINE = originalOfflineFlag;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('deduplicates queued mutations by conflict key', async () => {
    records.push({
      id: 1,
      url: '/api/v1/analytics/track',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"event":"old"}',
      conflictKey: 'analytics:1',
      requestKey: 'POST:/api/v1/analytics/track:analytics:1',
      createdAt: Date.now() - 2000,
      updatedAt: Date.now() - 2000,
      retryCount: 0,
      nextRetryAt: Date.now() - 1000,
      lastError: null,
      metadata: null,
    });

    await queueOfflineMutation({
      url: '/api/v1/analytics/track',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"event":"new"}',
      conflictKey: 'analytics:1',
    });

    expect(records).toHaveLength(1);
    expect(records[0].body).toBe('{"event":"new"}');
  });

  it('dispatches queue changed events when a mutation is queued', async () => {
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

    await queueOfflineMutation({
      url: '/api/v1/banner_events',
      method: 'POST',
      body: '{"banner_event":true}',
    });

    expect(dispatchSpy).toHaveBeenCalled();
  });

  it('returns false when service worker sync is unavailable', async () => {
    await expect(requestOfflineQueueSync()).resolves.toBe(false);
  });

  it('registers background sync when supported', async () => {
    const register = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: {
        ready: Promise.resolve({
          sync: { register },
          active: { postMessage: jest.fn() },
        }),
      },
    });

    await expect(requestOfflineQueueSync()).resolves.toBe(true);
    expect(register).toHaveBeenCalled();
  });

  it('falls back to postMessage when sync api is unavailable', async () => {
    const postMessage = jest.fn();
    Object.defineProperty(window.navigator, 'serviceWorker', {
      configurable: true,
      value: {
        ready: Promise.resolve({
          active: { postMessage },
        }),
      },
    });

    await expect(requestOfflineQueueSync()).resolves.toBe(true);
    expect(postMessage).toHaveBeenCalledWith({ type: 'SYNC_OFFLINE_QUEUE' });
  });

  it('short-circuits queue flush while the browser is offline', async () => {
    setNavigatorOnline(false);
    records.push({
      id: 1,
      url: '/api/v1/analytics/track',
      method: 'POST',
      headers: {},
      body: '{"event":"queued"}',
      conflictKey: 'analytics:offline',
      requestKey: 'POST:/api/v1/analytics/track:analytics:offline',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      retryCount: 0,
      nextRetryAt: Date.now(),
      lastError: null,
      metadata: null,
    });

    const result = await flushOfflineMutationQueue();

    expect(result.processed).toBe(0);
    expect(result.remaining).toBe(1);
  });

  it('removes queued mutations after a successful flush', async () => {
    records.push({
      id: 1,
      url: '/api/v1/analytics/track',
      method: 'POST',
      headers: {},
      body: '{"event":"ok"}',
      conflictKey: 'analytics:success',
      requestKey: 'POST:/api/v1/analytics/track:analytics:success',
      createdAt: Date.now() - 1000,
      updatedAt: Date.now() - 1000,
      retryCount: 0,
      nextRetryAt: Date.now() - 1000,
      lastError: null,
      metadata: null,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
    });

    const result = await flushOfflineMutationQueue();

    expect(result.succeeded).toBe(1);
    expect(result.remaining).toBe(0);
    expect(records).toHaveLength(0);
  });

  it('retries retryable failures during flush', async () => {
    records.push({
      id: 1,
      url: '/api/v1/analytics/track',
      method: 'POST',
      headers: {},
      body: '{"event":"retry"}',
      conflictKey: 'analytics:retry',
      requestKey: 'POST:/api/v1/analytics/track:analytics:retry',
      createdAt: Date.now() - 1000,
      updatedAt: Date.now() - 1000,
      retryCount: 0,
      nextRetryAt: Date.now() - 1000,
      lastError: null,
      metadata: null,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    });

    const result = await flushOfflineMutationQueue();

    expect(result.retried).toBe(1);
    expect(records).toHaveLength(1);
    expect(records[0].retryCount).toBe(1);
    expect(records[0].lastError).toContain('[503]');
  });

  it('discards non-retryable failures during flush', async () => {
    records.push({
      id: 1,
      url: '/api/v1/consent/revoke',
      method: 'POST',
      headers: {},
      body: '{"revoke_reason":"user_request"}',
      conflictKey: 'consent:revoke:user_request',
      requestKey: 'POST:/api/v1/consent/revoke:consent:revoke:user_request',
      createdAt: Date.now() - 1000,
      updatedAt: Date.now() - 1000,
      retryCount: 0,
      nextRetryAt: Date.now() - 1000,
      lastError: null,
      metadata: null,
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    });

    const result = await flushOfflineMutationQueue();

    expect(result.failed).toBe(1);
    expect(result.remaining).toBe(0);
    expect(records).toHaveLength(0);
  });

  it('queues mutations immediately when navigator is offline', async () => {
    setNavigatorOnline(false);

    const result = await sendMutationWithOfflineQueue('/api/v1/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event: 'queued-offline' }),
    });

    expect(isQueuedOfflineMutationResult(result)).toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(records).toHaveLength(1);
  });

  it('returns the network response when online requests succeed', async () => {
    const response = {
      ok: true,
      status: 200,
      statusText: 'OK',
    };
    (global.fetch as jest.Mock).mockResolvedValue(response);

    const result = await sendMutationWithOfflineQueue('/api/v1/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event: 'network-success' }),
    });

    expect(result).toBe(response);
    expect(records).toHaveLength(0);
  });

  it('queues retryable mutations after network failures', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network down'));

    const result = await sendMutationWithOfflineQueue('/api/v1/banner_events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ banner_event: true }),
    });

    expect(isQueuedOfflineMutationResult(result)).toBe(true);
    expect(records).toHaveLength(1);
  });
});
