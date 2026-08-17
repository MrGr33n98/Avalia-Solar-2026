import { Platform } from 'react-native';

const WEB_ASSET_ORIGIN = process.env.EXPO_PUBLIC_WEB_URL || 'https://www.avaliasolar.com.br';

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