import { normalizeCategoryKey } from '../categoryIcons';
export type CategoryMotionPreset =
  | 'solar'
  | 'mobility'
  | 'energyMarket'
  | 'charging'
  | 'hub'
  | 'neutral';

export interface CategoryVisualDefinition {
  code: string;
  src: string;
  alt: string;
  motionPreset: CategoryMotionPreset;
}

export const CATEGORY_VISUAL_REGISTRY: Record<string, CategoryVisualDefinition> = {
  A01: {
    code: 'A01',
    src: '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes/A01_baterias_armazenamento.png',
    alt: 'Baterias e armazenamento de energia',
    motionPreset: 'solar',
  },
  A02: {
    code: 'A02',
    src: '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes/A02_carport_solar.png',
    alt: 'Carport solar e coberturas solares',
    motionPreset: 'solar',
  },
  A03: {
    code: 'A03',
    src: '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes/A03_solar_comercial_industrial.png',
    alt: 'Energia solar comercial e industrial',
    motionPreset: 'solar',
  },
  A04: {
    code: 'A04',
    src: '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes/A04_solar_residencial.png',
    alt: 'Energia solar residencial',
    motionPreset: 'solar',
  },
  A05: {
    code: 'A05',
    src: '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes/A05_solar_rural.png',
    alt: 'Energia solar rural e agronegócio',
    motionPreset: 'solar',
  },
  A06: {
    code: 'A06',
    src: '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes/A06_financiamento.png',
    alt: 'Financiamento de energia solar',
    motionPreset: 'solar',
  },
  A07: {
    code: 'A07',
    src: '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes/A07_instaladores_solar.png',
    alt: 'Instaladores de energia solar',
    motionPreset: 'solar',
  },
  A08: {
    code: 'A08',
    src: '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes/A08_inversores.png',
    alt: 'Inversores solares',
    motionPreset: 'solar',
  },
  A09: {
    code: 'A09',
    src: '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes/A09_monitoramento_om.png',
    alt: 'Monitoramento e operação e manutenção (O&M)',
    motionPreset: 'solar',
  },
  A10: {
    code: 'A10',
    src: '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes/A10_paineis_solares.png',
    alt: 'Painéis solares',
    motionPreset: 'solar',
  },
  A11: {
    code: 'A11',
    src: '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes/A11_energia_solar.png',
    alt: 'Energia solar',
    motionPreset: 'solar',
  },
  B01: {
    code: 'B01',
    src: '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes/B01_frotas_corporativas.png',
    alt: 'Frotas corporativas de veículos elétricos',
    motionPreset: 'mobility',
  },
  B02: {
    code: 'B02',
    src: '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes/B02_frotas_logistica.png',
    alt: 'Frotas de logística e distribuição',
    motionPreset: 'mobility',
  },
  B03: {
    code: 'B03',
    src: '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes/B03_mobilidade_urbana.png',
    alt: 'Mobilidade urbana integrada',
    motionPreset: 'mobility',
  },
  B04: {
    code: 'B04',
    src: '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes/B04_gestao_frotas.png',
    alt: 'Gestão de frotas elétricas',
    motionPreset: 'mobility',
  },
  B05: {
    code: 'B05',
    src: '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes/B05_recarga_frotas.png',
    alt: 'Estações de recarga para frotas',
    motionPreset: 'mobility',
  },
  C01: {
    code: 'C01',
    src: '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes/C01_mercado_livre_energia.png',
    alt: 'Mercado livre de energia',
    motionPreset: 'energyMarket',
  },
  D01: {
    code: 'D01',
    src: '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes/D01_carregadores_comerciais.png',
    alt: 'Carregadores comerciais e condomínios',
    motionPreset: 'charging',
  },
  D02: {
    code: 'D02',
    src: '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes/D02_wallbox_residencial.png',
    alt: 'Carregador residencial wallbox',
    motionPreset: 'charging',
  },
  D03: {
    code: 'D03',
    src: '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes/D03_estacoes_publicas.png',
    alt: 'Estações públicas e postos rápidos',
    motionPreset: 'charging',
  },
  D04: {
    code: 'D04',
    src: '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes/D04_instaladores_ev.png',
    alt: 'Instaladores de carregadores EV',
    motionPreset: 'charging',
  },
  D05: {
    code: 'D05',
    src: '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes/D05_integracao_solar_mobilidade.png',
    alt: 'Integração de energia solar com mobilidade elétrica',
    motionPreset: 'charging',
  },
  D06: {
    code: 'D06',
    src: '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes/D06_veiculos_eletricos.png',
    alt: 'Veículos elétricos',
    motionPreset: 'charging',
  },
  E01: {
    code: 'E01',
    src: '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes/E01_hubs_eletromobilidade.png',
    alt: 'Hubs de eletromobilidade',
    motionPreset: 'hub',
  },
};

// Mapeamento de slugs ou nomes de categorias para o código visual correspondente
export const CATEGORY_SLUG_TO_VISUAL_CODE: Record<string, string> = {
  // Baterias e Armazenamento
  'baterias-armazenamento-energia': 'A01',
  'armazenamento-energia': 'A01',
  'baterias-armazenamento': 'A01',
  baterias: 'A01',
  armazenamento: 'A01',
  battery_storage: 'A01',

  // Carport
  'carport-solar-coberturas-solares': 'A02',
  'carport-coberturas': 'A02',
  'carport-solar': 'A02',
  carport: 'A02',
  coberturas: 'A02',
  solar_carport: 'A02',

  // Comercial e Industrial
  'energia-solar-comercial-industrial': 'A03',
  'comercial-industrial': 'A03',
  industrial: 'A03',
  commercial_industrial_solar: 'A03',

  // Residencial
  'energia-solar-residencial': 'A04',
  residencial: 'A04',
  residential_solar: 'A04',
  casa: 'A04',
  condominio: 'A04',

  // Rural
  'energia-solar-rural-agronegocio': 'A05',
  'energia-solar-rural': 'A05',
  'rural-agronegocio': 'A05',
  rural: 'A05',
  agronegocio: 'A05',
  rural_solar: 'A05',

  // Financiamento
  'financiamento-energia-solar': 'A06',
  financiamento: 'A06',
  solar_financing: 'A06',

  // Instaladores Solar
  'instaladores-energia-solar': 'A07',
  instaladores: 'A07',
  instalador: 'A07',
  solar_installer: 'A07',

  // Inversores
  inversores: 'A08',
  'inversores-solares': 'A08',
  inversor: 'A08',
  solar_inverter: 'A08',

  // Monitoramento
  'monitoramento-om': 'A09',
  'monitoramento-operacao-manutencao': 'A09',
  monitoramento: 'A09',
  monitoring_software: 'A09',

  // Energia Solar
  'energia-solar': 'A11',
  'energia-solar-fotovoltaica': 'A11',

  // Painéis Solares
  'paineis-solares': 'A10',
  painel: 'A10',
  paineis: 'A10',
  solar_panel: 'A10',
  'estruturas-fixacao': 'A10',

  // Frotas e Mobilidade (Hub E01 e subcategorias B01-B05)
  'mobilidade-eletrica': 'E01',
  fleet_electric: 'B01',
  'frotas-corporativas': 'B01',
  'frotas-eletricas-empresas': 'B01',
  'frotas-logistica': 'B02',
  'frotas-eletricas-logistica': 'B02',
  'mobilidade-urbana': 'B03',
  'gestao-frotas': 'B04',
  'recarga-frotas': 'B05',

  // Mercado Livre
  'mercado-livre-de-energia': 'C01',
  'mercado-livre': 'C01',
  free_energy_market: 'C01',

  // Carregadores
  'carregadores-comerciais': 'D01',
  commercial_ev_charger: 'D01',
  'carregadores-residenciais': 'D02',
  'carregador-residencial': 'D02',
  wallbox: 'D02',
  home_wallbox: 'D02',
  'estacoes-publicas': 'D03',
  'instaladores-carregadores': 'D04',
  'instaladores-ev': 'D04',
  'integracao-solar-ev': 'D05',
  'integracao-solar-mobilidade': 'D05',
  'veiculos-eletricos': 'D06',
  'carros-eletricos': 'D06',

  // Hub Geral
  'hubs-eletromobilidade': 'E01',
};

const NORMALIZED_VISUAL_CODE_BY_KEY = Object.fromEntries(
  Object.entries(CATEGORY_SLUG_TO_VISUAL_CODE).map(([key, code]) => [
    normalizeCategoryKey(key),
    code,
  ])
);

const FUZZY_VISUAL_KEYS = Object.keys(NORMALIZED_VISUAL_CODE_BY_KEY).sort(
  (a, b) => b.length - a.length
);

function findVisualByKey(value?: string | null, fuzzy = false) {
  if (!value) return null;

  const directCode = CATEGORY_VISUAL_REGISTRY[value] ? value : undefined;
  const normalizedValue = normalizeCategoryKey(value);
  const exactCode =
    directCode ||
    CATEGORY_SLUG_TO_VISUAL_CODE[value.toLowerCase().trim()] ||
    NORMALIZED_VISUAL_CODE_BY_KEY[normalizedValue];

  if (exactCode && CATEGORY_VISUAL_REGISTRY[exactCode]) {
    return CATEGORY_VISUAL_REGISTRY[exactCode];
  }

  if (!fuzzy || !normalizedValue) return null;

  const matchedKey = FUZZY_VISUAL_KEYS.find(
    (key) => normalizedValue.includes(key) || key.includes(normalizedValue)
  );
  const fuzzyCode = matchedKey ? NORMALIZED_VISUAL_CODE_BY_KEY[matchedKey] : undefined;

  return fuzzyCode ? CATEGORY_VISUAL_REGISTRY[fuzzyCode] || null : null;
}

// Ordem: visualKey, slug exato, nome exato, slug fuzzy, nome fuzzy e fallback neutro.
export function resolveCategoryVisual(
  slug?: string | null,
  name?: string | null,
  visualKey?: string | null
): CategoryVisualDefinition | null {
  return (
    findVisualByKey(visualKey) ||
    findVisualByKey(slug) ||
    findVisualByKey(name) ||
    findVisualByKey(slug, true) ||
    findVisualByKey(name, true) ||
    null
  );
}
