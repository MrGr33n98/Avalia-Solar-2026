import type { ProductCategoryFilter } from '@/hooks/useProducts';

/**
 * As imagens representam categorias, não SKUs comerciais.
 * Os IDs e contadores continuam vindo exclusivamente do backend.
 */
export const QUICK_PRODUCT_CATEGORIES = [
  {
    key: 'inversores',
    label: 'Inversores',
    name: 'Inversores',
    imageSrc: '/3d-refined/A08_inversores-256.webp',
    aliases: ['inversores', 'inversor', 'inversores-solares'],
    exclude: ['microinversor'],
  },
  {
    key: 'baterias',
    label: 'Baterias',
    name: 'Baterias',
    imageSrc: '/3d-refined/A01_baterias-e-armazenamento-de-energia-256.webp',
    aliases: ['baterias', 'bateria', 'baterias-e-armazenamento-de-energia'],
    exclude: [],
  },
  {
    key: 'estruturas',
    label: 'Estruturas',
    name: 'Estruturas e Fixação',
    imageSrc: '/3d-refined/A12_estruturas-e-fixacao-256.webp',
    aliases: ['estruturas', 'estrutura', 'estruturas-e-fixacao', 'fixacao'],
    exclude: [],
  },
  {
    key: 'carregadores',
    label: 'Carregadores',
    name: 'Carregadores de Veículos Elétricos',
    imageSrc: '/3d-refined/D02_carregadores-residenciais-wallbox-256.webp',
    aliases: ['carregadores-ve', 'carregadores', 'carregador', 'wallbox'],
    exclude: ['inversor'],
  },
  {
    key: 'cabos',
    label: 'Cabos e acess.',
    name: 'Cabos e Acessórios',
    imageSrc: '/images/product-categories/cabos-acessorios-3d.svg',
    aliases: ['cabos-e-acessorios', 'cabos-acessorios', 'cabos', 'cabo', 'acessorios'],
    exclude: [],
  },
  {
    key: 'microinversores',
    label: 'Microinversores',
    name: 'Microinversores',
    imageSrc: '/images/product-categories/microinversores-3d.svg',
    aliases: ['microinversores', 'microinversor'],
    exclude: [],
  },
] as const;

export type QuickProductCategoryKey = (typeof QUICK_PRODUCT_CATEGORIES)[number]['key'];

export interface ResolvedQuickProductCategory {
  key: QuickProductCategoryKey;
  label: string;
  name: string;
  imageSrc: string;
  categoryId: number | null;
  count: number | null;
}

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/**
 * Previne falsos positivos: `inversores` não pode selecionar `microinversores`;
 * carregadores de inversor não podem ser interpretados como carregadores VE.
 * Prioriza match exato antes de alias parcial, mantendo uma única categoria por item.
 */
export function resolveQuickProductCategories(
  categories: ProductCategoryFilter[]
): ResolvedQuickProductCategory[] {
  const available = (categories || [])
    .filter((category) => Number.isInteger(category.id) && category.id > 0)
    .map((category) => ({
      category,
      values: [category.slug, category.seo_url, category.name]
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
        .map(normalize),
    }));

  return QUICK_PRODUCT_CATEGORIES.map((definition) => {
    const aliases = definition.aliases.map(normalize);
    const excludes = definition.exclude.map(normalize);
    const candidates = available.filter(({ values }) =>
      values.every((value) => !excludes.some((excluded) => value.includes(excluded)))
    );
    const exact = candidates.find(({ values }) =>
      values.some((value) => aliases.includes(value))
    );
    const partial = candidates.find(({ values }) =>
      values.some((value) => aliases.some((alias) => value.includes(alias)))
    );
    const match = (exact || partial)?.category ?? null;
    const count =
      match && Number.isInteger(match.products_count) && match.products_count >= 0
        ? match.products_count
        : null;

    return {
      key: definition.key,
      label: definition.label,
      name: definition.name,
      imageSrc: definition.imageSrc,
      categoryId: match?.id ?? null,
      count,
    };
  });
}
