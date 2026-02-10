import {
  buildCompaniesCategoriesPath,
  normalizeCategoryIds,
  parseCategorySegment,
  extractCategoryIdsFromPath,
} from '@/lib/seo/companies-category-url';

describe('companies-category-url helpers', () => {
  it('normalizes category ids from query string', () => {
    expect(normalizeCategoryIds('76,73,76,abc,0')).toEqual([73, 76]);
  });

  it('builds a descriptive path with hyphenized category segments', () => {
    const path = buildCompaniesCategoriesPath([73, 76], {
      73: { id: 73, name: 'Energia Solar', seo_url: 'energia-solar' },
      76: { id: 76, name: 'Mobilidade Eletrica', seo_url: 'mobilidade-eletrica' },
    });

    expect(path).toBe('/companies/categorias/energia-solar--73/mobilidade-eletrica--76');
  });

  it('extracts category ids from companies category path', () => {
    const ids = extractCategoryIdsFromPath('/companies/categorias/energia-solar--73/mobilidade-eletrica--76');
    expect(ids).toEqual([73, 76]);
  });

  it('parses category segments with or without numeric suffix', () => {
    expect(parseCategorySegment('energia-solar--73')).toEqual({ slug: 'energia-solar', id: 73 });
    expect(parseCategorySegment('mobilidade-eletrica')).toEqual({ slug: 'mobilidade-eletrica', id: null });
  });

  it('keeps helper performance within acceptable range', () => {
    const ids = Array.from({ length: 200 }, (_, index) => index + 1);
    const descriptors = ids.reduce<Record<number, { id: number; name: string; seo_url: string }>>((acc, id) => {
      acc[id] = {
        id,
        name: `Categoria ${id}`,
        seo_url: `categoria-${id}`,
      };
      return acc;
    }, {});

    const start = performance.now();
    for (let i = 0; i < 300; i += 1) {
      const path = buildCompaniesCategoriesPath(ids, descriptors);
      extractCategoryIdsFromPath(path);
    }
    const durationMs = performance.now() - start;

    expect(durationMs).toBeLessThan(1000);
  });
});

