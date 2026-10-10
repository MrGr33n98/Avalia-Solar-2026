/**
 * Catálogo canônico dos 47 ícones semânticos de categorias e subcategorias.
 *
 * Fonte da verdade visual para Avalia Solar Web + PWA:
 * 9 categorias principais (A até I) + 38 subcategorias.
 *
 * Todos os assets são SVGs monocromáticos pretos (#000000), 24x24 viewBox,
 * fundo transparente, servidos publicamente em `/icones-new/...`.
 */

export type CategoryMotionPreset =
  | 'solar'
  | 'mobility'
  | 'energyMarket'
  | 'charging'
  | 'hub'
  | 'neutral';

export interface CategoryIconDefinition {
  /** Código no novo catálogo: 'A'..'I' para principais, 'A01'..'I03' para subcategorias */
  id: string;
  name: string;
  type: 'principal' | 'subcategoria';
  groupCode: string;
  parentCode: string | null;
  /** Caminho relativo a /icones-new/ */
  svgRelativePath: string;
  /** URL pública absoluta para consumo no Next.js */
  src: string;
  canonicalSlug: string;
  aliases: string[];
  alt: string;
  motionPreset: CategoryMotionPreset;
}

export const CATEGORY_ICON_PUBLIC_BASE = '/icones-new';

export const CATEGORY_ICON_MANIFEST: Record<string, CategoryIconDefinition> = {
  // =========================================================================
  // GRUPO A: ENERGIA SOLAR (12 ícones: 1 principal + 11 subcategorias)
  // =========================================================================
  A: {
    id: 'A',
    name: 'Energia Solar',
    type: 'principal',
    groupCode: 'A',
    parentCode: null,
    svgRelativePath: 'A_energia-solar/principal/a_energia-solar.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/A_energia-solar/principal/a_energia-solar.svg`,
    canonicalSlug: 'energia-solar',
    aliases: ['energia-solar-fotovoltaica', 'solar', 'energia_solar'],
    alt: 'Energia Solar',
    motionPreset: 'solar',
  },
  A01: {
    id: 'A01',
    name: 'Baterias e Armazenamento de Energia',
    type: 'subcategoria',
    groupCode: 'A',
    parentCode: 'A',
    svgRelativePath: 'A_energia-solar/subcategorias/a01_baterias-e-armazenamento-de-energia.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/A_energia-solar/subcategorias/a01_baterias-e-armazenamento-de-energia.svg`,
    canonicalSlug: 'baterias-e-armazenamento-de-energia',
    aliases: [
      'baterias-armazenamento-energia',
      'baterias-e-armazenamento',
      'baterias-armazenamento',
      'armazenamento-energia',
      'baterias',
      'armazenamento',
      'battery-storage',
      'battery_storage',
    ],
    alt: 'Baterias e Armazenamento de Energia',
    motionPreset: 'solar',
  },
  A02: {
    id: 'A02',
    name: 'Carport Solar / Coberturas Solares',
    type: 'subcategoria',
    groupCode: 'A',
    parentCode: 'A',
    svgRelativePath: 'A_energia-solar/subcategorias/a02_carport-solar-coberturas-solares.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/A_energia-solar/subcategorias/a02_carport-solar-coberturas-solares.svg`,
    canonicalSlug: 'carport-solar-coberturas-solares',
    aliases: [
      'carport-coberturas',
      'carport-solar',
      'carport',
      'coberturas-solares',
      'coberturas',
      'solar-carport',
      'solar_carport',
    ],
    alt: 'Carport Solar e Coberturas Solares',
    motionPreset: 'solar',
  },
  A03: {
    id: 'A03',
    name: 'Energia Solar Comercial e Industrial',
    type: 'subcategoria',
    groupCode: 'A',
    parentCode: 'A',
    svgRelativePath: 'A_energia-solar/subcategorias/a03_energia-solar-comercial-e-industrial.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/A_energia-solar/subcategorias/a03_energia-solar-comercial-e-industrial.svg`,
    canonicalSlug: 'energia-solar-comercial-e-industrial',
    aliases: [
      'energia-solar-comercial-industrial',
      'comercial-industrial',
      'energia-solar-comercial',
      'energia-solar-industrial',
      'comercial-e-industrial',
      'commercial-industrial-solar',
      'commercial_industrial_solar',
      'industrial',
    ],
    alt: 'Energia Solar Comercial e Industrial',
    motionPreset: 'solar',
  },
  A04: {
    id: 'A04',
    name: 'Energia Solar Residencial',
    type: 'subcategoria',
    groupCode: 'A',
    parentCode: 'A',
    svgRelativePath: 'A_energia-solar/subcategorias/a04_energia-solar-residencial.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/A_energia-solar/subcategorias/a04_energia-solar-residencial.svg`,
    canonicalSlug: 'energia-solar-residencial',
    aliases: [
      'solar-residencial',
      'residencial',
      'residential-solar',
      'residential_solar',
      'casa',
      'condominio',
    ],
    alt: 'Energia Solar Residencial',
    motionPreset: 'solar',
  },
  A05: {
    id: 'A05',
    name: 'Energia Solar Rural / Agronegócio',
    type: 'subcategoria',
    groupCode: 'A',
    parentCode: 'A',
    svgRelativePath: 'A_energia-solar/subcategorias/a05_energia-solar-rural-agronegocio.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/A_energia-solar/subcategorias/a05_energia-solar-rural-agronegocio.svg`,
    canonicalSlug: 'energia-solar-rural-agronegocio',
    aliases: [
      'energia-solar-rural',
      'rural-agronegocio',
      'rural',
      'agronegocio',
      'agronegócio',
      'rural-solar',
      'rural_solar',
      'agropecuaria',
      'agricola',
    ],
    alt: 'Energia Solar Rural e Agronegócio',
    motionPreset: 'solar',
  },
  A06: {
    id: 'A06',
    name: 'Estruturas e Fixação',
    type: 'subcategoria',
    groupCode: 'A',
    parentCode: 'A',
    svgRelativePath: 'A_energia-solar/subcategorias/a06_estruturas-e-fixacao.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/A_energia-solar/subcategorias/a06_estruturas-e-fixacao.svg`,
    canonicalSlug: 'estruturas-e-fixacao',
    aliases: [
      'estruturas-fixacao',
      'estruturas-de-montagem',
      'estruturas-de-fixacao',
      'estruturas',
      'fixacao',
    ],
    alt: 'Estruturas e Fixação',
    motionPreset: 'solar',
  },
  A07: {
    id: 'A07',
    name: 'Financiamento de Energia Solar',
    type: 'subcategoria',
    groupCode: 'A',
    parentCode: 'A',
    svgRelativePath: 'A_energia-solar/subcategorias/a07_financiamento-de-energia-solar.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/A_energia-solar/subcategorias/a07_financiamento-de-energia-solar.svg`,
    canonicalSlug: 'financiamento-de-energia-solar',
    aliases: [
      'financiamento-energia-solar',
      'financiamento',
      'solar-financing',
      'solar_financing',
      'credito-solar',
      'credito-verde-solar',
    ],
    alt: 'Financiamento de Energia Solar',
    motionPreset: 'solar',
  },
  A08: {
    id: 'A08',
    name: 'Instaladores de Energia Solar',
    type: 'subcategoria',
    groupCode: 'A',
    parentCode: 'A',
    svgRelativePath: 'A_energia-solar/subcategorias/a08_instaladores-de-energia-solar.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/A_energia-solar/subcategorias/a08_instaladores-de-energia-solar.svg`,
    canonicalSlug: 'instaladores-de-energia-solar',
    aliases: [
      'instaladores-energia-solar',
      'instaladores-e-integradores',
      'instaladores',
      'instalador',
      'solar-installer',
      'solar_installer',
      'integradores',
    ],
    alt: 'Instaladores de Energia Solar',
    motionPreset: 'solar',
  },
  A09: {
    id: 'A09',
    name: 'Inversores',
    type: 'subcategoria',
    groupCode: 'A',
    parentCode: 'A',
    svgRelativePath: 'A_energia-solar/subcategorias/a09_inversores.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/A_energia-solar/subcategorias/a09_inversores.svg`,
    canonicalSlug: 'inversores',
    aliases: [
      'inversores-solares',
      'inversor',
      'solar-inverter',
      'solar_inverter',
      'micro-inversores',
      'inversor-solar',
    ],
    alt: 'Inversores',
    motionPreset: 'solar',
  },
  A10: {
    id: 'A10',
    name: 'Monitoramento e O&M',
    type: 'subcategoria',
    groupCode: 'A',
    parentCode: 'A',
    svgRelativePath: 'A_energia-solar/subcategorias/a10_monitoramento-e-o-m.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/A_energia-solar/subcategorias/a10_monitoramento-e-o-m.svg`,
    canonicalSlug: 'monitoramento-e-o-m',
    aliases: [
      'monitoramento-om',
      'monitoramento-operacao-manutencao',
      'monitoramento-e-manutencao',
      'manutencao-e-suporte',
      'operacao-e-manutencao',
      'o-m',
    ],
    alt: 'Monitoramento e O&M',
    motionPreset: 'solar',
  },
  A11: {
    id: 'A11',
    name: 'Painéis Solares',
    type: 'subcategoria',
    groupCode: 'A',
    parentCode: 'A',
    svgRelativePath: 'A_energia-solar/subcategorias/a11_paineis-solares.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/A_energia-solar/subcategorias/a11_paineis-solares.svg`,
    canonicalSlug: 'paineis-solares',
    aliases: [
      'painel-solar',
      'paineis',
      'painel',
      'placas-solares',
      'solar-panel',
      'solar_panel',
      'modulos-fotovoltaicos',
      'paineis-fotovoltaicos',
    ],
    alt: 'Painéis Solares',
    motionPreset: 'solar',
  },

  // =========================================================================
  // GRUPO B: MOBILIDADE ELÉTRICA (7 ícones: 1 principal + 6 subcategorias)
  // =========================================================================
  B: {
    id: 'B',
    name: 'Mobilidade Elétrica',
    type: 'principal',
    groupCode: 'B',
    parentCode: null,
    svgRelativePath: 'B_mobilidade-eletrica/principal/b_mobilidade-eletrica.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/B_mobilidade-eletrica/principal/b_mobilidade-eletrica.svg`,
    canonicalSlug: 'mobilidade-eletrica',
    aliases: ['mobilidade', 'eletromobilidade'],
    alt: 'Mobilidade Elétrica',
    motionPreset: 'charging',
  },
  B01: {
    id: 'B01',
    name: 'Carregadores Comerciais e Condomínios',
    type: 'subcategoria',
    groupCode: 'B',
    parentCode: 'B',
    svgRelativePath: 'B_mobilidade-eletrica/subcategorias/b01_carregadores-comerciais-e-condominios.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/B_mobilidade-eletrica/subcategorias/b01_carregadores-comerciais-e-condominios.svg`,
    canonicalSlug: 'carregadores-comerciais-e-condominios',
    aliases: [
      'carregadores-comerciais',
      'recarga-comercial',
      'carregador-comercial',
      'commercial-ev-charger',
      'commercial_ev_charger',
      'carregadores-condominios',
    ],
    alt: 'Carregadores Comerciais e Condomínios',
    motionPreset: 'charging',
  },
  B02: {
    id: 'B02',
    name: 'Carregadores Residenciais / Wallbox',
    type: 'subcategoria',
    groupCode: 'B',
    parentCode: 'B',
    svgRelativePath: 'B_mobilidade-eletrica/subcategorias/b02_carregadores-residenciais-wallbox.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/B_mobilidade-eletrica/subcategorias/b02_carregadores-residenciais-wallbox.svg`,
    canonicalSlug: 'carregadores-residenciais-wallbox',
    aliases: [
      'carregadores-residenciais',
      'carregador-residencial',
      'wallbox-residencial',
      'wallbox',
      'home-wallbox',
      'home_wallbox',
      'carregadores-veiculares',
    ],
    alt: 'Carregadores Residenciais e Wallbox',
    motionPreset: 'charging',
  },
  B03: {
    id: 'B03',
    name: 'Estações Públicas e Postos Rápidos',
    type: 'subcategoria',
    groupCode: 'B',
    parentCode: 'B',
    svgRelativePath: 'B_mobilidade-eletrica/subcategorias/b03_estacoes-publicas-e-postos-rapidos.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/B_mobilidade-eletrica/subcategorias/b03_estacoes-publicas-e-postos-rapidos.svg`,
    canonicalSlug: 'estacoes-publicas-e-postos-rapidos',
    aliases: [
      'estacoes-publicas',
      'postos-rapidos',
      'eletropostos',
      'recarga-rapida',
      'public-charging-station',
      'public_charging_station',
    ],
    alt: 'Estações Públicas e Postos Rápidos',
    motionPreset: 'charging',
  },
  B04: {
    id: 'B04',
    name: 'Instaladores de Carregadores EV',
    type: 'subcategoria',
    groupCode: 'B',
    parentCode: 'B',
    svgRelativePath: 'B_mobilidade-eletrica/subcategorias/b04_instaladores-de-carregadores-ev.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/B_mobilidade-eletrica/subcategorias/b04_instaladores-de-carregadores-ev.svg`,
    canonicalSlug: 'instaladores-de-carregadores-ev',
    aliases: [
      'instaladores-carregadores-ev',
      'instaladores-carregadores',
      'instaladores-ev',
      'instaladores-de-ev',
      'instalador-ev',
      'ev-installer',
      'ev_installer',
    ],
    alt: 'Instaladores de Carregadores EV',
    motionPreset: 'charging',
  },
  B05: {
    id: 'B05',
    name: 'Integração Solar + Mobilidade Elétrica',
    type: 'subcategoria',
    groupCode: 'B',
    parentCode: 'B',
    svgRelativePath: 'B_mobilidade-eletrica/subcategorias/b05_integracao-solar-mobilidade-eletrica.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/B_mobilidade-eletrica/subcategorias/b05_integracao-solar-mobilidade-eletrica.svg`,
    canonicalSlug: 'integracao-solar-mobilidade-eletrica',
    aliases: [
      'integracao-solar-mobilidade',
      'integracao-solar-ev',
      'solar-mobilidade-eletrica',
      'solar-mobility-integration',
      'solar_mobility_integration',
    ],
    alt: 'Integração Solar + Mobilidade Elétrica',
    motionPreset: 'charging',
  },
  B06: {
    id: 'B06',
    name: 'Veículos Elétricos',
    type: 'subcategoria',
    groupCode: 'B',
    parentCode: 'B',
    svgRelativePath: 'B_mobilidade-eletrica/subcategorias/b06_veiculos-eletricos.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/B_mobilidade-eletrica/subcategorias/b06_veiculos-eletricos.svg`,
    canonicalSlug: 'veiculos-eletricos',
    aliases: [
      'carros-eletricos',
      'veiculo-eletrico',
      'veiculos-eletricos-e-hibridos',
      'electric-vehicle',
      'electric_vehicle',
    ],
    alt: 'Veículos Elétricos',
    motionPreset: 'mobility',
  },

  // =========================================================================
  // GRUPO C: FROTAS ELÉTRICAS (6 ícones: 1 principal + 5 subcategorias)
  // =========================================================================
  C: {
    id: 'C',
    name: 'Frotas Elétricas',
    type: 'principal',
    groupCode: 'C',
    parentCode: null,
    svgRelativePath: 'C_frotas-eletricas/principal/c_frotas-eletricas.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/C_frotas-eletricas/principal/c_frotas-eletricas.svg`,
    canonicalSlug: 'frotas-eletricas',
    aliases: ['frotas', 'frota-eletrica'],
    alt: 'Frotas Elétricas',
    motionPreset: 'mobility',
  },
  C01: {
    id: 'C01',
    name: 'Frotas Elétricas Corporativas',
    type: 'subcategoria',
    groupCode: 'C',
    parentCode: 'C',
    svgRelativePath: 'C_frotas-eletricas/subcategorias/c01_frotas-eletricas-corporativas.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/C_frotas-eletricas/subcategorias/c01_frotas-eletricas-corporativas.svg`,
    canonicalSlug: 'frotas-eletricas-corporativas',
    aliases: [
      'frotas-corporativas',
      'frotas-eletricas-empresas',
      'frota-corporativa',
      'corporate-fleet',
      'corporate_fleet',
      'fleet-electric',
      'fleet_electric',
    ],
    alt: 'Frotas Elétricas Corporativas',
    motionPreset: 'mobility',
  },
  C02: {
    id: 'C02',
    name: 'Frotas Elétricas para Logística e Entregas',
    type: 'subcategoria',
    groupCode: 'C',
    parentCode: 'C',
    svgRelativePath: 'C_frotas-eletricas/subcategorias/c02_frotas-eletricas-para-logistica-e-entregas.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/C_frotas-eletricas/subcategorias/c02_frotas-eletricas-para-logistica-e-entregas.svg`,
    canonicalSlug: 'frotas-eletricas-para-logistica-e-entregas',
    aliases: [
      'frotas-eletricas-logistica',
      'frotas-logistica',
      'frota-de-logistica',
      'frotas-para-logistica',
      'logistics-fleet',
      'logistics_fleet',
    ],
    alt: 'Frotas Elétricas para Logística e Entregas',
    motionPreset: 'mobility',
  },
  C03: {
    id: 'C03',
    name: 'Frotas Elétricas para Mobilidade Urbana',
    type: 'subcategoria',
    groupCode: 'C',
    parentCode: 'C',
    svgRelativePath: 'C_frotas-eletricas/subcategorias/c03_frotas-eletricas-para-mobilidade-urbana.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/C_frotas-eletricas/subcategorias/c03_frotas-eletricas-para-mobilidade-urbana.svg`,
    canonicalSlug: 'frotas-eletricas-para-mobilidade-urbana',
    aliases: [
      'frotas-para-mobilidade-urbana',
      'mobilidade-urbana',
      'mobilidade-urbana-frotas',
      'urban-mobility',
      'urban_mobility',
    ],
    alt: 'Frotas Elétricas para Mobilidade Urbana',
    motionPreset: 'mobility',
  },
  C04: {
    id: 'C04',
    name: 'Gestão de Frotas Elétricas',
    type: 'subcategoria',
    groupCode: 'C',
    parentCode: 'C',
    svgRelativePath: 'C_frotas-eletricas/subcategorias/c04_gestao-de-frotas-eletricas.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/C_frotas-eletricas/subcategorias/c04_gestao-de-frotas-eletricas.svg`,
    canonicalSlug: 'gestao-de-frotas-eletricas',
    aliases: [
      'gestao-frotas',
      'gestao-de-frotas',
      'gestão-de-frotas',
      'fleet-management',
      'fleet_management',
    ],
    alt: 'Gestão de Frotas Elétricas',
    motionPreset: 'mobility',
  },
  C05: {
    id: 'C05',
    name: 'Infraestrutura de Recarga para Frotas',
    type: 'subcategoria',
    groupCode: 'C',
    parentCode: 'C',
    svgRelativePath: 'C_frotas-eletricas/subcategorias/c05_infraestrutura-de-recarga-para-frotas.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/C_frotas-eletricas/subcategorias/c05_infraestrutura-de-recarga-para-frotas.svg`,
    canonicalSlug: 'infraestrutura-de-recarga-para-frotas',
    aliases: [
      'recarga-frotas',
      'recarga-para-frotas',
      'infraestrutura-recarga-frotas',
      'fleet-charging',
      'fleet_charging',
    ],
    alt: 'Infraestrutura de Recarga para Frotas',
    motionPreset: 'mobility',
  },

  // =========================================================================
  // GRUPO D: MERCADO LIVRE DE ENERGIA (2 ícones: 1 principal + 1 subcategoria)
  // =========================================================================
  D: {
    id: 'D',
    name: 'Mercado Livre de Energia',
    type: 'principal',
    groupCode: 'D',
    parentCode: null,
    svgRelativePath: 'D_mercado-livre-de-energia/principal/d_mercado-livre-de-energia.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/D_mercado-livre-de-energia/principal/d_mercado-livre-de-energia.svg`,
    canonicalSlug: 'mercado-livre-de-energia',
    aliases: [
      'mercado-livre',
      'acl',
      'ambiente-contratacao-livre',
      'free-energy-market',
      'free_energy_market',
    ],
    alt: 'Mercado Livre de Energia',
    motionPreset: 'energyMarket',
  },
  D01: {
    id: 'D01',
    name: 'Mercado Livre de Energia',
    type: 'subcategoria',
    groupCode: 'D',
    parentCode: 'D',
    svgRelativePath: 'D_mercado-livre-de-energia/subcategorias/d01_mercado-livre-de-energia.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/D_mercado-livre-de-energia/subcategorias/d01_mercado-livre-de-energia.svg`,
    canonicalSlug: 'mercado-livre-de-energia-sub',
    aliases: [
      'migracao-mercado-livre',
      'comercializadoras-energia',
      'gestao-mercado-livre',
      'mercado-livre-energia',
    ],
    alt: 'Mercado Livre de Energia',
    motionPreset: 'energyMarket',
  },

  // =========================================================================
  // GRUPO E: HUBS DE ELETROMOBILIDADE (2 ícones: 1 principal + 1 subcategoria)
  // =========================================================================
  E: {
    id: 'E',
    name: 'Hubs de Eletromobilidade e Recarga',
    type: 'principal',
    groupCode: 'E',
    parentCode: null,
    svgRelativePath: 'E_hubs-de-eletromobilidade-e-recarga/principal/e_hubs-de-eletromobilidade-e-recarga.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/E_hubs-de-eletromobilidade-e-recarga/principal/e_hubs-de-eletromobilidade-e-recarga.svg`,
    canonicalSlug: 'hubs-de-eletromobilidade-e-recarga',
    aliases: [
      'hubs-eletromobilidade',
      'hub-eletromobilidade',
      'hubs-recarga',
      'electromobility-hub',
      'electromobility_hub',
    ],
    alt: 'Hubs de Eletromobilidade e Recarga',
    motionPreset: 'hub',
  },
  E01: {
    id: 'E01',
    name: 'Hubs de Eletromobilidade e Recarga',
    type: 'subcategoria',
    groupCode: 'E',
    parentCode: 'E',
    svgRelativePath: 'E_hubs-de-eletromobilidade-e-recarga/subcategorias/e01_hubs-de-eletromobilidade-e-recarga.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/E_hubs-de-eletromobilidade-e-recarga/subcategorias/e01_hubs-de-eletromobilidade-e-recarga.svg`,
    canonicalSlug: 'hubs-de-eletromobilidade-e-recarga-sub',
    aliases: ['centros-de-recarga', 'parques-de-recarga'],
    alt: 'Hubs de Eletromobilidade e Recarga',
    motionPreset: 'hub',
  },

  // =========================================================================
  // GRUPO F: APPS, SOFTWARE E PLATAFORMAS (5 ícones: 1 principal + 4 subcategorias)
  // =========================================================================
  F: {
    id: 'F',
    name: 'Apps, Software e Plataformas',
    type: 'principal',
    groupCode: 'F',
    parentCode: null,
    svgRelativePath: 'F_apps-software-e-plataformas/principal/f_apps-software-e-plataformas.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/F_apps-software-e-plataformas/principal/f_apps-software-e-plataformas.svg`,
    canonicalSlug: 'apps-software-e-plataformas',
    aliases: [
      'software-e-plataformas',
      'apps-software',
      'plataformas-solares',
      'software-solar',
    ],
    alt: 'Apps, Software e Plataformas',
    motionPreset: 'solar',
  },
  F01: {
    id: 'F01',
    name: 'Gestão de Recarga VE',
    type: 'subcategoria',
    groupCode: 'F',
    parentCode: 'F',
    svgRelativePath: 'F_apps-software-e-plataformas/subcategorias/f01_gestao-de-recarga-ve.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/F_apps-software-e-plataformas/subcategorias/f01_gestao-de-recarga-ve.svg`,
    canonicalSlug: 'gestao-de-recarga-ve',
    aliases: [
      'gestao-recarga-ve',
      'software-recarga-ve',
      'gestao-recarga',
      'app-recarga-ve',
    ],
    alt: 'Gestão de Recarga VE',
    motionPreset: 'charging',
  },
  F02: {
    id: 'F02',
    name: 'Integração Smart Grid',
    type: 'subcategoria',
    groupCode: 'F',
    parentCode: 'F',
    svgRelativePath: 'F_apps-software-e-plataformas/subcategorias/f02_integracao-smart-grid.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/F_apps-software-e-plataformas/subcategorias/f02_integracao-smart-grid.svg`,
    canonicalSlug: 'integracao-smart-grid',
    aliases: ['smart-grid', 'redes-inteligentes', 'integracao-grid'],
    alt: 'Integração Smart Grid',
    motionPreset: 'solar',
  },
  F03: {
    id: 'F03',
    name: 'Monitoramento de Energia Solar',
    type: 'subcategoria',
    groupCode: 'F',
    parentCode: 'F',
    svgRelativePath: 'F_apps-software-e-plataformas/subcategorias/f03_monitoramento-de-energia-solar.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/F_apps-software-e-plataformas/subcategorias/f03_monitoramento-de-energia-solar.svg`,
    canonicalSlug: 'monitoramento-de-energia-solar',
    aliases: [
      'software-monitoramento-solar',
      'monitoramento-solar-software',
      'app-monitoramento-solar',
      'plataforma-monitoramento-solar',
    ],
    alt: 'Monitoramento de Energia Solar',
    motionPreset: 'solar',
  },
  F04: {
    id: 'F04',
    name: 'Simulação e Projeto Solar',
    type: 'subcategoria',
    groupCode: 'F',
    parentCode: 'F',
    svgRelativePath: 'F_apps-software-e-plataformas/subcategorias/f04_simulacao-e-projeto-solar.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/F_apps-software-e-plataformas/subcategorias/f04_simulacao-e-projeto-solar.svg`,
    canonicalSlug: 'simulacao-e-projeto-solar',
    aliases: [
      'simulacao-projeto-solar',
      'software-projeto-solar',
      'simulacao-solar',
      'projetistas-e-engenharia',
    ],
    alt: 'Simulação e Projeto Solar',
    motionPreset: 'solar',
  },

  // =========================================================================
  // GRUPO G: CASA SUSTENTÁVEL E OFF-GRID (4 ícones: 1 principal + 3 subcategorias)
  // =========================================================================
  G: {
    id: 'G',
    name: 'Casa Sustentável e Off-Grid',
    type: 'principal',
    groupCode: 'G',
    parentCode: null,
    svgRelativePath: 'G_casa-sustentavel-e-off-grid/principal/g_casa-sustentavel-e-off-grid.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/G_casa-sustentavel-e-off-grid/principal/g_casa-sustentavel-e-off-grid.svg`,
    canonicalSlug: 'casa-sustentavel-e-off-grid',
    aliases: [
      'casa-sustentavel',
      'off-grid',
      'projetos-off-grid',
      'sistemas-off-grid',
    ],
    alt: 'Casa Sustentável e Off-Grid',
    motionPreset: 'solar',
  },
  G01: {
    id: 'G01',
    name: 'Kits Solares para Autossuficiência',
    type: 'subcategoria',
    groupCode: 'G',
    parentCode: 'G',
    svgRelativePath: 'G_casa-sustentavel-e-off-grid/subcategorias/g01_kits-solares-para-autossuficiencia.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/G_casa-sustentavel-e-off-grid/subcategorias/g01_kits-solares-para-autossuficiencia.svg`,
    canonicalSlug: 'kits-solares-para-autossuficiencia',
    aliases: [
      'kits-solares',
      'kit-solar',
      'kit-off-grid',
      'autossuficiencia',
      'geradores-solares',
    ],
    alt: 'Kits Solares para Autossuficiência',
    motionPreset: 'solar',
  },
  G02: {
    id: 'G02',
    name: 'Reuso de Água e Energias Complementares',
    type: 'subcategoria',
    groupCode: 'G',
    parentCode: 'G',
    svgRelativePath: 'G_casa-sustentavel-e-off-grid/subcategorias/g02_reuso-de-agua-e-energias-complementares.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/G_casa-sustentavel-e-off-grid/subcategorias/g02_reuso-de-agua-e-energias-complementares.svg`,
    canonicalSlug: 'reuso-de-agua-e-energias-complementares',
    aliases: [
      'reuso-de-agua',
      'energias-complementares',
      'bombas-solares',
      'aquecimento-solar',
    ],
    alt: 'Reuso de Água e Energias Complementares',
    motionPreset: 'solar',
  },
  G03: {
    id: 'G03',
    name: 'Soluções para Áreas Remotas',
    type: 'subcategoria',
    groupCode: 'G',
    parentCode: 'G',
    svgRelativePath: 'G_casa-sustentavel-e-off-grid/subcategorias/g03_solucoes-para-areas-remotas.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/G_casa-sustentavel-e-off-grid/subcategorias/g03_solucoes-para-areas-remotas.svg`,
    canonicalSlug: 'solucoes-para-areas-remotas',
    aliases: ['areas-remotas', 'comunidades-isoladas', 'eletrificacao-rural'],
    alt: 'Soluções para Áreas Remotas',
    motionPreset: 'solar',
  },

  // =========================================================================
  // GRUPO H: MERCADO, LEGISLAÇÃO E FINANÇAS (5 ícones: 1 principal + 4 subcategorias)
  // =========================================================================
  H: {
    id: 'H',
    name: 'Mercado, Legislação e Finanças',
    type: 'principal',
    groupCode: 'H',
    parentCode: null,
    svgRelativePath: 'H_mercado-legislacao-e-financas/principal/h_mercado-legislacao-e-financas.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/H_mercado-legislacao-e-financas/principal/h_mercado-legislacao-e-financas.svg`,
    canonicalSlug: 'mercado-legislacao-e-financas',
    aliases: [
      'mercado-legislacao-financas',
      'legislacao-e-financas',
      'mercado-e-legislacao',
    ],
    alt: 'Mercado, Legislação e Finanças',
    motionPreset: 'energyMarket',
  },
  H01: {
    id: 'H01',
    name: 'Legislação e Normas Setoriais',
    type: 'subcategoria',
    groupCode: 'H',
    parentCode: 'H',
    svgRelativePath: 'H_mercado-legislacao-e-financas/subcategorias/h01_legislacao-e-normas-setoriais.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/H_mercado-legislacao-e-financas/subcategorias/h01_legislacao-e-normas-setoriais.svg`,
    canonicalSlug: 'legislacao-e-normas-setoriais',
    aliases: [
      'legislacao-e-normas',
      'legislacao-normas',
      'normas-setoriais',
      'regulamentacao-solar',
      'consultoria-e-homologacao',
    ],
    alt: 'Legislação e Normas Setoriais',
    motionPreset: 'energyMarket',
  },
  H02: {
    id: 'H02',
    name: 'Linhas de Crédito Verde',
    type: 'subcategoria',
    groupCode: 'H',
    parentCode: 'H',
    svgRelativePath: 'H_mercado-legislacao-e-financas/subcategorias/h02_linhas-de-credito-verde.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/H_mercado-legislacao-e-financas/subcategorias/h02_linhas-de-credito-verde.svg`,
    canonicalSlug: 'linhas-de-credito-verde',
    aliases: [
      'credito-verde',
      'financiamento-verde',
      'financiamento-esg',
      'fundos-climaticos',
    ],
    alt: 'Linhas de Crédito Verde',
    motionPreset: 'energyMarket',
  },
  H03: {
    id: 'H03',
    name: 'Seguradoras para Solar e VE',
    type: 'subcategoria',
    groupCode: 'H',
    parentCode: 'H',
    svgRelativePath: 'H_mercado-legislacao-e-financas/subcategorias/h03_seguradoras-para-solar-e-ve.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/H_mercado-legislacao-e-financas/subcategorias/h03_seguradoras-para-solar-e-ve.svg`,
    canonicalSlug: 'seguradoras-para-solar-e-ve',
    aliases: [
      'seguradoras-solar',
      'seguros-solar',
      'seguros-para-ve',
      'seguros',
    ],
    alt: 'Seguradoras para Solar e VE',
    motionPreset: 'energyMarket',
  },
  H04: {
    id: 'H04',
    name: 'Tendências de Mercado',
    type: 'subcategoria',
    groupCode: 'H',
    parentCode: 'H',
    svgRelativePath: 'H_mercado-legislacao-e-financas/subcategorias/h04_tendencias-de-mercado.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/H_mercado-legislacao-e-financas/subcategorias/h04_tendencias-de-mercado.svg`,
    canonicalSlug: 'tendencias-de-mercado',
    aliases: ['tendencias', 'analise-de-mercado', 'estudos-setoriais'],
    alt: 'Tendências de Mercado',
    motionPreset: 'energyMarket',
  },

  // =========================================================================
  // GRUPO I: SUSTENTABILIDADE E ESG (4 ícones: 1 principal + 3 subcategorias)
  // =========================================================================
  I: {
    id: 'I',
    name: 'Sustentabilidade e ESG',
    type: 'principal',
    groupCode: 'I',
    parentCode: null,
    svgRelativePath: 'I_sustentabilidade-e-esg/principal/i_sustentabilidade-e-esg.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/I_sustentabilidade-e-esg/principal/i_sustentabilidade-e-esg.svg`,
    canonicalSlug: 'sustentabilidade-e-esg',
    aliases: ['sustentabilidade', 'esg', 'sustentabilidade-esg'],
    alt: 'Sustentabilidade e ESG',
    motionPreset: 'neutral',
  },
  I01: {
    id: 'I01',
    name: 'Carbono Neutro e Compensação',
    type: 'subcategoria',
    groupCode: 'I',
    parentCode: 'I',
    svgRelativePath: 'I_sustentabilidade-e-esg/subcategorias/i01_carbono-neutro-e-compensacao.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/I_sustentabilidade-e-esg/subcategorias/i01_carbono-neutro-e-compensacao.svg`,
    canonicalSlug: 'carbono-neutro-e-compensacao',
    aliases: [
      'carbono-neutro',
      'compensacao-de-carbono',
      'creditos-de-carbono',
      'descarbonizacao',
    ],
    alt: 'Carbono Neutro e Compensação',
    motionPreset: 'neutral',
  },
  I02: {
    id: 'I02',
    name: 'Políticas Corporativas ESG',
    type: 'subcategoria',
    groupCode: 'I',
    parentCode: 'I',
    svgRelativePath: 'I_sustentabilidade-e-esg/subcategorias/i02_politicas-corporativas-esg.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/I_sustentabilidade-e-esg/subcategorias/i02_politicas-corporativas-esg.svg`,
    canonicalSlug: 'politicas-corporativas-esg',
    aliases: [
      'politicas-esg',
      'corporativo-esg',
      'governanca-esg',
      'relatorios-esg',
    ],
    alt: 'Políticas Corporativas ESG',
    motionPreset: 'neutral',
  },
  I03: {
    id: 'I03',
    name: 'Selos Verdes e Certificações',
    type: 'subcategoria',
    groupCode: 'I',
    parentCode: 'I',
    svgRelativePath: 'I_sustentabilidade-e-esg/subcategorias/i03_selos-verdes-e-certificacoes.svg',
    src: `${CATEGORY_ICON_PUBLIC_BASE}/I_sustentabilidade-e-esg/subcategorias/i03_selos-verdes-e-certificacoes.svg`,
    canonicalSlug: 'selos-verdes-e-certificacoes',
    aliases: [
      'selos-verdes',
      'certificacoes',
      'certificacoes-ambientais',
      'selo-verde',
    ],
    alt: 'Selos Verdes e Certificações',
    motionPreset: 'neutral',
  },
};

/**
 * Tradução semântica de códigos legados da taxonomia anterior.
 *
 * ATENÇÃO: NÃO mapear cegamente A06 antigo para A06 novo!
 * No pacote antigo:
 *  - A06 era Financiamento -> no novo pacote é A07!
 *  - A07 era Instaladores -> no novo pacote é A08!
 *  - A08 era Inversores -> no novo pacote é A09!
 *  - A09 era Monitoramento -> no novo pacote é A10!
 *  - A10 era Painéis -> no novo pacote é A11!
 *  - A11 era Energia Solar principal -> no novo pacote é A!
 *  - B01 era Frotas Corporativas -> no novo pacote é C01!
 *  - B02 era Frotas Logística -> no novo pacote é C02!
 *  - B03 era Mobilidade Urbana -> no novo pacote é C03!
 *  - B04 era Gestão Frotas -> no novo pacote é C04!
 *  - B05 era Recarga Frotas -> no novo pacote é C05!
 *  - C01 era Mercado Livre -> no novo pacote é D01 (ou D)!
 *  - D01 era Carregadores Comerciais -> no novo pacote é B01!
 *  - D02 era Wallbox Residencial -> no novo pacote é B02!
 *  - D03 era Estações Públicas -> no novo pacote é B03!
 *  - D04 era Instaladores EV -> no novo pacote é B04!
 *  - D05 era Integração Solar -> no novo pacote é B05!
 *  - D06 era Veículos Elétricos -> no novo pacote é B06!
 *  - E01 era Hubs Eletromobilidade -> no novo pacote é E01 (ou E)!
 */
export const LEGACY_CODE_TO_NEW_CODE: Record<string, string> = {
  A01: 'A01',
  A02: 'A02',
  A03: 'A03',
  A04: 'A04',
  A05: 'A05',
  A06: 'A07', // Financiamento
  A07: 'A08', // Instaladores
  A08: 'A09', // Inversores
  A09: 'A10', // Monitoramento e O&M
  A10: 'A11', // Painéis
  A11: 'A', // Energia Solar principal
  B01: 'C01', // Frotas corporativas
  B02: 'C02', // Frotas logística
  B03: 'C03', // Mobilidade urbana
  B04: 'C04', // Gestão frotas
  B05: 'C05', // Recarga frotas
  C01: 'D01', // Mercado livre
  D01: 'B01', // Carregadores comerciais
  D02: 'B02', // Wallbox residencial
  D03: 'B03', // Estações públicas
  D04: 'B04', // Instaladores EV
  D05: 'B05', // Integração solar
  D06: 'B06', // Veículos elétricos
  E01: 'E01', // Hubs
};

/**
 * Tradução semântica de strings visuais legadas (ex: visual_key='battery_storage').
 */
export const LEGACY_KEY_TO_NEW_CODE: Record<string, string> = {
  battery_storage: 'A01',
  solar_carport: 'A02',
  commercial_industrial_solar: 'A03',
  residential_solar: 'A04',
  rural_solar: 'A05',
  solar_financing: 'A07',
  solar_installer: 'A08',
  solar_inverter: 'A09',
  monitoring_software: 'A10',
  solar_panel: 'A11',
  corporate_fleet: 'C01',
  logistics_fleet: 'C02',
  urban_mobility: 'C03',
  fleet_management: 'C04',
  fleet_charging: 'C05',
  free_energy_market: 'D01',
  commercial_ev_charger: 'B01',
  home_wallbox: 'B02',
  public_charging_station: 'B03',
  ev_installer: 'B04',
  solar_mobility_integration: 'B05',
  electric_vehicle: 'B06',
  electromobility_hub: 'E01',
};
