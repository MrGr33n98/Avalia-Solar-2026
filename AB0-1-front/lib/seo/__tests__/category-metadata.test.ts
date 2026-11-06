import {
  buildCategoryPageMetadata,
  resolveCategoryCanonicalPath,
  sanitizeMetaDescription,
} from '@/lib/seo/category-metadata';
import {
  shouldNoindexSearchParams,
  stripTrackingParamsFromSearchParams,
} from '@/lib/seo/search-params';
import { getPublicCategory } from '@/lib/server/category-discovery/get-public-category';
import type { Category } from '@/lib/api';

const baseCategory: Category = {
  id: 42,
  name: 'Monitoramento e O&M',
  seo_url: 'monitoramento-operacao-manutencao',
  seo_title: 'Monitoramento e O&M Solar | Avalia Solar',
  seo_description:
    'Compare plataformas de monitoramento, SCADA e empresas de operação e manutenção (O&M) fotovoltaica verificadas.',
  short_description: 'Operação e manutenção de usinas solares.',
  description: '<p>Descrição longa com <strong>HTML</strong> e <script>alert(1)</script> embutido.</p>',
  status: 'active',
  kind: 'main',
  featured: true,
  companies_count: 14,
  products_count: 3,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-10-01T00:00:00Z',
  indexability: {
    indexable: true,
    publicly_accessible: true,
    robots: 'index,follow',
    canonical_slug: 'monitoramento-operacao-manutencao',
    canonical_path: '/categories/monitoramento-operacao-manutencao',
    reason_codes: [],
    advisory_warnings: [],
    eligible_companies_count: 14,
    mode: 'shadow',
  },
};

describe('Category SEO Metadata, Canonical & Redirect Contract (J05–J08, J29)', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('J05: deduplicates "| Avalia Solar" suffix when seo_title already ends with brand', () => {
    const metadata = buildCategoryPageMetadata({
      category: {
        ...baseCategory,
        seo_title: 'Monitoramento e O&M Solar | Avalia Solar | Avalia Solar',
      },
      requestedSlug: 'monitoramento-operacao-manutencao',
      searchParams: {},
    });

    expect(metadata.title).toBe('Monitoramento e O&M Solar | Avalia Solar');
    expect(String(metadata.title).match(/Avalia Solar/g)?.length).toBe(1);
  });

  it('J06: derives canonical strictly from DTO canonical_path / seo_url and never from divergent requestedSlug', () => {
    const metadata = buildCategoryPageMetadata({
      category: baseCategory,
      requestedSlug: 'monitoramento-om-antigo',
      searchParams: {},
    });

    expect(resolveCategoryCanonicalPath(baseCategory)).toBe(
      '/categories/monitoramento-operacao-manutencao'
    );
    expect(metadata.alternates?.canonical).toBe(
      'https://www.avaliasolar.com.br/categories/monitoramento-operacao-manutencao'
    );
  });

  it('J07: sanitizes meta description HTML/scripts and truncates within 160 chars without mutating editorial description', () => {
    const categoryWithoutSeoDesc: Category = {
      ...baseCategory,
      seo_description: null,
      short_description: undefined,
      description:
        '<p>Encontre empresas de <strong>manutenção preventiva</strong> e termografia.</p><script>evil()</script> ' +
        'Texto extra detalhado sobre comissionamento, limpeza de módulos, inspeção de strings e inversores fotovoltaicos industriais.',
    };

    const metadata = buildCategoryPageMetadata({
      category: categoryWithoutSeoDesc,
      requestedSlug: 'monitoramento-operacao-manutencao',
      searchParams: {},
    });

    expect(metadata.description).toBeDefined();
    expect(String(metadata.description)).not.toContain('<script>');
    expect(String(metadata.description)).not.toContain('<strong>');
    expect(String(metadata.description).length).toBeLessThanOrEqual(160);
    expect(sanitizeMetaDescription('<img src=x onerror=alert(1)>Texto limpo')).toBe('Texto limpo');
  });

  it('J08 & J29: UTM tracking params keep canonical clean and do NOT force noindex, while unknown params trigger noindex without changing canonical', () => {
    const utmSearchParams = {
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'solar_2026',
      gclid: 'abc123xyz',
    };

    expect(shouldNoindexSearchParams(utmSearchParams)).toBe(false);

    const utmMetadata = buildCategoryPageMetadata({
      category: baseCategory,
      requestedSlug: 'monitoramento-operacao-manutencao',
      searchParams: utmSearchParams,
    });

    expect(utmMetadata.alternates?.canonical).toBe(
      'https://www.avaliasolar.com.br/categories/monitoramento-operacao-manutencao'
    );
    expect(utmMetadata.robots).toBeUndefined();

    const unknownParams = {
      utm_source: 'newsletter',
      arbitrary_trap: '1',
    };

    expect(shouldNoindexSearchParams(unknownParams)).toBe(true);
    const unknownMetadata = buildCategoryPageMetadata({
      category: baseCategory,
      requestedSlug: 'monitoramento-operacao-manutencao',
      searchParams: unknownParams,
    });

    expect(unknownMetadata.alternates?.canonical).toBe(
      'https://www.avaliasolar.com.br/categories/monitoramento-operacao-manutencao'
    );
    expect(unknownMetadata.robots).toEqual({ index: false, follow: true });
    expect(stripTrackingParamsFromSearchParams(unknownParams)).toEqual({ arbitrary_trap: '1' });
  });

  it('E04 / CDSI-046: getPublicCategory returns redirect result when API responds with canonical redirect target', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (h: string) =>
          h.toLowerCase() === 'x-canonical-redirect-slug'
            ? 'monitoramento-operacao-manutencao'
            : null,
      },
      json: async () => ({
        ...baseCategory,
        redirect_from_slug: 'monitoramento-legado-2024',
      }),
    } as unknown as Response);

    const result = await getPublicCategory('monitoramento-legado-2024');
    expect(result.status).toBe('redirect');
    if (result.status === 'redirect') {
      expect(result.destinationSlug).toBe('monitoramento-operacao-manutencao');
      expect(result.destinationPath).toBe('/categories/monitoramento-operacao-manutencao');
    }
  });
});

