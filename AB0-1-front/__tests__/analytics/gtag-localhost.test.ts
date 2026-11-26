import { isLocalhost, initializeGTag, gtagEvent } from '@/lib/analytics/gtag';

describe('GA4 Localhost Contamination Prevention', () => {
  const originalEnv = process.env;

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_ENABLE_LOCAL_GA;

    // Reset dataLayer and gtag on window
    window.dataLayer = [];
    delete (window as any).gtag;
  });

  describe('isLocalhost', () => {
    it('detects localhost and 127.0.0.1 correctly', () => {
      expect(isLocalhost('localhost')).toBe(true);
      expect(isLocalhost('127.0.0.1')).toBe(true);
      expect(isLocalhost('dev.localhost')).toBe(true);
      expect(isLocalhost('192.168.1.50')).toBe(true);
      expect(isLocalhost('avaliasolar.com.br')).toBe(false);
      expect(isLocalhost('www.avaliasolar.com.br')).toBe(false);
      expect(isLocalhost('app.avaliasolar.com.br')).toBe(false);
    });
  });

  describe('initializeGTag on localhost', () => {
    it('does not initialize or push config to dataLayer when on localhost', () => {
      initializeGTag('G-TEST12345', 'localhost');

      expect(window.dataLayer).toEqual([]);
      expect(window.gtag).toBeUndefined();
    });

    it('initializes normally on production domain', () => {
      initializeGTag('G-TEST12345', 'www.avaliasolar.com.br');

      expect(typeof window.gtag).toBe('function');
      expect(window.dataLayer.length).toBeGreaterThan(0);
      expect(window.dataLayer[0][0]).toBe('config');
      expect(window.dataLayer[0][1]).toBe('G-TEST12345');
    });

    it('allows initialization on localhost when NEXT_PUBLIC_ENABLE_LOCAL_GA=true', () => {
      process.env.NEXT_PUBLIC_ENABLE_LOCAL_GA = 'true';

      initializeGTag('G-TEST12345', 'localhost');

      expect(typeof window.gtag).toBe('function');
      expect(window.dataLayer.length).toBeGreaterThan(0);
    });
  });

  describe('gtagEvent on localhost', () => {
    it('does not dispatch event to window.gtag on localhost', () => {
      const mockGtag = jest.fn();
      window.gtag = mockGtag;

      gtagEvent('generate_lead', { item_id: 123 }, 'localhost');

      expect(mockGtag).not.toHaveBeenCalled();
    });

    it('dispatches event to window.gtag when on production domain', () => {
      const mockGtag = jest.fn();
      window.gtag = mockGtag;

      gtagEvent('generate_lead', { item_id: 123 }, 'www.avaliasolar.com.br');

      expect(mockGtag).toHaveBeenCalledWith('event', 'generate_lead', { item_id: 123 });
    });
  });
});
