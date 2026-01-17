
import { api } from '../../lib/api';

// Mock fetch
global.fetch = jest.fn();

describe('API Timeout Logic', () => {
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

  it('should timeout if request takes too long', async () => {
    // Config with short timeout and no retries
    // We expect it to fail with 'Request timeout'
    const requestPromise = api.request({ 
      url: '/test', 
      method: 'GET',
      timeout: 50, // 50ms timeout
      retries: 1
    });

    await expect(requestPromise).rejects.toThrow('Request timeout');
  });

  it('should handle AbortError correctly', async () => {
    // Mock fetch to throw AbortError immediately
    (global.fetch as jest.Mock).mockRejectedValue({ name: 'AbortError' });

    const requestPromise = api.request({ 
      url: '/test', 
      method: 'GET',
      retries: 1 
    });
    
    await expect(requestPromise).rejects.toThrow('Request timeout');
  });
});
