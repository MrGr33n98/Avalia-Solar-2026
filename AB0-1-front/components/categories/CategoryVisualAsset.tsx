'use client';

import type { CategoryTreeNode } from '@/types';
import { CategoryMotionIcon } from './CategoryMotionIcon';

type CategoryVisualAssetProps = {
  category: Pick<CategoryTreeNode, 'name' | 'slug' | 'seo_url'> & { icon_url?: string | null; visual_key?: string | null };
  priority?: boolean;
  motionMode?: 'none' | 'interactive' | 'entrance' | 'selected';
};

export default function CategoryVisualAsset({
  category,
  priority = false,
  motionMode = 'interactive',
}: CategoryVisualAssetProps) {
  return (
    <CategoryMotionIcon
      slug={category.slug || category.seo_url}
      name={category.name}
      visualKey={category.visual_key}
      iconUrl={category.icon_url}
      priority={priority}
      size="fill"
      motionMode={motionMode}
      className="w-full h-full"
    />
  );
}
