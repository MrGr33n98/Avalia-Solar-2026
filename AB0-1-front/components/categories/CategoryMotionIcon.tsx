'use client';

/*
 * P0 PERF FIX:
 * Mantém as animações via CSS puro.
 *
 * Não introduz Framer Motion neste componente.
 */

import {
  resolveCategoryVisual,
} from '@/lib/categories/category-visual-registry';

import {
  CategoryIcon,
  CategoryIconProps,
} from './CategoryIcon';

export interface CategoryMotionIconProps
  extends CategoryIconProps {
  motionMode?:
    | 'none'
    | 'interactive'
    | 'entrance'
    | 'selected';
}

export function CategoryMotionIcon({
  motionMode = 'interactive',
  className,
  imageClassName,
  ...props
}: CategoryMotionIconProps) {
  /* ---------------------------------------------------------------------- */
  /* VISUAL PRESET                                                          */
  /* ---------------------------------------------------------------------- */

  const visual =
    resolveCategoryVisual(
      props.slug,
      props.name,
      props.visualKey,
    );

  const preset =
    visual?.motionPreset ||
    'neutral';

  /* ---------------------------------------------------------------------- */
  /* STATIC MODE                                                            */
  /* ---------------------------------------------------------------------- */

  if (motionMode === 'none') {
    return (
      <CategoryIcon
        {...props}
        className={className}
        imageClassName={
          imageClassName
        }
      />
    );
  }

  /* ---------------------------------------------------------------------- */
  /* FILL MODE                                                              */
  /* ---------------------------------------------------------------------- */

  const fillsAvailableSpace =
    props.fill ||
    props.size === 'fill';

  /* ---------------------------------------------------------------------- */
  /* CSS MOTION                                                             */
  /* ---------------------------------------------------------------------- */

  const motionClass = [
    'relative flex items-center justify-center',

    motionMode ===
      'entrance' &&
      'animate-category-icon-entrance',

    motionMode ===
      'interactive' &&
      [
        'transition-transform',
        'duration-200',
        'ease-out',
        'hover:scale-105',
        'active:scale-95',
      ].join(' '),

    motionMode ===
      'selected' &&
      'animate-category-icon-selected',

    fillsAvailableSpace &&
      'h-full w-full',

    className,
  ]
    .filter(Boolean)
    .join(' ');

  /* ---------------------------------------------------------------------- */
  /* CHARGING EFFECT                                                        */
  /* ---------------------------------------------------------------------- */

  const isCharging =
    preset === 'charging';

  const isInteractive =
    motionMode ===
    'interactive';

  return (
    <div className={motionClass}>
      {isCharging &&
        isInteractive && (
          <span
            className="
              pointer-events-none
              absolute
              inset-[-8px]
              rounded-full
              opacity-0
              transition-opacity
              duration-300
              hover:opacity-5
            "
            style={{
              background:
                'radial-gradient(circle, rgba(37,99,235,0.15) 0%, rgba(255,255,255,0) 70%)',
            }}
          />
        )}

      <CategoryIcon
        {...props}
        imageClassName={
          imageClassName
        }
      />
    </div>
  );
}