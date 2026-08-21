// P0 PERF FIX: Migrado de /icones/new-icons (2.2–2.4 MB por arquivo) para
// /icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes (44–72 KB por arquivo).
// Redução de ~97% por ícone. Os ícones 3D são 512×512 PNG transparentes de alta qualidade.
export const CATEGORY_ICON_BASE_PATH =
  '/icones/avalia_solar_23_icones_3d_perfeitos_512_transparentes';

// Mapeamento slug → arquivo 3D correto
export const CATEGORY_ICON_MAP: Record<string, string> = {
  'energia-solar': `${CATEGORY_ICON_BASE_PATH}/A10_paineis_solares.png`,
  'energia-solar-fotovoltaica': `${CATEGORY_ICON_BASE_PATH}/A10_paineis_solares.png`,

  'energia-solar-residencial': `${CATEGORY_ICON_BASE_PATH}/A04_solar_residencial.png`,
  residencial: `${CATEGORY_ICON_BASE_PATH}/A04_solar_residencial.png`,

  'energia-solar-comercial-industrial': `${CATEGORY_ICON_BASE_PATH}/A03_solar_comercial_industrial.png`,
  'comercial-industrial': `${CATEGORY_ICON_BASE_PATH}/A03_solar_comercial_industrial.png`,
  industrial: `${CATEGORY_ICON_BASE_PATH}/A03_solar_comercial_industrial.png`,

  'mercado-livre-de-energia': `${CATEGORY_ICON_BASE_PATH}/C01_mercado_livre_energia.png`,
  'mercado-livre': `${CATEGORY_ICON_BASE_PATH}/C01_mercado_livre_energia.png`,

  'energia-solar-rural-agronegocio': `${CATEGORY_ICON_BASE_PATH}/A05_solar_rural.png`,
  'energia-solar-rural': `${CATEGORY_ICON_BASE_PATH}/A05_solar_rural.png`,
  'rural-agronegocio': `${CATEGORY_ICON_BASE_PATH}/A05_solar_rural.png`,
  rural: `${CATEGORY_ICON_BASE_PATH}/A05_solar_rural.png`,
  agronegocio: `${CATEGORY_ICON_BASE_PATH}/A05_solar_rural.png`,

  'baterias-armazenamento-energia': `${CATEGORY_ICON_BASE_PATH}/A01_baterias_armazenamento.png`,
  'armazenamento-energia': `${CATEGORY_ICON_BASE_PATH}/A01_baterias_armazenamento.png`,
  'baterias-armazenamento': `${CATEGORY_ICON_BASE_PATH}/A01_baterias_armazenamento.png`,
  baterias: `${CATEGORY_ICON_BASE_PATH}/A01_baterias_armazenamento.png`,
  armazenamento: `${CATEGORY_ICON_BASE_PATH}/A01_baterias_armazenamento.png`,

  'carport-solar-coberturas-solares': `${CATEGORY_ICON_BASE_PATH}/A02_carport_solar.png`,
  'carport-coberturas': `${CATEGORY_ICON_BASE_PATH}/A02_carport_solar.png`,
  'carport-solar': `${CATEGORY_ICON_BASE_PATH}/A02_carport_solar.png`,
  carport: `${CATEGORY_ICON_BASE_PATH}/A02_carport_solar.png`,
  coberturas: `${CATEGORY_ICON_BASE_PATH}/A02_carport_solar.png`,

  'paineis-solares': `${CATEGORY_ICON_BASE_PATH}/A10_paineis_solares.png`,
  painel: `${CATEGORY_ICON_BASE_PATH}/A10_paineis_solares.png`,
  paineis: `${CATEGORY_ICON_BASE_PATH}/A10_paineis_solares.png`,

  inversores: `${CATEGORY_ICON_BASE_PATH}/A08_inversores.png`,
  'inversores-solares': `${CATEGORY_ICON_BASE_PATH}/A08_inversores.png`,
  inversor: `${CATEGORY_ICON_BASE_PATH}/A08_inversores.png`,

  'monitoramento-om': `${CATEGORY_ICON_BASE_PATH}/A09_monitoramento_om.png`,
  'monitoramento-operacao-manutencao': `${CATEGORY_ICON_BASE_PATH}/A09_monitoramento_om.png`,
  monitoramento: `${CATEGORY_ICON_BASE_PATH}/A09_monitoramento_om.png`,

  'financiamento-energia-solar': `${CATEGORY_ICON_BASE_PATH}/A06_financiamento.png`,
  financiamento: `${CATEGORY_ICON_BASE_PATH}/A06_financiamento.png`,

  'instaladores-energia-solar': `${CATEGORY_ICON_BASE_PATH}/A07_instaladores_solar.png`,
  instaladores: `${CATEGORY_ICON_BASE_PATH}/A07_instaladores_solar.png`,
  instalador: `${CATEGORY_ICON_BASE_PATH}/A07_instaladores_solar.png`,

  // Mobilidade elétrica
  'frotas-corporativas': `${CATEGORY_ICON_BASE_PATH}/B01_frotas_corporativas.png`,
  'frotas-logistica': `${CATEGORY_ICON_BASE_PATH}/B02_frotas_logistica.png`,
  'mobilidade-urbana': `${CATEGORY_ICON_BASE_PATH}/B03_mobilidade_urbana.png`,
  'gestao-de-frotas': `${CATEGORY_ICON_BASE_PATH}/B04_gestao_frotas.png`,
  'recarga-frotas': `${CATEGORY_ICON_BASE_PATH}/B05_recarga_frotas.png`,

  // Carregadores
  'carregadores-comerciais': `${CATEGORY_ICON_BASE_PATH}/D01_carregadores_comerciais.png`,
  'wallbox-residencial': `${CATEGORY_ICON_BASE_PATH}/D02_wallbox_residencial.png`,
  'carregadores-residenciais-wallbox': `${CATEGORY_ICON_BASE_PATH}/D02_wallbox_residencial.png`,
  'estacoes-publicas': `${CATEGORY_ICON_BASE_PATH}/D03_estacoes_publicas.png`,
  'instaladores-ev': `${CATEGORY_ICON_BASE_PATH}/D04_instaladores_ev.png`,
  'instaladores-de-ev': `${CATEGORY_ICON_BASE_PATH}/D04_instaladores_ev.png`,
  'integracao-solar-mobilidade': `${CATEGORY_ICON_BASE_PATH}/D05_integracao_solar_mobilidade.png`,
  'veiculos-eletricos': `${CATEGORY_ICON_BASE_PATH}/D06_veiculos_eletricos.png`,
  'gestao-de-frotas-eletricas': `${CATEGORY_ICON_BASE_PATH}/B04_gestao_frotas.png`,

  // Hubs
  'hubs-eletromobilidade': `${CATEGORY_ICON_BASE_PATH}/E01_hubs_eletromobilidade.png`,
};

export function normalizeCategoryKey(value?: string | null) {
  return (value || '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getCategoryIcon(slug?: string | null, name?: string | null) {
  const candidates = [
    normalizeCategoryKey(slug),
    normalizeCategoryKey(name),
    normalizeCategoryKey((name || '').replace(/^energia solar\s+/i, '')),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (CATEGORY_ICON_MAP[candidate]) return CATEGORY_ICON_MAP[candidate];
  }

  const searchable = candidates.join(' ');
  const fuzzyMatch = Object.entries(CATEGORY_ICON_MAP).find(([key]) => searchable.includes(key));
  return fuzzyMatch?.[1] || null;
}

export function getPreferredCategoryIcon(
  slug?: string | null,
  iconUrl?: string | null,
  name?: string | null
) {
  return iconUrl || getCategoryIcon(slug, name);
}
