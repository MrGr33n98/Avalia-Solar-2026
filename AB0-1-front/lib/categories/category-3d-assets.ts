/**
 * Avalia Solar — Catálogo e Resolvedor Canônico de Ícones 3D Refinados (24 Ativos)
 *
 * Mapeamento estrito e determinístico (SEM fuzzy/substring genérico) para as 24 categorias
 * e subcategorias cobertas pelo pacote 3D Refinado em `/icones-new/3d-refined/`.
 *
 * Cada ativo possui:
 * - PNG 1024x1024 px com canal alfa (fallback / alta definição)
 * - WebP 512x512 px com canal alfa (padrão para cards, heros e destaques)
 * - WebP 256x256 px com canal alfa (otimizado para menus, drawer, chips e filtros)
 *
 * Para as demais categorias (não cobertas por estes 24 ativos), o sistema preserva
 * deterministicamente o catálogo canônico de SVGs monocromáticos pretos.
 */

export type Category3DCode =
  | 'A01'
  | 'A02'
  | 'A03'
  | 'A04'
  | 'A05'
  | 'A06'
  | 'A07'
  | 'A08'
  | 'A09'
  | 'A10'
  | 'A11'
  | 'B01'
  | 'B02'
  | 'B03'
  | 'B04'
  | 'B05'
  | 'C01'
  | 'D01'
  | 'D02'
  | 'D03'
  | 'D04'
  | 'D05'
  | 'D06'
  | 'E01';

export type Category3DSizeVariant = '256' | '512' | '1024';

export const CATEGORY_3D_ASSETS_512: Record<Category3DCode, string> = {
  A01: '/icones-new/3d-refined/A01_baterias-e-armazenamento-de-energia-512.webp',
  A02: '/icones-new/3d-refined/A02_carport-solar-e-coberturas-solares-512.webp',
  A03: '/icones-new/3d-refined/A03_energia-solar-comercial-e-industrial-512.webp',
  A04: '/icones-new/3d-refined/A04_energia-solar-residencial-512.webp',
  A05: '/icones-new/3d-refined/A05_energia-solar-rural-e-agronegocio-512.webp',
  A06: '/icones-new/3d-refined/A06_financiamento-de-energia-solar-512.webp',
  A07: '/icones-new/3d-refined/A07_instaladores-de-energia-solar-512.webp',
  A08: '/icones-new/3d-refined/A08_inversores-512.webp',
  A09: '/icones-new/3d-refined/A09_monitoramento-e-o-e-m-512.webp',
  A10: '/icones-new/3d-refined/A10_paineis-solares-512.webp',
  A11: '/icones-new/3d-refined/A11_energia-solar-512.webp',
  B01: '/icones-new/3d-refined/B01_frotas-eletricas-corporativas-512.webp',
  B02: '/icones-new/3d-refined/B02_frotas-eletricas-para-logistica-e-entregas-512.webp',
  B03: '/icones-new/3d-refined/B03_frotas-eletricas-para-mobilidade-urbana-512.webp',
  B04: '/icones-new/3d-refined/B04_gestao-de-frotas-eletricas-512.webp',
  B05: '/icones-new/3d-refined/B05_infraestrutura-de-recarga-para-frotas-512.webp',
  C01: '/icones-new/3d-refined/C01_mercado-livre-de-energia-512.webp',
  D01: '/icones-new/3d-refined/D01_carregadores-comerciais-e-condominios-512.webp',
  D02: '/icones-new/3d-refined/D02_carregadores-residenciais-wallbox-512.webp',
  D03: '/icones-new/3d-refined/D03_estacoes-publicas-e-postos-rapidos-512.webp',
  D04: '/icones-new/3d-refined/D04_instaladores-de-carregadores-ev-512.webp',
  D05: '/icones-new/3d-refined/D05_integracao-solar-e-mobilidade-eletrica-512.webp',
  D06: '/icones-new/3d-refined/D06_veiculos-eletricos-512.webp',
  E01: '/icones-new/3d-refined/E01_hubs-de-eletromobilidade-e-recarga-512.webp',
} as const;

export const CATEGORY_3D_ASSETS_256: Record<Category3DCode, string> = {
  A01: '/icones-new/3d-refined/A01_baterias-e-armazenamento-de-energia-256.webp',
  A02: '/icones-new/3d-refined/A02_carport-solar-e-coberturas-solares-256.webp',
  A03: '/icones-new/3d-refined/A03_energia-solar-comercial-e-industrial-256.webp',
  A04: '/icones-new/3d-refined/A04_energia-solar-residencial-256.webp',
  A05: '/icones-new/3d-refined/A05_energia-solar-rural-e-agronegocio-256.webp',
  A06: '/icones-new/3d-refined/A06_financiamento-de-energia-solar-256.webp',
  A07: '/icones-new/3d-refined/A07_instaladores-de-energia-solar-256.webp',
  A08: '/icones-new/3d-refined/A08_inversores-256.webp',
  A09: '/icones-new/3d-refined/A09_monitoramento-e-o-e-m-256.webp',
  A10: '/icones-new/3d-refined/A10_paineis-solares-256.webp',
  A11: '/icones-new/3d-refined/A11_energia-solar-256.webp',
  B01: '/icones-new/3d-refined/B01_frotas-eletricas-corporativas-256.webp',
  B02: '/icones-new/3d-refined/B02_frotas-eletricas-para-logistica-e-entregas-256.webp',
  B03: '/icones-new/3d-refined/B03_frotas-eletricas-para-mobilidade-urbana-256.webp',
  B04: '/icones-new/3d-refined/B04_gestao-de-frotas-eletricas-256.webp',
  B05: '/icones-new/3d-refined/B05_infraestrutura-de-recarga-para-frotas-256.webp',
  C01: '/icones-new/3d-refined/C01_mercado-livre-de-energia-256.webp',
  D01: '/icones-new/3d-refined/D01_carregadores-comerciais-e-condominios-256.webp',
  D02: '/icones-new/3d-refined/D02_carregadores-residenciais-wallbox-256.webp',
  D03: '/icones-new/3d-refined/D03_estacoes-publicas-e-postos-rapidos-256.webp',
  D04: '/icones-new/3d-refined/D04_instaladores-de-carregadores-ev-256.webp',
  D05: '/icones-new/3d-refined/D05_integracao-solar-e-mobilidade-eletrica-256.webp',
  D06: '/icones-new/3d-refined/D06_veiculos-eletricos-256.webp',
  E01: '/icones-new/3d-refined/E01_hubs-de-eletromobilidade-e-recarga-256.webp',
} as const;

export const CATEGORY_3D_ASSETS_1024: Record<Category3DCode, string> = {
  A01: '/icones-new/3d-refined/A01_baterias-e-armazenamento-de-energia.png',
  A02: '/icones-new/3d-refined/A02_carport-solar-e-coberturas-solares.png',
  A03: '/icones-new/3d-refined/A03_energia-solar-comercial-e-industrial.png',
  A04: '/icones-new/3d-refined/A04_energia-solar-residencial.png',
  A05: '/icones-new/3d-refined/A05_energia-solar-rural-e-agronegocio.png',
  A06: '/icones-new/3d-refined/A06_financiamento-de-energia-solar.png',
  A07: '/icones-new/3d-refined/A07_instaladores-de-energia-solar.png',
  A08: '/icones-new/3d-refined/A08_inversores.png',
  A09: '/icones-new/3d-refined/A09_monitoramento-e-o-e-m.png',
  A10: '/icones-new/3d-refined/A10_paineis-solares.png',
  A11: '/icones-new/3d-refined/A11_energia-solar.png',
  B01: '/icones-new/3d-refined/B01_frotas-eletricas-corporativas.png',
  B02: '/icones-new/3d-refined/B02_frotas-eletricas-para-logistica-e-entregas.png',
  B03: '/icones-new/3d-refined/B03_frotas-eletricas-para-mobilidade-urbana.png',
  B04: '/icones-new/3d-refined/B04_gestao-de-frotas-eletricas.png',
  B05: '/icones-new/3d-refined/B05_infraestrutura-de-recarga-para-frotas.png',
  C01: '/icones-new/3d-refined/C01_mercado-livre-de-energia.png',
  D01: '/icones-new/3d-refined/D01_carregadores-comerciais-e-condominios.png',
  D02: '/icones-new/3d-refined/D02_carregadores-residenciais-wallbox.png',
  D03: '/icones-new/3d-refined/D03_estacoes-publicas-e-postos-rapidos.png',
  D04: '/icones-new/3d-refined/D04_instaladores-de-carregadores-ev.png',
  D05: '/icones-new/3d-refined/D05_integracao-solar-e-mobilidade-eletrica.png',
  D06: '/icones-new/3d-refined/D06_veiculos-eletricos.png',
  E01: '/icones-new/3d-refined/E01_hubs-de-eletromobilidade-e-recarga.png',
} as const;

export const CATEGORY_3D_NAMES: Record<Category3DCode, string> = {
  A01: 'Baterias e Armazenamento de Energia',
  A02: 'Carport Solar e Coberturas Solares',
  A03: 'Energia Solar Comercial e Industrial',
  A04: 'Energia Solar Residencial',
  A05: 'Energia Solar Rural e Agronegócio',
  A06: 'Financiamento de Energia Solar',
  A07: 'Instaladores de Energia Solar',
  A08: 'Inversores',
  A09: 'Monitoramento e O&M',
  A10: 'Painéis Solares',
  A11: 'Energia Solar',
  B01: 'Frotas Elétricas Corporativas',
  B02: 'Frotas Elétricas para Logística e Entregas',
  B03: 'Frotas Elétricas para Mobilidade Urbana',
  B04: 'Gestão de Frotas Elétricas',
  B05: 'Infraestrutura de Recarga para Frotas',
  C01: 'Mercado Livre de Energia',
  D01: 'Carregadores Comerciais e Condomínios',
  D02: 'Carregadores Residenciais Wallbox',
  D03: 'Estações Públicas e Postos Rápidos',
  D04: 'Instaladores de Carregadores EV',
  D05: 'Integração Solar e Mobilidade Elétrica',
  D06: 'Veículos Elétricos',
  E01: 'Hubs de Eletromobilidade e Recarga',
};

/**
 * Tabela canônica de correspondência estrita (slugs, nomes e chaves semânticas).
 * Derivada integralmente do manifest.json de referência da biblioteca 3D.
 */
export const EXPLICIT_CATEGORY_3D_ALIASES: Record<string, Category3DCode> = {
  // A01 — Baterias e Armazenamento de Energia
  'baterias-armazenamento-energia': 'A01',
  'baterias-e-armazenamento-de-energia': 'A01',
  'armazenamento-energia': 'A01',
  'armazenamento-de-energia': 'A01',
  'baterias-e-armazenamento': 'A01',
  baterias: 'A01',
  armazenamento: 'A01',
  battery_storage: 'A01',

  // A02 — Carport Solar e Coberturas Solares
  'carport-solar-coberturas-solares': 'A02',
  'carport-solar-e-coberturas-solares': 'A02',
  'carport-solar': 'A02',
  'carport-coberturas': 'A02',
  carport: 'A02',
  solar_carport: 'A02',

  // A03 — Energia Solar Comercial e Industrial
  'energia-solar-comercial-industrial': 'A03',
  'energia-solar-comercial-e-industrial': 'A03',
  'comercial-industrial': 'A03',
  'comercial-e-industrial': 'A03',
  commercial_industrial_solar: 'A03',

  // A04 — Energia Solar Residencial
  'energia-solar-residencial': 'A04',
  residencial: 'A04',
  residential_solar: 'A04',

  // A05 — Energia Solar Rural e Agronegócio
  'energia-solar-rural-agronegocio': 'A05',
  'energia-solar-rural-e-agronegocio': 'A05',
  'energia-solar-rural': 'A05',
  'rural-agronegocio': 'A05',
  rural_solar: 'A05',

  // A06 — Financiamento de Energia Solar
  'financiamento-energia-solar': 'A06',
  'financiamento-de-energia-solar': 'A06',
  financiamento: 'A06',
  solar_financing: 'A06',

  // A07 — Instaladores de Energia Solar
  'instaladores-energia-solar': 'A07',
  'instaladores-de-energia-solar': 'A07',
  instaladores: 'A07',
  solar_installer: 'A07',

  // A08 — Inversores
  inversores: 'A08',
  'inversores-solares': 'A08',
  inversor: 'A08',
  solar_inverter: 'A08',

  // A09 — Monitoramento e O&M
  'monitoramento-om': 'A09',
  'monitoramento-o-m': 'A09',
  'monitoramento-e-o-e-m': 'A09',
  'monitoramento-operacao-manutencao': 'A09',
  'monitoramento-e-o-m': 'A09',
  monitoring_software: 'A09',

  // A10 — Painéis Solares
  'paineis-solares': 'A10',
  'painel-solar': 'A10',
  paineis: 'A10',
  painel: 'A10',
  solar_panel: 'A10',

  // A11 — Energia Solar (Raiz)
  'energia-solar': 'A11',
  'energia-solar-fotovoltaica': 'A11',

  // B01 — Frotas Elétricas Corporativas
  'frotas-eletricas-corporativas': 'B01',
  'frotas-corporativas': 'B01',
  'frotas-eletricas-empresas': 'B01',
  corporate_fleet: 'B01',
  fleet_electric: 'B01',

  // B02 — Frotas Elétricas para Logística e Entregas
  'frotas-eletricas-para-logistica-e-entregas': 'B02',
  'frotas-logistica': 'B02',
  'frotas-eletricas-logistica': 'B02',
  logistics_fleet: 'B02',

  // B03 — Frotas Elétricas para Mobilidade Urbana
  'frotas-eletricas-para-mobilidade-urbana': 'B03',
  'mobilidade-urbana': 'B03',
  urban_mobility: 'B03',

  // B04 — Gestão de Frotas Elétricas
  'gestao-de-frotas-eletricas': 'B04',
  'gestao-frotas': 'B04',
  'gestao-de-frotas': 'B04',
  fleet_management: 'B04',

  // B05 — Infraestrutura de Recarga para Frotas
  'infraestrutura-de-recarga-para-frotas': 'B05',
  'recarga-frotas': 'B05',
  fleet_charging: 'B05',

  // C01 — Mercado Livre de Energia
  'mercado-livre-de-energia': 'C01',
  'mercado-livre': 'C01',
  free_energy_market: 'C01',

  // D01 — Carregadores Comerciais e Condomínios
  'carregadores-comerciais-e-condominios': 'D01',
  'carregadores-comerciais': 'D01',
  commercial_ev_charger: 'D01',

  // D02 — Carregadores Residenciais Wallbox
  'carregadores-residenciais-wallbox': 'D02',
  'carregadores-residenciais': 'D02',
  'wallbox-residencial': 'D02',
  'carregador-residencial': 'D02',
  home_wallbox: 'D02',

  // D03 — Estações Públicas e Postos Rápidos
  'estacoes-publicas-e-postos-rapidos': 'D03',
  'estacoes-publicas': 'D03',
  'postos-rapidos': 'D03',
  public_charging_station: 'D03',

  // D04 — Instaladores de Carregadores EV
  'instaladores-de-carregadores-ev': 'D04',
  'instaladores-carregadores': 'D04',
  'instaladores-ev': 'D04',
  ev_installer: 'D04',

  // D05 — Integração Solar e Mobilidade Elétrica
  'integracao-solar-e-mobilidade-eletrica': 'D05',
  'integracao-solar-mobilidade-eletrica': 'D05',
  'integracao-solar-mobilidade': 'D05',
  'integracao-solar-ev': 'D05',
  solar_mobility_integration: 'D05',

  // D06 — Veículos Elétricos
  'veiculos-eletricos': 'D06',
  'veiculo-eletrico': 'D06',
  'carros-eletricos': 'D06',
  'carro-eletrico': 'D06',
  electric_vehicle: 'D06',

  // E01 — Hubs de Eletromobilidade e Recarga
  'hubs-de-eletromobilidade-e-recarga': 'E01',
  'hubs-eletromobilidade': 'E01',
  'hubs-de-recarga': 'E01',
  electromobility_hub: 'E01',
};

/**
 * Normaliza strings para casamento semântico determinístico:
 * minúsculo, sem acentos, substitui '&' e pontuações por hífens.
 */
export function normalizeCategory3DKey(value?: string | null): string {
  if (!value) return '';
  return String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface Category3DInput {
  slug?: string | null;
  seo_url?: string | null;
  name?: string | null;
  visualKey?: string | null;
  sizeVariant?: Category3DSizeVariant;
}

export interface Category3DResult {
  code: Category3DCode;
  src: string;
  name: string;
}

/**
 * Resolve os detalhes de um ícone 3D refinado a partir dos parâmetros da categoria.
 * Retorna null se a categoria não fizer parte do pacote dos 24 ícones.
 */
export function getCategory3DDetails(
  input?: Category3DInput | string | null
): Category3DResult | null {
  if (!input) return null;

  const resolvedInput: Category3DInput =
    typeof input === 'string'
      ? { slug: input }
      : input;

  const sizeVariant = resolvedInput.sizeVariant || '512';
  const candidates = [
    resolvedInput.slug,
    resolvedInput.seo_url,
    resolvedInput.visualKey,
    resolvedInput.name,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const rawKey = candidate.trim().toLowerCase();
    const normKey = normalizeCategory3DKey(candidate);
    const code =
      EXPLICIT_CATEGORY_3D_ALIASES[rawKey] ||
      (normKey ? EXPLICIT_CATEGORY_3D_ALIASES[normKey] : undefined);
    if (code) {
      let src: string;
      if (sizeVariant === '256') {
        src = CATEGORY_3D_ASSETS_256[code];
      } else if (sizeVariant === '1024') {
        src = CATEGORY_3D_ASSETS_1024[code];
      } else {
        src = CATEGORY_3D_ASSETS_512[code];
      }

      return {
        code,
        src,
        name: CATEGORY_3D_NAMES[code],
      };
    }
  }

  return null;
}

/**
 * Obtém diretamente a URL pública do asset 3D correspondente ou null.
 *
 * Exemplo de uso:
 * const new3D = getCategory3DIcon({ slug, name, visualKey, sizeVariant: '256' });
 */
export function getCategory3DIcon(
  input?: Category3DInput | string | null
): string | null {
  const details = getCategory3DDetails(input);
  return details ? details.src : null;
}
