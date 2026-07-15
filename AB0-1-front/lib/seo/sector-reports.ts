import { BRAZIL_CAPITAL_SOLAR_PAGES } from '@/lib/locations/local-page-slugs';
import { absoluteUrl } from '@/lib/site';

export const CAPITAL_COVERAGE_REPORT = {
  slug: 'cobertura-energia-solar-capitais',
  path: '/dados-do-setor/cobertura-energia-solar-capitais',
  csvPath: '/dados-do-setor/cobertura-energia-solar-capitais/dados.csv',
  title: 'Cobertura de paginas locais de energia solar por capital',
  shortTitle: 'Cobertura por capitais',
  description:
    'Mapa publico das paginas locais de energia solar mantidas pelo Avalia Solar para capitais brasileiras.',
  updatedAt: '2026-07-15',
  methodology:
    'O levantamento usa a lista publica de paginas locais programaticas mantida no frontend do Avalia Solar. Cada linha representa uma capital brasileira com URL canonica de comparacao de empresas de energia solar quando a pagina atende aos criterios tecnicos de publicacao.',
  source: 'Fonte: configuracao publica de paginas locais do Avalia Solar.',
} as const;

export const CAPITAL_COVERAGE_ROWS = BRAZIL_CAPITAL_SOLAR_PAGES.map((page) => ({
  state: page.state,
  city: page.city,
  citySlug: page.citySlug,
  localUrl: absoluteUrl(page.href),
  seoSlug: page.seoSlug,
}));

export const CAPITAL_COVERAGE_SUMMARY = {
  capitals: CAPITAL_COVERAGE_ROWS.length,
  states: new Set(CAPITAL_COVERAGE_ROWS.map((row) => row.state)).size,
  country: 'Brasil',
  category: 'Energia solar',
  pageType: 'Comparacao local',
};

const escapeCsv = (value: string | number) => {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function serializeCapitalCoverageCsv() {
  const header = ['state', 'city', 'city_slug', 'local_url', 'seo_slug'];
  const rows = CAPITAL_COVERAGE_ROWS.map((row) => [
    row.state,
    row.city,
    row.citySlug,
    row.localUrl,
    row.seoSlug,
  ]);

  return [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n') + '\n';
}

