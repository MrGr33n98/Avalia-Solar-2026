import {
  buildPublicReviewUrl,
  normalizeChannel,
  formatShortDisplayUrl,
  getPublicSiteOrigin,
} from '@/lib/review-forms/urls';

describe('review-forms/urls helper', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('normalizeChannel', () => {
    it('normalizes valid channels correctly', () => {
      expect(normalizeChannel('link')).toBe('link');
      expect(normalizeChannel('qr')).toBe('qr');
      expect(normalizeChannel('whatsapp')).toBe('whatsapp');
      expect(normalizeChannel('email')).toBe('email');
      expect(normalizeChannel('widget')).toBe('widget');
    });

    it('falls back to link for invalid or empty channels', () => {
      expect(normalizeChannel(null)).toBe('link');
      expect(normalizeChannel(undefined)).toBe('link');
      expect(normalizeChannel('invalid_channel')).toBe('link');
      expect(normalizeChannel('  EMAIL  ')).toBe('email');
    });
  });

  describe('buildPublicReviewUrl', () => {
    it('builds URL from raw token', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://www.avaliasolar.com.br';
      const url = buildPublicReviewUrl('test-token-123', 'whatsapp');
      expect(url).toBe('https://www.avaliasolar.com.br/f/test-token-123?source=whatsapp');
    });

    it('builds URL from public_path with leading slash', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://www.avaliasolar.com.br';
      const url = buildPublicReviewUrl('/f/custom-token', 'email');
      expect(url).toBe('https://www.avaliasolar.com.br/f/custom-token?source=email');
    });

    it('respects override origin when provided', () => {
      const url = buildPublicReviewUrl('tok-1', 'qr', 'https://custom.avaliasolar.com.br');
      expect(url).toBe('https://custom.avaliasolar.com.br/f/tok-1?source=qr');
    });

    it('returns empty string if token is missing', () => {
      expect(buildPublicReviewUrl('')).toBe('');
    });
  });

  describe('formatShortDisplayUrl', () => {
    it('creates an aesthetic short url representation', () => {
      const formatted = formatShortDisplayUrl('https://www.avaliasolar.com.br/f/alpha-123');
      expect(formatted).toBe('www.avali.as/f/alpha-123');
    });
  });
});

