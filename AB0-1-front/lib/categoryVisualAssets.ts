import { normalizeCategoryKey } from './categoryIcons';

export type CategoryVisualKey =
  | 'battery_storage'
  | 'solar_carport'
  | 'commercial_industrial_solar'
  | 'residential_solar'
  | 'rural_solar'
  | 'solar_financing'
  | 'solar_installer'
  | 'solar_inverter'
  | 'monitoring_software'
  | 'solar_panel'
  | 'corporate_fleet'
  | 'logistics_fleet'
  | 'urban_mobility'
  | 'fleet_management'
  | 'fleet_charging'
  | 'free_energy_market'
  | 'commercial_ev_charger'
  | 'home_wallbox'
  | 'public_charging_station'
  | 'ev_installer'
  | 'solar_mobility_integration'
  | 'electric_vehicle'
  | 'electromobility_hub';

const BASE_PATH = '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes';

const CATEGORY_VISUAL_ASSETS: Record<CategoryVisualKey, string> = {
  battery_storage: `${BASE_PATH}/A01_baterias_armazenamento.png`,
  solar_carport: `${BASE_PATH}/A02_carport_solar.png`,
  commercial_industrial_solar: `${BASE_PATH}/A03_solar_comercial_industrial.png`,
  residential_solar: `${BASE_PATH}/A04_solar_residencial.png`,
  rural_solar: `${BASE_PATH}/A05_solar_rural.png`,
  solar_financing: `${BASE_PATH}/A06_financiamento.png`,
  solar_installer: `${BASE_PATH}/A07_instaladores_solar.png`,
  solar_inverter: `${BASE_PATH}/A08_inversores.png`,
  monitoring_software: `${BASE_PATH}/A09_monitoramento_om.png`,
  solar_panel: `${BASE_PATH}/A10_paineis_solares.png`,
  corporate_fleet: `${BASE_PATH}/B01_frotas_corporativas.png`,
  logistics_fleet: `${BASE_PATH}/B02_frotas_logistica.png`,
  urban_mobility: `${BASE_PATH}/B03_mobilidade_urbana.png`,
  fleet_management: `${BASE_PATH}/B04_gestao_frotas.png`,
  fleet_charging: `${BASE_PATH}/B05_recarga_frotas.png`,
  free_energy_market: `${BASE_PATH}/C01_mercado_livre_energia.png`,
  commercial_ev_charger: `${BASE_PATH}/D01_carregadores_comerciais.png`,
  home_wallbox: `${BASE_PATH}/D02_wallbox_residencial.png`,
  public_charging_station: `${BASE_PATH}/D03_estacoes_publicas.png`,
  ev_installer: `${BASE_PATH}/D04_instaladores_ev.png`,
  solar_mobility_integration: `${BASE_PATH}/D05_integracao_solar_mobilidade.png`,
  electric_vehicle: `${BASE_PATH}/D06_veiculos_eletricos.png`,
  electromobility_hub: `${BASE_PATH}/E01_hubs_eletromobilidade.png`,
};

const VISUAL_KEY_BY_CATEGORY: Array<[CategoryVisualKey, string[]]> = [
  [
    'battery_storage',
    ['bateria', 'baterias', 'armazenamento-energia', 'baterias-armazenamento', 'battery_storage'],
  ],
  [
    'solar_carport',
    ['carport', 'carport-solar', 'cobertura solar', 'coberturas solares', 'solar_carport'],
  ],
  [
    'commercial_industrial_solar',
    ['comercial e industrial', 'comercial industrial', 'industrial', 'commercial_industrial_solar'],
  ],
  ['residential_solar', ['residencial', 'condominio', 'casa', 'residential_solar']],
  [
    'rural_solar',
    ['rural', 'agronegocio', 'agronegócio', 'agropecuaria', 'agrícola', 'agricola', 'rural_solar'],
  ],
  ['solar_financing', ['financiamento', 'credito solar', 'crédito solar', 'solar_financing']],
  [
    'solar_installer',
    ['instaladores', 'instalador', 'instalacao', 'instalação', 'solar_installer'],
  ],
  ['solar_inverter', ['inversor', 'inversores', 'solar_inverter']],
  ['monitoring_software', ['monitoramento', 'o&m', 'operacao-manutencao', 'monitoring_software']],
  ['solar_panel', ['painel', 'paineis', 'painéis', 'placas solares', 'fotovolta', 'solar_panel']],
  [
    'corporate_fleet',
    [
      'frotas corporativas',
      'frotas-corporativas',
      'frotas-eletricas-empresas',
      'frota corporativa',
    ],
  ],
  [
    'logistics_fleet',
    ['frotas logistica', 'frotas-logistica', 'frotas-eletricas-logistica', 'frota de logistica'],
  ],
  ['urban_mobility', ['mobilidade urbana', 'mobilidade-urbana']],
  ['fleet_management', ['gestao frotas', 'gestao-frotas', 'gestão de frotas']],
  ['fleet_charging', ['recarga frotas', 'recarga-frotas', 'recarga de frotas']],
  [
    'free_energy_market',
    ['mercado livre', 'mercado-livre', 'mercado livre de energia', 'free_energy_market'],
  ],
  [
    'commercial_ev_charger',
    [
      'carregadores comerciais',
      'carregadores-comerciais',
      'recarga comercial',
      'commercial_ev_charger',
    ],
  ],
  [
    'home_wallbox',
    [
      'wallbox',
      'carregador residencial',
      'carregador-residencial',
      'carregadores residenciais',
      'home_wallbox',
    ],
  ],
  [
    'public_charging_station',
    [
      'estacoes publicas',
      'estacoes-publicas',
      'estações públicas',
      'eletropostos',
      'public_charging_station',
    ],
  ],
  [
    'ev_installer',
    ['instaladores ev', 'instaladores-ev', 'instaladores de carregadores', 'ev_installer'],
  ],
  [
    'solar_mobility_integration',
    [
      'integracao solar',
      'integracao-solar',
      'integração solar',
      'solar + mobilidade',
      'solar_mobility_integration',
    ],
  ],
  [
    'electric_vehicle',
    [
      'veiculos eletricos',
      'veiculos-eletricos',
      'veículos elétricos',
      'carros eletricos',
      'electric_vehicle',
    ],
  ],
  [
    'electromobility_hub',
    ['hubs', 'hubs-eletromobilidade', 'hub eletromobilidade', 'electromobility_hub'],
  ],
];

export function getCategoryVisualAsset(
  slug?: string | null,
  name?: string | null,
  visualKey?: string | null
) {
  if (visualKey && visualKey in CATEGORY_VISUAL_ASSETS) {
    return CATEGORY_VISUAL_ASSETS[visualKey as CategoryVisualKey];
  }

  const candidates = [slug, name, visualKey].map(normalizeCategoryKey).filter(Boolean);
  const exactMatch = VISUAL_KEY_BY_CATEGORY.find(([, terms]) =>
    terms.some((term) => candidates.includes(normalizeCategoryKey(term)))
  );

  if (exactMatch) return CATEGORY_VISUAL_ASSETS[exactMatch[0]];

  const searchable = candidates.join(' ');
  const fuzzyMatches = VISUAL_KEY_BY_CATEGORY.flatMap(([key, terms]) =>
    terms.map((term) => ({ key, term: normalizeCategoryKey(term) }))
  ).sort((a, b) => b.term.length - a.term.length);
  const fuzzyMatch = fuzzyMatches.find(({ term }) => searchable.includes(term));

  return fuzzyMatch ? CATEGORY_VISUAL_ASSETS[fuzzyMatch.key] : null;
}

export function getCategoryVisualKey(
  slug?: string | null,
  name?: string | null
): CategoryVisualKey | null {
  const asset = getCategoryVisualAsset(slug, name);
  if (!asset) return null;
  return (
    (Object.keys(CATEGORY_VISUAL_ASSETS) as CategoryVisualKey[]).find(
      (key) => CATEGORY_VISUAL_ASSETS[key] === asset
    ) || null
  );
}

export { CATEGORY_VISUAL_ASSETS };
