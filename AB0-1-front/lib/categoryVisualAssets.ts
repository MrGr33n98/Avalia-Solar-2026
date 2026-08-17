import { normalizeCategoryKey } from './categoryIcons';

export type CategoryVisualKey =
  | 'battery_storage'
  | 'solar_carport'
  | 'commercial_ev_charger'
  | 'home_wallbox'
  | 'solar_financing'
  | 'fleet_electric'
  | 'solar_inverter'
  | 'monitoring_software'
  | 'solar_panel'
  | 'solar_installer'
  | 'electrical_maintenance';

const CATEGORY_VISUAL_ASSETS: Record<CategoryVisualKey, string> = {
  battery_storage: '/assets/categories/3d/bateria.png',
  solar_carport: '/assets/categories/3d/carport.png',
  commercial_ev_charger: '/assets/categories/3d/carregador.png',
  home_wallbox: '/assets/categories/3d/carregador-residencial.png',
  solar_financing: '/assets/categories/3d/financiamento.png',
  fleet_electric: '/assets/categories/3d/frotas-carros-eletricos.png',
  solar_inverter: '/assets/categories/3d/inversor.png',
  monitoring_software: '/assets/categories/3d/monitoramento.png',
  solar_panel: '/assets/categories/3d/placas-solares.png',
  solar_installer: '/assets/categories/3d/projetos-e-servicos.png',
  electrical_maintenance: '/assets/categories/3d/servicos.png',
};

const VISUAL_KEY_BY_CATEGORY: Array<[CategoryVisualKey, string[]]> = [
  ['battery_storage', ['bateria', 'baterias', 'armazenamento']],
  ['solar_carport', ['carport', 'cobertura solar', 'coberturas solares']],
  ['home_wallbox', ['carregador residencial', 'wallbox']],
  ['commercial_ev_charger', ['carregador', 'eletroposto', 'recarga']],
  ['solar_financing', ['financiamento', 'credito solar', 'crédito solar']],
  ['fleet_electric', ['frota', 'frotas', 'mobilidade eletrica', 'mobilidade elétrica']],
  ['solar_inverter', ['inversor', 'inversores']],
  ['monitoring_software', ['monitoramento', 'gestao de recarga', 'gestão de recarga', 'o&m']],
  ['solar_panel', ['painel', 'paineis', 'painéis', 'modulo solar', 'módulo solar', 'fotovolta']],
  ['solar_installer', ['instalação', 'instalacao', 'instalador', 'projeto', 'homologacao', 'homologação']],
  ['electrical_maintenance', ['manutencao', 'manutenção', 'suporte', 'servicos', 'serviços']],
];

export function getCategoryVisualAsset(
  slug?: string | null,
  name?: string | null,
  visualKey?: string | null
) {
  if (visualKey && visualKey in CATEGORY_VISUAL_ASSETS) {
    return CATEGORY_VISUAL_ASSETS[visualKey as CategoryVisualKey];
  }

  const value = `${normalizeCategoryKey(slug)} ${normalizeCategoryKey(name)}`;
  const match = VISUAL_KEY_BY_CATEGORY.find(([, terms]) =>
    terms.some((term) => value.includes(normalizeCategoryKey(term)))
  );

  return match ? CATEGORY_VISUAL_ASSETS[match[0]] : null;
}

export function getCategoryVisualKey(slug?: string | null, name?: string | null): CategoryVisualKey | null {
  const asset = getCategoryVisualAsset(slug, name);
  if (!asset) return null;
  return (Object.keys(CATEGORY_VISUAL_ASSETS) as CategoryVisualKey[]).find(
    (key) => CATEGORY_VISUAL_ASSETS[key] === asset
  ) || null;
}

export { CATEGORY_VISUAL_ASSETS };
