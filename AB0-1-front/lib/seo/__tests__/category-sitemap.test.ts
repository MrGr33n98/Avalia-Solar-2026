import {
  getCategorySitemapEntries,
  getCompanyCategorySitemapEntries,
  serializeSitemapUrlset,
  serializeSitemapIndex,
  SitemapUpstreamError,
} from '@/lib/seo/sitemap-builders';
import { GET as getSectionSitemapResponse } from '@/app/sitemaps/[section]/sitemap.xml/route';

if (typeof globalThis.Response === 'undefined') {
  class PolyfillResponse {
    body: string;
    status: number;
    headers: Record<string, string>;

    constructor(body: string, init?: { status?: number; headers?: Record<string, string> }) {
      this.body = body;
      this.status = init?.status ?? 200;
      this.headers = init?.headers ?? {};
    }

    async text() {
      return this.body;
    }
  }
  (globalThis as unknown as { Response: unknown }).Response = PolyfillResponse;
}

describe('Category Sitemap Builders & Route (CDSI-033..CDSI-041)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('J25: lança SitemapUpstreamError quando sitemaps/categories falha com 5xx ou erro de rede (nunca retorna [] silencioso)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    } as unknown as Response);

    await expect(getCategorySitemapEntries()).rejects.toThrow(SitemapUpstreamError);
  });

  it('J25/E19: rota /sitemaps/categories/sitemap.xml responde HTTP 503 quando upstream falha', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as unknown as Response);

    const response = await getSectionSitemapResponse(
      { url: 'https://www.avaliasolar.com.br/sitemaps/categories/sitemap.xml' } as unknown as Request,
      { params: { section: 'categories' } }
    );

    expect(response.status).toBe(503);
  });

  it('J26: consome todas as páginas por cursor de sitemaps/categories sem perda e preserva lastmod significativo', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            {
              id: 10,
              slug: 'energia-solar-residencial',
              canonical_path: '/categories/energia-solar-residencial',
              lastmod: '2026-10-01T10:00:00Z',
              status: 'active',
              include_in_sitemap: true,
            },
            {
              id: 20,
              slug: 'inversores-solares',
              canonical_path: '/categories/inversores-solares',
              lastmod: '2026-10-05T12:30:00Z',
              status: 'active',
              include_in_sitemap: true,
            },
          ],
          meta: {
            next_cursor: 20,
            has_more: true,
            count: 2,
            limit: 2,
          },
        }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            {
              id: 30,
              slug: 'monitoramento-operacao-manutencao',
              canonical_path: '/categories/monitoramento-operacao-manutencao',
              lastmod: '2026-10-10T08:15:00Z',
              status: 'active',
              include_in_sitemap: true,
            },
          ],
          meta: {
            next_cursor: null,
            has_more: false,
            count: 1,
            limit: 2,
          },
        }),
      } as unknown as Response);

    global.fetch = fetchMock;

    const entries = await getCategorySitemapEntries();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toContain('sitemaps/categories');
    expect(String(fetchMock.mock.calls[1][0])).toContain('cursor=20');

    expect(entries.map((e) => e.url)).toEqual([
      'https://www.avaliasolar.com.br/categories/energia-solar-residencial',
      'https://www.avaliasolar.com.br/categories/inversores-solares',
      'https://www.avaliasolar.com.br/categories/monitoramento-operacao-manutencao',
    ]);
    expect(entries[2].lastModified).toBe('2026-10-10T08:15:00Z');
  });

  it('J27: exclui categorias inativas ou com include_in_sitemap=false em categories e company-categories', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          {
            id: 1,
            name: 'Painéis Solares',
            slug: 'paineis-solares',
            seo_url: 'paineis-solares',
            status: 'active',
            companies_count: 5,
            include_in_sitemap: true,
            lastmod: '2026-10-12T00:00:00Z',
          },
          {
            id: 2,
            name: 'Categoria Inativa',
            slug: 'categoria-inativa',
            seo_url: 'categoria-inativa',
            status: 'inactive',
            companies_count: 5,
            include_in_sitemap: false,
            lastmod: '2026-10-12T00:00:00Z',
          },
          {
            id: 3,
            name: 'Categoria Não Indexável',
            slug: 'categoria-nao-indexavel',
            seo_url: 'categoria-nao-indexavel',
            status: 'active',
            companies_count: 0,
            include_in_sitemap: false,
            lastmod: '2026-10-12T00:00:00Z',
          },
        ],
        meta: { next_cursor: null, has_more: false },
      }),
    } as unknown as Response);

    const catEntries = await getCategorySitemapEntries();
    expect(catEntries.map((e) => e.url)).toEqual([
      'https://www.avaliasolar.com.br/categories/paineis-solares',
    ]);

    const companyCatEntries = await getCompanyCategorySitemapEntries();
    expect(companyCatEntries.map((e) => e.url)).toEqual([
      'https://www.avaliasolar.com.br/companies/categorias/paineis-solares--1',
    ]);
  });

  it('J26/J27: gera XML válido para urlset e sitemapindex sem duplicatas', () => {
    const xml = serializeSitemapUrlset([
      {
        url: 'https://www.avaliasolar.com.br/categories/paineis-solares',
        lastModified: '2026-10-12T00:00:00Z',
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      {
        url: 'https://www.avaliasolar.com.br/categories/paineis-solares/',
        lastModified: '2026-10-12T00:00:00Z',
        changeFrequency: 'weekly',
        priority: 0.8,
      },
    ]);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    const matches = xml.match(/<loc>/g) || [];
    expect(matches).toHaveLength(1);

    const indexXml = serializeSitemapIndex();
    expect(indexXml).toContain('<sitemapindex');
    expect(indexXml).toContain('/sitemaps/categories/sitemap.xml</loc>');
  });
});
