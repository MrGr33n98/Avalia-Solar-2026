export const CATEGORY_ICON_BASE_PATH = '/icones/new-icons';

export const CATEGORY_ICON_MAP: Record<string, string> = {
  'energia-solar': `${CATEGORY_ICON_BASE_PATH}/avalia-solar-paineis-solares.png`,
  'energia-solar-fotovoltaica': `${CATEGORY_ICON_BASE_PATH}/avalia-solar-paineis-solares.png`,

  'energia-solar-residencial': `${CATEGORY_ICON_BASE_PATH}/avalia-solar-residencial.png`,
  residencial: `${CATEGORY_ICON_BASE_PATH}/avalia-solar-residencial.png`,

  'energia-solar-comercial-industrial': `${CATEGORY_ICON_BASE_PATH}/avalia-solar-comercial-industrial.png`,
  'comercial-industrial': `${CATEGORY_ICON_BASE_PATH}/avalia-solar-comercial-industrial.png`,
  industrial: `${CATEGORY_ICON_BASE_PATH}/avalia-solar-comercial-industrial.png`,

  'energia-solar-rural-agronegocio': `${CATEGORY_ICON_BASE_PATH}/avalia-solar-rural-agronegocio.png`,
  'energia-solar-rural': `${CATEGORY_ICON_BASE_PATH}/avalia-solar-rural-agronegocio.png`,
  'rural-agronegocio': `${CATEGORY_ICON_BASE_PATH}/avalia-solar-rural-agronegocio.png`,
  rural: `${CATEGORY_ICON_BASE_PATH}/avalia-solar-rural-agronegocio.png`,
  agronegocio: `${CATEGORY_ICON_BASE_PATH}/avalia-solar-rural-agronegocio.png`,

  'baterias-armazenamento-energia': `${CATEGORY_ICON_BASE_PATH}/avalia-solar-baterias-armazenamento.png`,
  'armazenamento-energia': `${CATEGORY_ICON_BASE_PATH}/avalia-solar-baterias-armazenamento.png`,
  'baterias-armazenamento': `${CATEGORY_ICON_BASE_PATH}/avalia-solar-baterias-armazenamento.png`,
  baterias: `${CATEGORY_ICON_BASE_PATH}/avalia-solar-baterias-armazenamento.png`,
  armazenamento: `${CATEGORY_ICON_BASE_PATH}/avalia-solar-baterias-armazenamento.png`,

  'carport-solar-coberturas-solares': `${CATEGORY_ICON_BASE_PATH}/avalia-solar-carport-coberturas.png`,
  'carport-coberturas': `${CATEGORY_ICON_BASE_PATH}/avalia-solar-carport-coberturas.png`,
  'carport-solar': `${CATEGORY_ICON_BASE_PATH}/avalia-solar-carport-coberturas.png`,
  carport: `${CATEGORY_ICON_BASE_PATH}/avalia-solar-carport-coberturas.png`,
  coberturas: `${CATEGORY_ICON_BASE_PATH}/avalia-solar-carport-coberturas.png`,

  'paineis-solares': `${CATEGORY_ICON_BASE_PATH}/avalia-solar-paineis-solares.png`,
  painel: `${CATEGORY_ICON_BASE_PATH}/avalia-solar-paineis-solares.png`,
  paineis: `${CATEGORY_ICON_BASE_PATH}/avalia-solar-paineis-solares.png`,

  inversores: `${CATEGORY_ICON_BASE_PATH}/avalia-solar-inversores.png`,
  'inversores-solares': `${CATEGORY_ICON_BASE_PATH}/avalia-solar-inversores.png`,
  inversor: `${CATEGORY_ICON_BASE_PATH}/avalia-solar-inversores.png`,

  'monitoramento-om': `${CATEGORY_ICON_BASE_PATH}/avalia-solar-monitoramento-om.png`,
  'monitoramento-operacao-manutencao': `${CATEGORY_ICON_BASE_PATH}/avalia-solar-monitoramento-om.png`,
  monitoramento: `${CATEGORY_ICON_BASE_PATH}/avalia-solar-monitoramento-om.png`,

  'financiamento-energia-solar': `${CATEGORY_ICON_BASE_PATH}/avalia-solar-financiamento.png`,
  financiamento: `${CATEGORY_ICON_BASE_PATH}/avalia-solar-financiamento.png`,

  'instaladores-energia-solar': `${CATEGORY_ICON_BASE_PATH}/avalia-solar-instaladores.png`,
  instaladores: `${CATEGORY_ICON_BASE_PATH}/avalia-solar-instaladores.png`,
  instalador: `${CATEGORY_ICON_BASE_PATH}/avalia-solar-instaladores.png`,
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
