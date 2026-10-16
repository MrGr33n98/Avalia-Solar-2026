import { Platform } from 'react-native';

const WEB_ASSET_ORIGIN = process.env.EXPO_PUBLIC_WEB_URL || 'https://www.avaliasolar.com.br';

export interface DiscoveryCategory {
  id: string;
  name: string;
  slug: string;
  iconUrl?: string | null;
  parentId?: string | null;
}

/**
 * Fallback documental compartilhado com o manifesto canônico do PWA.
 * A API GraphQL continua sendo a fonte preferencial em tempo de execução.
 */
export const OFFICIAL_MAIN_CATEGORIES: DiscoveryCategory[] = [
  { id: 'A', name: 'Energia Solar', slug: 'energia-solar' },
  { id: 'B', name: 'Mobilidade Elétrica', slug: 'mobilidade-eletrica' },
  { id: 'C', name: 'Frotas Elétricas', slug: 'frotas-eletricas' },
  { id: 'D', name: 'Mercado Livre de Energia', slug: 'mercado-livre-de-energia' },
  {
    id: 'E',
    name: 'Hubs de Eletromobilidade e Recarga',
    slug: 'hubs-de-eletromobilidade-e-recarga',
  },
  { id: 'F', name: 'Apps, Software e Plataformas', slug: 'apps-software-e-plataformas' },
  { id: 'G', name: 'Casa Sustentável e Off-Grid', slug: 'casa-sustentavel-e-off-grid' },
  {
    id: 'H',
    name: 'Mercado, Legislação e Finanças',
    slug: 'mercado-legislacao-e-financas',
  },
  { id: 'I', name: 'Sustentabilidade e ESG', slug: 'sustentabilidade-e-esg' },
];

export const OFFICIAL_SOLUTION_TYPES: DiscoveryCategory[] = [
  { id: 'A11', name: 'Painéis Solares', slug: 'paineis-solares', parentId: 'A' },
  { id: 'A09', name: 'Inversores', slug: 'inversores', parentId: 'A' },
  {
    id: 'B02',
    name: 'Carregadores Residenciais / Wallbox',
    slug: 'carregadores-residenciais-wallbox',
    parentId: 'B',
  },
  { id: 'A06', name: 'Estruturas e Fixação', slug: 'estruturas-e-fixacao', parentId: 'A' },
  {
    id: 'A01',
    name: 'Baterias e Armazenamento de Energia',
    slug: 'baterias-e-armazenamento-de-energia',
    parentId: 'A',
  },
  { id: 'A10', name: 'Monitoramento e O&M', slug: 'monitoramento-e-o-m', parentId: 'A' },
  {
    id: 'G01',
    name: 'Kits Solares para Autossuficiência',
    slug: 'kits-solares-para-autossuficiencia',
    parentId: 'G',
  },
  {
    id: 'A08',
    name: 'Instaladores de Energia Solar',
    slug: 'instaladores-de-energia-solar',
    parentId: 'A',
  },
];

const ASSET_BY_KEY = {
  residential_solar: 'residencial.png',
  commercial_industrial_solar: 'comericla-e-industrial.png',
  rural_solar: 'rural.png',
  free_energy_market: 'mercado-livre-de-energia.png',
  battery_storage: 'bateria.png',
  solar_carport: 'carport.png',
  commercial_ev_charger: 'carregador.png',
  home_wallbox: 'carregador-residencial.png',
  solar_financing: 'financiamento.png',
  fleet_electric: 'frotas-carros-eletricos.png',
  solar_inverter: 'inversor.png',
  monitoring_software: 'monitoramento.png',
  solar_panel: 'placas-solares.png',
  solar_installer: 'projetos-e-servicos.png',
  electrical_maintenance: 'servicos.png',
} as const;

const TERMS: Array<[keyof typeof ASSET_BY_KEY, string[]]> = [
  ['commercial_industrial_solar', [
    'comercial e industrial',
    'comercial industrial',
    'comercial',
    'industrial',
  ]],
  ['rural_solar', ['rural', 'agronegocio', 'agropecuaria', 'agricola']],
  ['residential_solar', ['residencial', 'condominio', 'casa']],
  ['free_energy_market', ['mercado livre de energia', 'mercado-livre-de-energia', 'mercado livre']],
  ['battery_storage', ['bateria', 'armazenamento']],
  ['solar_carport', ['carport', 'cobertura']],
  ['home_wallbox', ['wallbox', 'carregador residencial']],
  ['commercial_ev_charger', ['carregador', 'eletroposto', 'recarga']],
  ['solar_financing', ['financiamento', 'crédito', 'credito']],
  ['fleet_electric', ['frota', 'mobilidade', 'veículo', 'veiculo']],
  ['solar_inverter', ['inversor']],
  ['monitoring_software', ['monitoramento', 'gestão', 'gestao', 'o&m']],
  ['solar_panel', ['painel', 'placa', 'módulo', 'modulo', 'fotovolta']],
  ['solar_installer', ['instalação', 'instalacao', 'instalador', 'projeto']],
  ['electrical_maintenance', ['manutenção', 'manutencao', 'serviço', 'servico', 'suporte']],
];

function normalize(value?: string | null) {
  return (value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function getCategoryVisualAssetUri(slug?: string | null, name?: string | null) {
  const value = normalize(`${slug || ''} ${name || ''}`);
  const match = TERMS.find(([, terms]) => terms.some((term) => value.includes(normalize(term))));
  if (!match) return null;

  const path = `/assets/categories/3d/${ASSET_BY_KEY[match[0]]}`;
  return Platform.OS === 'web' ? path : `${WEB_ASSET_ORIGIN}${path}`;
}
