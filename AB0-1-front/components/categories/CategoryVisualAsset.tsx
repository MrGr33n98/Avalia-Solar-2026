'use client';

import Image from 'next/image';
import type { CategoryTreeNode } from '@/types';
import { getCategoryVisualAsset } from '@/lib/categoryVisualAssets';

type CategoryVisualAssetProps = {
  category: Pick<CategoryTreeNode, 'name' | 'slug' | 'seo_url'> & { icon_url?: string | null; visual_key?: string | null };
  priority?: boolean;
};

function resolveAsset(category: CategoryVisualAssetProps['category']) {
  return getCategoryVisualAsset(category.slug, category.name, category.visual_key) || category.icon_url || null;
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
