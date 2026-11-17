import { resolveQuickProductCategories } from './quick-product-categories';
import type { ProductCategoryFilter } from '@/hooks/useProducts';

const category = (
  id: number,
  name: string,
  slug: string,
  count: number
): ProductCategoryFilter => ({ id, name, slug, products_count: count });

describe('resolveQuickProductCategories', () => {
  it('sempre retorna seis categorias estáveis na ordem do design', () => {
    const result = resolveQuickProductCategories([]);
    expect(result.map((item) => item.key)).toEqual([
      'inversores',
      'baterias',
      'estruturas',
      'carregadores',
      'cabos',
      'microinversores',
    ]);
    expect(new Set(result.map((item) => item.key)).size).toBe(6);
    expect(result.every((item) => item.count === null && item.categoryId === null)).toBe(true);
  });

  it('mapeia categorias da API e preserva contagens zero e um', () => {
    const result = resolveQuickProductCategories([
      category(17, 'Inversores', 'inversores', 1),
      category(18, 'Baterias', 'baterias', 0),
      category(19, 'Estruturas e Fixação', 'estruturas-e-fixacao', 2),
      category(20, 'Carregadores VE', 'carregadores-ve', 0),
      category(21, 'Cabos e Acessórios', 'cabos-e-acessorios', 4),
      category(22, 'Microinversores', 'microinversores', 5),
    ]);
    expect(result.map((item) => item.categoryId)).toEqual([17, 18, 19, 20, 21, 22]);
    expect(result.map((item) => item.count)).toEqual([1, 0, 2, 0, 4, 5]);
  });

  it('não confunde microinversores com inversores', () => {
    const result = resolveQuickProductCategories([
      category(55, 'Microinversores', 'microinversores', 10),
    ]);
    expect(result[0].categoryId).toBeNull();
    expect(result[5].categoryId).toBe(55);
  });

  it('não confunde carregador inversor com carregador VE', () => {
    const result = resolveQuickProductCategories([
      category(71, 'Inversor Carregador', 'inversor-carregador', 5),
    ]);
    expect(result[3].categoryId).toBeNull();
  });

  it('não cria contagens fictícias nem aceita IDs inválidos', () => {
    const result = resolveQuickProductCategories([
      category(0, 'Inversores', 'inversores', 99),
      category(20, 'Baterias', 'baterias', -1),
    ]);
    expect(result[0].categoryId).toBeNull();
    expect(result[0].count).toBeNull();
    expect(result[1].categoryId).toBe(20);
    expect(result[1].count).toBeNull();
  });

  it('resolve slugs acentuados usando nome e seo_url quando necessário', () => {
    const result = resolveQuickProductCategories([
      { id: 31, name: 'Cabos e Acessórios', products_count: 3 },
    ]);
    expect(result[4].categoryId).toBe(31);
    expect(result[4].count).toBe(3);
  });
});
