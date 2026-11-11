import { GET, runtime } from '@/app/api/social/render-post/route';

jest.mock('next/og', () => ({
  ImageResponse: jest.fn().mockImplementation((element, options) => ({
    status: 200,
    headers: options?.headers || {},
    width: options?.width,
    height: options?.height,
    element,
  })),
}));

describe('GET /api/social/render-post', () => {
  it('declares edge runtime for fast response', () => {
    expect(runtime).toBe('edge');
  });

  it('renders standard Instagram Feed (1080x1350) by default', async () => {
    const request = {
      url: 'https://www.avaliasolar.com.br/api/social/render-post?title=Guia+de+Mercado+Livre&category=Mercado+Livre',
    } as unknown as Request;
    const response = (await GET(request)) as unknown as {
      status: number;
      width: number;
      height: number;
      headers: Record<string, string>;
    };

    expect(response.status).toBe(200);
    expect(response.width).toBe(1080);
    expect(response.height).toBe(1350);
    expect(response.headers['Cache-Control']).toContain('public, max-age=86400');
  });

  it('supports story format (1080x1920) when requested', async () => {
    const request = {
      url: 'https://www.avaliasolar.com.br/api/social/render-post?title=Story+Solar&format=story',
    } as unknown as Request;
    const response = (await GET(request)) as unknown as {
      width: number;
      height: number;
    };

    expect(response.width).toBe(1080);
    expect(response.height).toBe(1920);
  });

  it('falls back to default feed dimensions when an unknown format is provided', async () => {
    const request = {
      url: 'https://www.avaliasolar.com.br/api/social/render-post?format=unknown_format',
    } as unknown as Request;
    const response = (await GET(request)) as unknown as {
      width: number;
      height: number;
    };

    expect(response.width).toBe(1080);
    expect(response.height).toBe(1350);
  });
});
