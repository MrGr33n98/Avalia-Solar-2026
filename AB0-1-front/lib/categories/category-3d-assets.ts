/**
 * Avalia Solar — Catálogo e Resolvedor Canônico de Ícones 3D Refinados (39 Ativos)
 *
 * Mapeamento estrito e determinístico (SEM fuzzy/substring genérico) para as 39 categorias
 * e subcategorias cobertas pelo pacote 3D Refinado em `/3d-refined/`.
 *
 * Cada ativo possui:
 * - PNG 1024x1024 px com canal alfa (fallback / alta definição)
 * - WebP 512x512 px com canal alfa (padrão para cards, heros e destaques)
 * - WebP 256x256 px com canal alfa (otimizado para menus, drawer, chips e filtros)
 *
 * Para as 6 categorias-mãe sem render 3D próprio (Mobilidade Elétrica, Frotas Elétricas,
 * Apps/Software, Casa Sustentável, Mercado/Legislação e Sustentabilidade/ESG), o sistema
 * preserva deterministicamente o catálogo canônico de SVGs monocromáticos pretos.
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
  | 'A12'
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
  | 'E01'
  | 'F01'
  | 'F02'
  | 'F03'
  | 'F04'
  | 'G01'
  | 'G02'
  | 'G03'
  | 'H01'
  | 'H02'
  | 'H03'
  | 'H04'
  | 'I01'
  | 'I02'
  | 'I03';

export type Category3DSizeVariant = '256' | '512' | '1024';

export const ASSET_3D_BASE = '/3d-refined';

export const CATEGORY_3D_FILE_BASES: Record<Category3DCode, string> = {
  A01: 'A01_baterias-e-armazenamento-de-energia',
  A02: 'A02_carport-solar-e-coberturas-solares',
  A03: 'A03_energia-solar-comercial-e-industrial',
  A04: 'A04_energia-solar-residencial',
  A05: 'A05_energia-solar-rural-e-agronegocio',
  A06: 'A06_financiamento-de-energia-solar',
  A07: 'A07_instaladores-de-energia-solar',
  A08: 'A08_inversores',
  A09: 'A09_monitoramento-e-o-e-m',
  A10: 'A10_paineis-solares',
  A11: 'A11_energia-solar',
  A12: 'A12_estruturas-e-fixacao',
  B01: 'B01_frotas-eletricas-corporativas',
  B02: 'B02_frotas-eletricas-para-logistica-e-entregas',
  B03: 'B03_frotas-eletricas-para-mobilidade-urbana',
  B04: 'B04_gestao-de-frotas-eletricas',
  B05: 'B05_infraestrutura-de-recarga-para-frotas',
  C01: 'C01_mercado-livre-de-energia',
  D01: 'D01_carregadores-comerciais-e-condominios',
  D02: 'D02_carregadores-residenciais-wallbox',
  D03: 'D03_estacoes-publicas-e-postos-rapidos',
  D04: 'D04_instaladores-de-carregadores-ev',
  D05: 'D05_integracao-solar-e-mobilidade-eletrica',
  D06: 'D06_veiculos-eletricos',
  E01: 'E01_hubs-de-eletromobilidade-e-recarga',
  F01: 'F01_gestao-de-recarga-ve',
  F02: 'F02_integracao-smart-grid',
  F03: 'F03_monitoramento-de-energia-solar',
  F04: 'F04_simulacao-e-projeto-solar',
  G01: 'G01_kits-solares-para-autossuficiencia',
  G02: 'G02_reuso-de-agua-e-energias-complementares',
  G03: 'G03_solucoes-para-areas-remotas',
  H01: 'H01_legislacao-e-normas-setoriais',
  H02: 'H02_linhas-de-credito-verde',
  H03: 'H03_seguradoras-para-solar-e-ve',
  H04: 'H04_tendencias-de-mercado',
  I01: 'I01_carbono-neutro-e-compensacao',
  I02: 'I02_politicas-corporativas-esg',
  I03: 'I03_selos-verdes-e-certificacoes',
};

export const CATEGORY_3D_ASSETS_512: Record<Category3DCode, string> = Object.fromEntries(
  Object.entries(CATEGORY_3D_FILE_BASES).map(([code, base]) => [
    code,
    `${ASSET_3D_BASE}/${base}-512.webp`,
  ])
) as Record<Category3DCode, string>;

export const CATEGORY_3D_ASSETS_256: Record<Category3DCode, string> = Object.fromEntries(
  Object.entries(CATEGORY_3D_FILE_BASES).map(([code, base]) => [
    code,
    `${ASSET_3D_BASE}/${base}-256.webp`,
  ])
) as Record<Category3DCode, string>;

export const CATEGORY_3D_ASSETS_1024: Record<Category3DCode, string> = Object.fromEntries(
  Object.entries(CATEGORY_3D_FILE_BASES).map(([code, base]) => [
    code,
    `${ASSET_3D_BASE}/${base}.png`,
  ])
) as Record<Category3DCode, string>;

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
  A12: 'Estruturas e Fixação',
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
  F01: 'Gestão de Recarga VE',
  F02: 'Integração Smart Grid',
  F03: 'Monitoramento de Energia Solar',
  F04: 'Simulação e Projeto Solar',
  G01: 'Kits Solares para Autossuficiência',
  G02: 'Reuso de Água e Energias Complementares',
  G03: 'Soluções para Áreas Remotas',
  H01: 'Legislação e Normas Setoriais',
  H02: 'Linhas de Crédito Verde',
  H03: 'Seguradoras para Solar e VE',
  H04: 'Tendências de Mercado',
  I01: 'Carbono Neutro e Compensação',
  I02: 'Políticas Corporativas ESG',
  I03: 'Selos Verdes e Certificações',
};

/**
 * Tabela canônica de correspondência estrita (slugs, nomes e chaves semânticas).
 * Mapeia deterministicamente para os 39 ativos 3D.
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

  // A12 — Estruturas e Fixação
  'estruturas-fixacao': 'A12',
  'estruturas-e-fixacao': 'A12',
  'estrutura-fixacao': 'A12',
  'estruturas-de-fixacao': 'A12',
  'estruturas-de-montagem': 'A12',
  estruturas: 'A12',
  solar_structure: 'A12',

  // B01 — Frotas Elétricas Corporativas (e Grupo Frotas Elétricas)
  'frotas-eletricas': 'B01',
  'frotas-eletricas-e-pesados': 'B01',
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

  // D06 — Veículos Elétricos (e Grupo Mobilidade Elétrica)
  'mobilidade-eletrica': 'D06',
  'mobilidade-eletrica-e-veiculos': 'D06',
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

  // F01 — Gestão de Recarga VE
  'gestao-recarga-ev': 'F01',
  'gestao-de-recarga-ve': 'F01',
  'gestao-recarga-ve': 'F01',
  'gestao-de-recarga-ev': 'F01',
  'software-recarga-ve': 'F01',
  'app-recarga-ve': 'F01',

  // F02 — Integração Smart Grid
  'smart-grid': 'F02',
  'integracao-smart-grid': 'F02',
  'smart-grids': 'F02',
  'redes-inteligentes': 'F02',
  'integracao-grid': 'F02',

  // F03 — Monitoramento de Energia Solar (e Grupo Apps, Software e Plataformas)
  'apps-software-e-plataformas': 'F03',
  'apps-software-plataformas': 'F03',
  'software-e-plataformas': 'F03',
  'monitoramento-apps': 'F03',
  'monitoramento-de-energia-solar': 'F03',
  'software-monitoramento-solar': 'F03',
  'monitoramento-solar-software': 'F03',
  'app-monitoramento-solar': 'F03',
  'plataforma-monitoramento-solar': 'F03',

  // F04 — Simulação e Projeto Solar
  'simulacao-projeto': 'F04',
  'simulacao-e-projeto-solar': 'F04',
  'simulacao-projeto-solar': 'F04',
  'software-projeto-solar': 'F04',
  'simulacao-solar': 'F04',
  'projetistas-e-engenharia': 'F04',

  // G01 — Kits Solares para Autossuficiência (e Grupo Casa Sustentável e Off-Grid)
  'casa-sustentavel-e-off-grid': 'G01',
  'casa-sustentavel-off-grid': 'G01',
  'casa-sustentavel': 'G01',
  'kits-offgrid': 'G01',
  'kits-solares-para-autossuficiencia': 'G01',
  'kits-solares': 'G01',
  'kit-solar': 'G01',
  'kit-off-grid': 'G01',
  autossuficiencia: 'G01',
  'geradores-solares': 'G01',

  // G02 — Reuso de Água e Energias Complementares
  'reuso-agua': 'G02',
  'reuso-de-agua-e-energias-complementares': 'G02',
  'reuso-de-agua': 'G02',
  'energias-complementares': 'G02',
  'bombas-solares': 'G02',
  'aquecimento-solar': 'G02',

  // G03 — Soluções para Áreas Remotas
  'solucoes-remotas': 'G03',
  'solucoes-para-areas-remotas': 'G03',
  'areas-remotas': 'G03',
  'comunidades-isoladas': 'G03',
  'eletrificacao-rural': 'G03',

  // H01 — Legislação e Normas Setoriais (e Grupo Mercado, Legislação e Finanças)
  'mercado-legislacao-e-financas': 'H01',
  'mercado-legislacao-financas': 'H01',
  'legislacao-e-financas': 'H01',
  'legislacao-normas': 'H01',
  'legislacao-e-normas-setoriais': 'H01',
  'legislacao-e-normas': 'H01',
  'normas-setoriais': 'H01',
  'regulamentacao-solar': 'H01',
  'consultoria-e-homologacao': 'H01',

  // H02 — Linhas de Crédito Verde
  'credito-verde': 'H02',
  'linhas-de-credito-verde': 'H02',
  'financiamento-verde': 'H02',
  'financiamento-esg': 'H02',
  'fundos-climaticos': 'H02',

  // H03 — Seguradoras para Solar e VE
  seguradoras: 'H03',
  'seguradoras-para-solar-e-ve': 'H03',
  'seguros-solar': 'H03',
  'seguros-para-ve': 'H03',
  seguros: 'H03',
  'seguradoras-solar': 'H03',

  // H04 — Tendências de Mercado
  'tendencias-mercado': 'H04',
  'tendencias-de-mercado': 'H04',
  tendencias: 'H04',
  'analise-de-mercado': 'H04',
  'estudos-setoriais': 'H04',

  // I01 — Carbono Neutro e Compensação (e Grupo Sustentabilidade e ESG)
  'sustentabilidade-e-esg': 'I01',
  'sustentabilidade-esg': 'I01',
  sustentabilidade: 'I01',
  'carbono-neutro': 'I01',
  'carbono-neutro-e-compensacao': 'I01',
  'compensacao-de-carbono': 'I01',
  'creditos-de-carbono': 'I01',
  descarbonizacao: 'I01',

  // I02 — Políticas Corporativas ESG
  'esg-corporativo': 'I02',
  'politicas-corporativas-esg': 'I02',
  'politicas-esg': 'I02',
  'corporativo-esg': 'I02',
  'governanca-esg': 'I02',
  'relatorios-esg': 'I02',

  // I03 — Selos Verdes e Certificações
  'selos-verdes': 'I03',
  'selos-verdes-e-certificacoes': 'I03',
  certificacoes: 'I03',
  'certificacoes-ambientais': 'I03',
  'selo-verde': 'I03',
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
 * Retorna null se a categoria não fizer parte do pacote dos 39 ícones.
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
