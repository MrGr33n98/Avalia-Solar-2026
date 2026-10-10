/**
 * Adaptador de compatibilidade para category-visual-registry.
 * Delega para o resolver canônico resolveCategoryIcon, garantindo
 * que nenhum consumidor acesse mais os arquivos PNG 3D antigos.
 */

import {
  CATEGORY_ICON_MANIFEST,
  CategoryMotionPreset,
} from './category-icon-manifest';
import { resolveCategoryIcon } from './resolve-category-icon';

export type { CategoryMotionPreset };

export interface CategoryVisualDefinition {
  code: string;
  src: string;
  alt: string;
  motionPreset: CategoryMotionPreset;
}

/**
 * Registro de compatibilidade apontando exclusivamente para os novos SVGs canônicos.
 */
export const CATEGORY_VISUAL_REGISTRY: Record<string, CategoryVisualDefinition> =
  Object.fromEntries(
    Object.entries(CATEGORY_ICON_MANIFEST).map(([key, item]) => [
      key,
      {
        code: item.id,
        src: item.src,
        alt: item.alt,
        motionPreset: item.motionPreset,
      },
    ])
  );

/**
 * Mapeamento legado de slugs para códigos do catálogo canônico.
 */
export const CATEGORY_SLUG_TO_VISUAL_CODE: Record<string, string> = {
  // Grupo A
  'energia-solar': 'A',
  'energia-solar-fotovoltaica': 'A',
  'baterias-armazenamento-energia': 'A01',
  'armazenamento-energia': 'A01',
  'baterias-armazenamento': 'A01',
  baterias: 'A01',
  armazenamento: 'A01',
  battery_storage: 'A01',
  'carport-solar-coberturas-solares': 'A02',
  'carport-coberturas': 'A02',
  'carport-solar': 'A02',
  carport: 'A02',
  coberturas: 'A02',
  solar_carport: 'A02',
  'energia-solar-comercial-industrial': 'A03',
  'comercial-industrial': 'A03',
  industrial: 'A03',
  commercial_industrial_solar: 'A03',
  'energia-solar-residencial': 'A04',
  residencial: 'A04',
  residential_solar: 'A04',
  casa: 'A04',
  condominio: 'A04',
  'energia-solar-rural-agronegocio': 'A05',
  'energia-solar-rural': 'A05',
  'rural-agronegocio': 'A05',
  rural: 'A05',
  agronegocio: 'A05',
  rural_solar: 'A05',
  'estruturas-fixacao': 'A06',
  'estruturas-e-fixacao': 'A06',
  'financiamento-energia-solar': 'A07',
  financiamento: 'A07',
  solar_financing: 'A07',
  'instaladores-energia-solar': 'A08',
  instaladores: 'A08',
  instalador: 'A08',
  solar_installer: 'A08',
  inversores: 'A09',
  'inversores-solares': 'A09',
  inversor: 'A09',
  solar_inverter: 'A09',
  'monitoramento-om': 'A10',
  'monitoramento-operacao-manutencao': 'A10',
  monitoramento: 'A10',
  'paineis-solares': 'A11',
  painel: 'A11',
  paineis: 'A11',
  solar_panel: 'A11',

  // Grupo B
  'mobilidade-eletrica': 'B',
  'carregadores-comerciais': 'B01',
  'carregadores-comerciais-e-condominios': 'B01',
  commercial_ev_charger: 'B01',
  'carregadores-residenciais': 'B02',
  'carregadores-residenciais-wallbox': 'B02',
  'carregador-residencial': 'B02',
  wallbox: 'B02',
  'wallbox-residencial': 'B02',
  home_wallbox: 'B02',
  'estacoes-publicas': 'B03',
  'estacoes-publicas-e-postos-rapidos': 'B03',
  'instaladores-carregadores': 'B04',
  'instaladores-ev': 'B04',
  'instaladores-de-carregadores-ev': 'B04',
  'integracao-solar-ev': 'B05',
  'integracao-solar-mobilidade': 'B05',
  'integracao-solar-mobilidade-eletrica': 'B05',
  'veiculos-eletricos': 'B06',
  'carros-eletricos': 'B06',

  // Grupo C
  'frotas-eletricas': 'C',
  'frotas-corporativas': 'C01',
  'frotas-eletricas-corporativas': 'C01',
  'frotas-eletricas-empresas': 'C01',
  fleet_electric: 'C01',
  corporate_fleet: 'C01',
  'frotas-logistica': 'C02',
  'frotas-eletricas-logistica': 'C02',
  'frotas-eletricas-para-logistica-e-entregas': 'C02',
  'mobilidade-urbana': 'C03',
  'frotas-eletricas-para-mobilidade-urbana': 'C03',
  'gestao-frotas': 'C04',
  'gestao-de-frotas-eletricas': 'C04',
  'recarga-frotas': 'C05',
  'infraestrutura-de-recarga-para-frotas': 'C05',

  // Grupo D
  'mercado-livre-de-energia': 'D',
  'mercado-livre': 'D',
  free_energy_market: 'D',

  // Grupo E
  'hubs-eletromobilidade': 'E',
  'hubs-de-eletromobilidade-e-recarga': 'E',
};

/**
 * Resolve o asset visual delegando sempre para o novo resolveCategoryIcon.
 */
export function resolveCategoryVisual(
  slug?: string | null,
  name?: string | null,
  visualKey?: string | null
): CategoryVisualDefinition | null {
  if (!slug && !name && !visualKey) {
    return null;
  }

  const resolution = resolveCategoryIcon({
    slug,
    name,
    visualKey,
  });

  if (resolution.source === 'unknown') {
    return null;
  }

  return {
    code: resolution.catalogId || 'A',
    src: resolution.src,
    alt: resolution.alt,
    motionPreset: resolution.motionPreset,
  };
}
