import { normalizeBannerImageUrl } from '@/lib/banners/url';

describe('normalizeBannerImageUrl', () => {
  const originalApiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalApiBase;
  });

  it('retorna null para valores vazios, indefinidos ou nulos (sem vazar placeholder)', () => {
    expect(normalizeBannerImageUrl(null)).toBeNull();
    expect(normalizeBannerImageUrl(undefined)).toBeNull();
    expect(normalizeBannerImageUrl('')).toBeNull();
    expect(normalizeBannerImageUrl('   ')).toBeNull();
  });

  it('preserva URLs HTTPS e HTTP absolutas intactas', () => {
    const spacesUrl = 'https://avalia-solar-assets.nyc3.digitaloceanspaces.com/banners/ad-1.webp';
    expect(normalizeBannerImageUrl(spacesUrl)).toBe(spacesUrl);

    const cdnUrl = 'https://avalia-solar-assets.nyc3.cdn.digitaloceanspaces.com/ad-2.png';
    expect(normalizeBannerImageUrl(cdnUrl)).toBe(cdnUrl);

    const httpUrl = 'http://api.avaliasolar.com.br/image.jpg';
    expect(normalizeBannerImageUrl(httpUrl)).toBe(httpUrl);
  });

  it('preserva data: e blob: URIs', () => {
    const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
    expect(normalizeBannerImageUrl(dataUri)).toBe(dataUri);
  });

  it('resolve URLs relativas contra a base da API configurada', () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.avaliasolar.com.br/api/v1';

    const relativeActiveStorage = '/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOi.../banner.png';
    expect(normalizeBannerImageUrl(relativeActiveStorage)).toBe(
      'https://api.avaliasolar.com.br/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOi.../banner.png'
    );
  });

  it('retorna o caminho relativo formatado se nenhuma base estiver configurada', () => {
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_API_URL;

    expect(normalizeBannerImageUrl('rails/active_storage/test.jpg')).toBe(
      '/rails/active_storage/test.jpg'
    );
  });
});
