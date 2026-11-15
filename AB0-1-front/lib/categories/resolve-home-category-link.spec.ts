import type { Category } from '@/lib/api';
import { getFallbackCategories } from '@/lib/constants/fallback-categories';
import { CATEGORY_ICON_MANIFEST } from './category-icon-manifest';
import {
  AUTHORITATIVE_CATEGORY_SEO_URL_BY_CODE,
  isCategoryPubliclyActive,
  resolveHomeCategoryItem,
} from './resolve-home-category-link';
import { SOLUTION_CODES } from '@/components/home/HomeSolutionsRail';

function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 100,
    name: 'Categoria Teste',
    seo_url: 'categoria-teste',
    seo_title: 'Categoria Teste',
    parent_id: null,
    kind: 'main',
    status: 'active',
    featured: true,
    banner_url: null,
    icon_url: null,
    average_rating: 0,
    average_price: 0,
    views_count: 0,
    reviews_count: 0,
    companies_count: 0,
    products_count: 0,
    tags: [],
    badges: [],
    logo: null,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

describe('resolveHomeCategoryItem — resolução canônica de links da Home', () => {
  it('resolve todas as 8 soluções de HomeSolutionsRail para o seo_url autoritativo do backend', () => {
    const expectedSeoUrls: Record<(typeof SOLUTION_CODES)[number], string> = {
      A11: 'paineis-solares',
      A09: 'inversores-solares',
      B02: 'carregadores-residenciais',
      A06: 'estruturas-fixacao',
      A01: 'baterias-armazenamento',
      A10: 'monitoramento-operacao-manutencao',
      G01: 'kits-offgrid',
      A08: 'instaladores-energia-solar',
    };

    for (const code of SOLUTION_CODES) {
      const definition = CATEGORY_ICON_MANIFEST[code];
      const resolved = resolveHomeCategoryItem(definition, []);

      expect(resolved).not.toBeNull();
      expect(resolved?.slug).toBe(expectedSeoUrls[code]);
      expect(resolved?.href).toBe(`/categories/${expectedSeoUrls[code]}`);
    }
  });

  it('não utiliza slugs divergentes do manifesto visual para os 7 hubs raiz seedados', () => {
    const expectedRootSeoUrls: Record<string, string> = {
      A: 'energia-solar',
      B: 'mobilidade-eletrica',
      D: 'mercado-livre-de-energia',
      F: 'apps-software-plataformas',
      G: 'casa-sustentavel-offgrid',
      H: 'mercado-legislacao-financas',
      I: 'sustentabilidade-esg',
    };

    for (const [code, expectedSlug] of Object.entries(expectedRootSeoUrls)) {
      const definition = CATEGORY_ICON_MANIFEST[code];
      const resolved = resolveHomeCategoryItem(definition, [], { requireRoot: true });

      expect(resolved).not.toBeNull();
      expect(resolved?.slug).toBe(expectedSlug);
      expect(resolved?.href).toBe(`/categories/${expectedSlug}`);
    }
  });

  it('oculta categorias sem seed autoritativo (C e E) quando ausentes da API ativa, mas as exibe se retornarem ativas em produção', () => {
    const defC = CATEGORY_ICON_MANIFEST.C;
    const defE = CATEGORY_ICON_MANIFEST.E;

    expect(resolveHomeCategoryItem(defC, [], { requireRoot: true })).toBeNull();
    expect(resolveHomeCategoryItem(defE, [], { requireRoot: true })).toBeNull();

    const prodCategories = [
      makeCategory({
        id: 501,
        name: 'Frotas Elétricas',
        seo_url: 'frotas-eletricas',
        status: 'active',
        parent_id: null,
      }),
      makeCategory({
        id: 502,
        name: 'Hubs de Eletromobilidade e Recarga',
        seo_url: 'hubs-eletromobilidade',
        status: 'active',
        parent_id: null,
      }),
    ];

    const resolvedC = resolveHomeCategoryItem(defC, prodCategories, { requireRoot: true });
    const resolvedE = resolveHomeCategoryItem(defE, prodCategories, { requireRoot: true });

    expect(resolvedC?.href).toBe('/categories/frotas-eletricas');
    expect(resolvedE?.href).toBe('/categories/hubs-eletromobilidade');
  });

  it('prioriza o seo_url e indexability.canonical_slug retornados pela API sobre o manifesto visual', () => {
    const defA09 = CATEGORY_ICON_MANIFEST.A09;
    const apiCategories = [
      makeCategory({
        id: 42,
        name: 'Inversores',
        slug: 'inversores',
        seo_url: 'inversores-solares',
        status: 'active',
        parent_id: 1,
      }),
    ];

    const resolved = resolveHomeCategoryItem(defA09, apiCategories);
    expect(resolved?.slug).toBe('inversores-solares');
    expect(resolved?.href).toBe('/categories/inversores-solares');
  });

  it('suprime categorias marcadas como inativas na API (AC-SEO-004)', () => {
    const defB02 = CATEGORY_ICON_MANIFEST.B02;
    const inactiveCategories = [
      makeCategory({
        id: 77,
        name: 'Carregadores Residenciais / Wallbox',
        seo_url: 'carregadores-residenciais',
        status: 'inactive',
        parent_id: 2,
      }),
    ];

    expect(isCategoryPubliclyActive(inactiveCategories[0])).toBe(false);
    expect(resolveHomeCategoryItem(defB02, inactiveCategories)).toBeNull();
  });

  it('mantém todos os 39 códigos seedados com slugs válidos e sem loops', () => {
    for (const [code, seoUrl] of Object.entries(AUTHORITATIVE_CATEGORY_SEO_URL_BY_CODE)) {
      expect(CATEGORY_ICON_MANIFEST[code]).toBeDefined();
      expect(seoUrl).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it('preserva seo_url canônico e nome oficial quando a API cai em FALLBACK_CATEGORIES (id >= 9000)', () => {
    const fallbackCategories = getFallbackCategories(8);

    const resolvedB02 = resolveHomeCategoryItem(CATEGORY_ICON_MANIFEST.B02, fallbackCategories);
    expect(resolvedB02?.slug).toBe('carregadores-residenciais');
    expect(resolvedB02?.href).toBe('/categories/carregadores-residenciais');
    expect(resolvedB02?.name).toBe('Carregadores Residenciais / Wallbox');

    const resolvedG = resolveHomeCategoryItem(CATEGORY_ICON_MANIFEST.G, fallbackCategories, {
      requireRoot: true,
    });
    expect(resolvedG?.slug).toBe('casa-sustentavel-offgrid');
    expect(resolvedG?.href).toBe('/categories/casa-sustentavel-offgrid');
    expect(resolvedG?.name).toBe('Casa Sustentável e Off-Grid');
  });
});

