import {
  buildPublicReviewUrl,
  normalizeChannel,
  formatShortDisplayUrl,
  getPublicSiteOrigin,
  CANONICAL_PUBLIC_ORIGIN,
} from '@/lib/review-forms/urls';

describe('review-forms/urls helper', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_PUBLIC_ORIGIN;
    delete process.env.NEXT_PUBLIC_PUBLIC_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
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
      expect(normalizeChannel('  WHATSAPP ')).toBe('whatsapp');
    });
  });

  describe('getPublicSiteOrigin', () => {
    it('uses NEXT_PUBLIC_PUBLIC_ORIGIN when provided', () => {
      process.env.NEXT_PUBLIC_PUBLIC_ORIGIN = 'https://www.avaliasolar.com.br';
      expect(getPublicSiteOrigin()).toBe('https://www.avaliasolar.com.br');
    });

    it('normalizes apex domain in NEXT_PUBLIC_SITE_URL to www', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://avaliasolar.com.br';
      expect(getPublicSiteOrigin()).toBe(CANONICAL_PUBLIC_ORIGIN);
    });

    it('normalizes apex domain with trailing slashes to www', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://avaliasolar.com.br///';
      expect(getPublicSiteOrigin()).toBe(CANONICAL_PUBLIC_ORIGIN);
    });

    it('normalizes http://avaliasolar.com.br to https://www.avaliasolar.com.br', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'http://avaliasolar.com.br';
      expect(getPublicSiteOrigin()).toBe(CANONICAL_PUBLIC_ORIGIN);
    });

    it('normalizes customOrigin / subdomains to canonical www domain', () => {
      expect(getPublicSiteOrigin('https://app.avaliasolar.com.br')).toBe(CANONICAL_PUBLIC_ORIGIN);
      expect(getPublicSiteOrigin('https://crm.avaliasolar.com.br')).toBe(CANONICAL_PUBLIC_ORIGIN);
      expect(getPublicSiteOrigin('https://avaliasolar.com.br')).toBe(CANONICAL_PUBLIC_ORIGIN);
      expect(getPublicSiteOrigin('http://localhost:3000')).toBe('http://localhost:3000');
      expect(getPublicSiteOrigin('http://127.0.0.1:3001')).toBe('http://127.0.0.1:3001');
    });
  });

  describe('buildPublicReviewUrl', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://www.avaliasolar.com.br';
    });

    it('builds URL with source=link by default', () => {
      const url = buildPublicReviewUrl('test-token-123');
      expect(url).toBe('https://www.avaliasolar.com.br/f/test-token-123?source=link');
    });

    it('builds URL for whatsapp channel', () => {
      const url = buildPublicReviewUrl('test-token-123', 'whatsapp');
      expect(url).toBe('https://www.avaliasolar.com.br/f/test-token-123?source=whatsapp');
    });

    it('builds URL for qr channel', () => {
      const url = buildPublicReviewUrl('test-token-123', 'qr');
      expect(url).toBe('https://www.avaliasolar.com.br/f/test-token-123?source=qr');
    });

    it('builds URL for email channel', () => {
      const url = buildPublicReviewUrl('test-token-123', 'email');
      expect(url).toBe('https://www.avaliasolar.com.br/f/test-token-123?source=email');
    });

    it('builds URL for widget channel', () => {
      const url = buildPublicReviewUrl('test-token-123', 'widget');
      expect(url).toBe('https://www.avaliasolar.com.br/f/test-token-123?source=widget');
    });

    it('builds URL from public_path with leading slash', () => {
      const url = buildPublicReviewUrl('/f/custom-token', 'email');
      expect(url).toBe('https://www.avaliasolar.com.br/f/custom-token?source=email');
    });

    it('builds URL from path starting with f/ without leading slash', () => {
      const url = buildPublicReviewUrl('f/custom-token', 'link');
      expect(url).toBe('https://www.avaliasolar.com.br/f/custom-token?source=link');
    });

    it('normalizes override origin even if apex domain was provided', () => {
      const url = buildPublicReviewUrl('tok-1', 'link', 'https://avaliasolar.com.br');
      expect(url).toBe('https://www.avaliasolar.com.br/f/tok-1?source=link');
    });

    it('respects custom override origin when provided', () => {
      const url = buildPublicReviewUrl('tok-1', 'qr', 'https://custom-partner.com');
      expect(url).toBe('https://custom-partner.com/f/tok-1?source=qr');
    });

    it('returns empty string if token is missing', () => {
      expect(buildPublicReviewUrl('')).toBe('');
    });
  });

  describe('formatShortDisplayUrl', () => {
    it('strips protocol without inventing fake domains like avali.as', () => {
      const formatted = formatShortDisplayUrl('https://www.avaliasolar.com.br/f/alpha-123?source=link');
      expect(formatted).toBe('www.avaliasolar.com.br/f/alpha-123?source=link');
      expect(formatted).not.toContain('avali.as');
    });

    it('handles http protocol stripping', () => {
      const formatted = formatShortDisplayUrl('http://www.avaliasolar.com.br/f/alpha-123');
      expect(formatted).toBe('www.avaliasolar.com.br/f/alpha-123');
    });

    it('returns empty string for empty input', () => {
      expect(formatShortDisplayUrl('')).toBe('');
    });
  });
});
