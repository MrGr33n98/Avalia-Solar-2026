import { getFullImageUrl } from '@/utils/image';

describe('getFullImageUrl', () => {
  const originalApiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalApiBase;
  });

  it('retorna placeholder para valor nulo, indefinido ou vazio', () => {
    expect(getFullImageUrl(null)).toBe('/images/avalia-solar-place-holder.PNG');
    expect(getFullImageUrl(undefined)).toBe('/images/avalia-solar-place-holder.PNG');
    expect(getFullImageUrl('')).toBe('/images/avalia-solar-place-holder.PNG');
  });

  it('preserva URLs absolutas http e https', () => {
    expect(getFullImageUrl('https://example.com/photo.png')).toBe('https://example.com/photo.png');
    expect(getFullImageUrl('http://localhost:3000/test.webp')).toBe('http://localhost:3000/test.webp');
  });

  it('preserva data URLs', () => {
    const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB';
    expect(getFullImageUrl(dataUri)).toBe(dataUri);
  });

  it('preserva caminhos estáticos do frontend (/images/, /icons/, /_next/)', () => {
    expect(getFullImageUrl('/images/home-hero-avalia-solar-1330x230.webp')).toBe(
      '/images/home-hero-avalia-solar-1330x230.webp'
    );
    expect(getFullImageUrl('/icons/logo.svg')).toBe('/icons/logo.svg');
    expect(getFullImageUrl('/_next/static/media/banner.png')).toBe('/_next/static/media/banner.png');
  });

  it('resolve caminhos do backend contra NEXT_PUBLIC_API_BASE_URL', () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:3001/api/v1';
    expect(getFullImageUrl('/rails/active_storage/blobs/123/banner.png')).toBe(
      'http://localhost:3001/rails/active_storage/blobs/123/banner.png'
    );
  });
});
