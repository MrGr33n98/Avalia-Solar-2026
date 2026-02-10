import type { Category } from '@/lib/api';

const nowIso = () => new Date().toISOString();

const buildFallbackCategory = (
  id: number,
  name: string,
  seoUrl: string,
  shortDescription: string
): Category => ({
  id,
  name,
  seo_url: seoUrl,
  seo_title: name,
  short_description: shortDescription,
  description: shortDescription,
  parent_id: null,
  kind: 'service',
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
  created_at: nowIso(),
  updated_at: nowIso(),
});

export const FALLBACK_CATEGORIES: Category[] = [
  buildFallbackCategory(
    9001,
    'Energia Solar Residencial',
    'energia-solar-residencial',
    'Projetos solares para casas e condominios.'
  ),
  buildFallbackCategory(
    9002,
    'Energia Solar Comercial',
    'energia-solar-comercial',
    'Solucoes solares para empresas e comercio.'
  ),
  buildFallbackCategory(
    9003,
    'Baterias e Armazenamento',
    'baterias-e-armazenamento',
    'Armazenamento de energia e backup.'
  ),
  buildFallbackCategory(
    9004,
    'Inversores Solares',
    'inversores-solares',
    'Comparacao de inversores e fornecedores.'
  ),
  buildFallbackCategory(
    9005,
    'Carregadores Veiculares',
    'carregadores-veiculares',
    'Infraestrutura de recarga para veiculos eletricos.'
  ),
  buildFallbackCategory(
    9006,
    'Manutencao e Suporte',
    'manutencao-e-suporte',
    'Assistencia tecnica e manutencao preventiva.'
  ),
  buildFallbackCategory(
    9007,
    'Projetos Off-Grid',
    'projetos-off-grid',
    'Sistemas autonomos e independentes da rede.'
  ),
  buildFallbackCategory(
    9008,
    'Consultoria e Homologacao',
    'consultoria-e-homologacao',
    'Apoio em projeto, documentacao e homologacao.'
  ),
];

export const getFallbackCategories = (limit?: number): Category[] => {
  if (!Number.isFinite(limit as number) || (limit as number) <= 0) {
    return FALLBACK_CATEGORIES;
  }
  return FALLBACK_CATEGORIES.slice(0, Number(limit));
};
