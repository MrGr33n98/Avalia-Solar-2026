'use client';

/*
 * P0 PERF FIX:
 * Mantém as animações via CSS puro.
 *
 * Utiliza o novo resolver unificado dos 47 ícones canônicos.
 */

import { resolveCategoryIcon } from '@/lib/categories/resolve-category-icon';
import { CategoryIcon, CategoryIconProps } from './CategoryIcon';

export interface CategoryMotionIconProps extends CategoryIconProps {
  motionMode?: 'none' | 'interactive' | 'entrance' | 'selected';
}

export function CategoryMotionIcon({
  motionMode = 'interactive',
  className,
  imageClassName,
  ...props
}: CategoryMotionIconProps) {
  /* ---------------------------------------------------------------------- */
  /* VISUAL PRESET VIA RESOLVER CANÔNICO                                    */
  /* ---------------------------------------------------------------------- */

  const resolution = resolveCategoryIcon({
    slug: props.slug,
    name: props.name,
    visualKey: props.visualKey,
    iconUrl: props.iconUrl,
    parentSlug: props.parentSlug,
    parentId: props.parentId,
  });


  /* ---------------------------------------------------------------------- */
  /* STATIC MODE                                                            */
  /* ---------------------------------------------------------------------- */

  if (motionMode === 'none') {
    return (
      <CategoryIcon
        {...props}
        className={className}
        imageClassName={imageClassName}
      />
    );
  }

  /* ---------------------------------------------------------------------- */
  /* FILL MODE                                                              */
  /* ---------------------------------------------------------------------- */

  const fillsAvailableSpace = props.fill || props.size === 'fill';

  /* ---------------------------------------------------------------------- */
  /* CSS MOTION                                                             */
  /* ---------------------------------------------------------------------- */

  const motionClass = [
    'relative flex items-center justify-center',

    motionMode === 'entrance' && 'animate-category-icon-entrance',

    motionMode === 'interactive' &&
      [
        'transition-transform',
        'duration-200',
        'ease-out',
        'hover:scale-105',
        'active:scale-95',
      ].join(' '),

    motionMode === 'selected' && 'animate-category-icon-selected',

    fillsAvailableSpace && 'h-full w-full',

    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={motionClass} data-motion-preset={resolution.motionPreset}>
      <CategoryIcon
        {...props}
        imageClassName={imageClassName}
      />
    </div>
  );
}