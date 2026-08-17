'use client';

import Image from 'next/image';
import type { CategoryTreeNode } from '@/types';

type CategoryVisualAssetProps = {
  category: Pick<CategoryTreeNode, 'name' | 'slug' | 'seo_url'> & { icon_url?: string | null; visual_key?: string | null };
  priority?: boolean;
};

const ASSET_BY_KEY: Record<string, string> = {
  battery_storage: '/assets/avalia-solar-icon-pack/baterias.svg',
  solar_panel: '/images/energia-solar-para-sua-casa.png',
  commercial_ev_charger: '/images/carregadores-veiculos-eletricos-avalia-solar.webp',
  home_wallbox: '/assets/avalia-solar-icon-pack/carregador-veicular.svg',
  fleet_van: '/images/MobiVolt-ai-Avalia-solar.png.webp',
};

const KEYWORDS: Array<[string, string]> = [
  ['bateria|armazenamento', 'battery_storage'],
  ['carregador|wallbox|eletroposto', 'commercial_ev_charger'],
  ['painel|módulo|fotovolta', 'solar_panel'],
  ['frota|veículo|mobilidade', 'fleet_van'],
];

function resolveAsset(category: CategoryVisualAssetProps['category']) {
  if (category.icon_url) return category.icon_url;
  const key = category.visual_key || KEYWORDS.find(([pattern]) => new RegExp(pattern, 'i').test(`${category.name} ${category.slug}`))?.[1];
  return key ? ASSET_BY_KEY[key] : null;
}

export default function CategoryVisualAsset({ category, priority = false }: CategoryVisualAssetProps) {
  const src = resolveAsset(category);

  if (!src) {
    return <span className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">Categoria</span>;
  }

  return (
    <Image
      src={src}
      alt=""
      fill
      priority={priority}
      sizes="(max-width: 640px) 50vw, 180px"
      className="object-contain p-2 transition-transform duration-200 group-hover:scale-[1.02]"
    />
  );
}
