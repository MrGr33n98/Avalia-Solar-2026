import { api, fetchApi } from '../../lib/api';
import { ApiError } from '../../lib/api-error';

// Mock fetch
global.fetch = jest.fn();

describe('API Logic', () => {
  beforeEach(() => {
    jest.useRealTimers();
    (global.fetch as jest.Mock).mockClear();

    // Default mock implementation that handles signal
    (global.fetch as jest.Mock).mockImplementation((url, options) => {
      const signal = options.signal;
      if (signal?.aborted) {
        return Promise.reject({ name: 'AbortError', message: 'Aborted' });
      }
      return new Promise((resolve, reject) => {
        if (signal) {
          signal.addEventListener('abort', () => {
            reject({ name: 'AbortError', message: 'Aborted' });
          });
        }
      });
    });
  });

  describe('api.request', () => {
    it('uses the default number of attempts when retries is undefined', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network request failed'));

      await expect(api.request({ url: '/default-retries' })).rejects.toBeInstanceOf(ApiError);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('performs one initial attempt when retries is zero', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      });

      await expect(api.request({ url: '/no-retries', retries: 0 })).resolves.toEqual({
        data: { ok: true },
      });
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('preserves one-attempt behavior when retries is one', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network request failed'));

      await expect(api.request({ url: '/one-attempt', retries: 1 })).rejects.toBeInstanceOf(ApiError);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('returns a successful payload', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ answer: 42 }),
      });

      await expect(fetchApi('/success', { retries: 0 })).resolves.toEqual({ answer: 42 });
    });

    it('normalizes a server error as ApiError', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'server failed' }),
      });

      await expect(fetchApi('/server-error', { retries: 0 })).rejects.toMatchObject({
        name: 'ApiError',
        status: 500,
      });
    });

    it.each([undefined, 'network', {}])('normalizes non-Error rejection: %p', async (value) => {
      (global.fetch as jest.Mock).mockRejectedValue(value);

      await expect(fetchApi('/unknown-error', { retries: 0 })).rejects.toBeInstanceOf(ApiError);
    });

    it('should timeout if request takes too long', async () => {
      // Config with short timeout and no retries
      // We expect it to fail with 'Request timeout'
      const requestPromise = api.request({
        url: '/test',
        method: 'GET',
        timeout: 50, // 50ms timeout
        retries: 1,
      });

      await expect(requestPromise).rejects.toThrow('Request timeout');
    });

    it('should handle AbortError correctly', async () => {
      // Mock fetch to throw AbortError immediately
      (global.fetch as jest.Mock).mockRejectedValue({ name: 'AbortError' });

      const requestPromise = api.request({
        url: '/test',
        method: 'GET',
        retries: 1,
      });

      await expect(requestPromise).rejects.toThrow('Request timeout');
    });

    it('should handle 404 error correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: 'Resource not found' }),
      });

      const requestPromise = api.request({
        url: '/not-found',
        method: 'GET',
        retries: 1,
      });

      await expect(requestPromise).rejects.toThrow('[404] Resource not found');
    });
  });

  describe('fetchApi', () => {
    it('should provide detailed 404 error message', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: 'Resource not found' }),
      });

      await expect(fetchApi('/test-404')).rejects.toThrow(
        /\[404\] O recurso solicitado não foi encontrado/
      );
    });
  });
});
