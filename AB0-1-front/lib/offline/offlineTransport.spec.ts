jest.mock('./config', () => ({
  isMobileOfflineEnabled: () => true,
}));

jest.mock('./mutationQueue', () => ({
  queueOfflineMutation: jest.fn().mockResolvedValue({ mutationId: 7, queued: 1 }),
  requestOfflineQueueSync: jest.fn().mockResolvedValue(true),
  flushOfflineMutationQueue: jest.fn(),
}));

import { sendMutationWithOfflineQueue } from './offlineTransport';

const { queueOfflineMutation, requestOfflineQueueSync } = jest.requireMock('./mutationQueue') as {
  queueOfflineMutation: jest.Mock;
  requestOfflineQueueSync: jest.Mock;
};

describe('offline banner mutation transport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
  });

  it('enfileira evento de banner quando navegador está offline', async () => {
    const result = await sendMutationWithOfflineQueue(
      '/api/v1/banner_events',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banner_event: { banner_id: 10, event_type: 'impression' } }),
      },
      { conflictKey: 'banner:10:impression:instance-1', metadata: { queue: 'banner-events' } }
    );

    expect(result).toEqual({ queued: true, offline: true });
    expect(queueOfflineMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/v1/banner_events',
        method: 'POST',
        conflictKey: 'banner:10:impression:instance-1',
      })
    );
    expect(requestOfflineQueueSync).toHaveBeenCalledTimes(1);
  });

  it('enfileira quando fetch falha mesmo com rede marcada online', async () => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    global.fetch = jest.fn().mockRejectedValue(new Error('network down')) as jest.Mock;

    const result = await sendMutationWithOfflineQueue(
      '/api/v1/banner_events',
      { method: 'POST', body: '{"banner_event":{"banner_id":10}}' },
      { conflictKey: 'banner:10:click:instance-2' }
    );

    expect(result).toEqual(expect.objectContaining({ queued: true, offline: true }));
    expect(queueOfflineMutation).toHaveBeenCalledTimes(1);
    expect(requestOfflineQueueSync).toHaveBeenCalledTimes(1);
  });
});
