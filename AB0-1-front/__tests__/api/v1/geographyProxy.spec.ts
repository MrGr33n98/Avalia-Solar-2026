import { Headers as FetchHeaders, Response as FetchResponse } from 'node-fetch';
import type { NextRequest } from 'next/server';
import { GET } from '@/app/api/v1/[...path]/route';

jest.mock('@/lib/api-config', () => ({
  getApiBaseUrl: () => 'http://backend:3001/api/v1',
  getApiRequestHeaders: () => ({ Accept: 'application/json' }),
}));

const fetchMock = jest.fn<typeof fetch>();

function request(path: string, headers?: HeadersInit) {
  return {
    headers: new FetchHeaders(headers),
    method: 'GET',
    nextUrl: new URL(`http://localhost/api/v1/${path}`),
    signal: new AbortController().signal,
  } as unknown as NextRequest;
}

function context(path: string[]) {
  return { params: { path } };
}

function jsonResponse(body: unknown, headers: Record<string, string> = {}) {
  return new FetchResponse(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...headers },
  }) as unknown as Response;
}

describe('geography API proxy caching', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
    global.Headers = FetchHeaders as unknown as typeof global.Headers;
    global.Response = FetchResponse as unknown as typeof global.Response;
    delete process.env.API_URL_INTERNAL;
    delete process.env.API_PROXY_TARGET;
    delete process.env.NEXT_PUBLIC_BROWSER_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  it('forwards validators and preserves public cache metadata for an anonymous valid UF', async () => {
    fetchMock.mockResolvedValue(
      new Response(null, {
        status: 304,
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
          ETag: '"catalog-sc-r1"',
          'X-Locations-Version': 'catalog-r1',
        },
      })
    );

    const response = await GET(
      request('companies/cities?state=SC', { 'If-None-Match': '"catalog-sc-r1"' }),
      context(['companies', 'cities'])
    );

    const [url, init] = fetchMock.mock.calls[0];
    const upstreamHeaders = new Headers(init?.headers);
    expect(url).toBe('http://backend:3001/api/v1/companies/cities?state=SC');
    expect(upstreamHeaders.get('if-none-match')).toBe('"catalog-sc-r1"');
    expect(response.status).toBe(304);
    expect(response.headers.get('cache-control')).toContain('public');
    expect(response.headers.get('etag')).toBe('"catalog-sc-r1"');
    expect(response.headers.get('x-locations-version')).toBe('catalog-r1');
  });

  it('uses no-store for requests with cookies even when upstream marks the response public', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ cities: ['Florianópolis'] }, {
        'Cache-Control': 'public, max-age=300',
        ETag: '"catalog-sc-r1"',
        'X-Locations-Version': 'catalog-r1',
      })
    );

    const response = await GET(
      request('companies/cities?state=SC', { Cookie: 'jwt_token=opaque' }),
      context(['companies', 'cities'])
    );

    const [, init] = fetchMock.mock.calls[0];
    expect(new Headers(init?.headers).get('if-none-match')).toBeNull();
    expect(response.headers.get('cache-control')).toBe('no-store, max-age=0');
    expect(response.headers.get('etag')).toBeNull();
    expect(response.headers.get('x-locations-version')).toBeNull();
  });

  it('does not cache unexpected query variants or forward their validators', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ cities: [] }));

    const response = await GET(
      request('companies/cities?state=SC&debug=true', { 'If-None-Match': '"old"' }),
      context(['companies', 'cities'])
    );

    const [, init] = fetchMock.mock.calls[0];
    expect(new Headers(init?.headers).get('if-none-match')).toBeNull();
    expect(response.headers.get('cache-control')).toBe('no-store, max-age=0');
  });

  it('does not cache a public-shaped response that sets a cookie', async () => {
    fetchMock.mockResolvedValue(
      new FetchResponse(JSON.stringify({ cities: ['Florianópolis'] }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
          ETag: '"catalog-sc-r1"',
          'Set-Cookie': 'session=opaque; HttpOnly',
        },
      }) as unknown as Response
    );

    const response = await GET(request('companies/cities?state=SC'), context(['companies', 'cities']));

    expect(response.headers.get('cache-control')).toBe('no-store, max-age=0');
    expect(response.headers.get('etag')).toBeNull();
    expect(response.headers.get('set-cookie')).toContain('session=opaque');
  });
});
