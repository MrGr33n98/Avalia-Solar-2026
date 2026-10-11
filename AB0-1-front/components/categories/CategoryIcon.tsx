import Image from 'next/image';
import { Grid2X2 } from 'lucide-react';

import { resolveCategoryIcon } from '@/lib/categories/resolve-category-icon';
import { cn } from '@/lib/utils';

export type CategoryIconSize =
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | 'fill'
  | number;

export interface CategoryIconProps {
  slug?: string | null;
  name?: string | null;
  visualKey?: string | null;
  iconUrl?: string | null;
  parentSlug?: string | null;
  parentId?: number | string | null;
  size?: CategoryIconSize;
  priority?: boolean;
  className?: string;

  /**
   * Classe aplicada diretamente à imagem.
   *
   * Permite customizar o tamanho visual do asset
   * sem alterar o container do CategoryIcon.
   */
  imageClassName?: string;

  fill?: boolean;
  sizeVariant?: '256' | '512' | '1024';
}

export function CategoryIcon({
  slug,
  name,
  visualKey,
  iconUrl,
  parentSlug,
  parentId,
  size = 'md',
  priority = false,
  className,
  imageClassName,
  fill = false,
  sizeVariant,
}: CategoryIconProps) {
  /* ---------------------------------------------------------------------- */
  /* VISUAL RESOLUTION (CANONICAL 3D REFINED & SVG SOURCE OF TRUTH)        */
  /* ---------------------------------------------------------------------- */

  const isSmall = size === 'sm' || (typeof size === 'number' && size <= 64);
  const resolvedSizeVariant = sizeVariant || (isSmall ? '256' : '512');

  const resolution = resolveCategoryIcon({
    slug,
    name,
    visualKey,
    iconUrl,
    parentSlug,
    parentId,
    sizeVariant: resolvedSizeVariant,
  });

  const src = resolution.src;
  const alt = resolution.alt || name || 'Categoria';
  const isFill = fill || size === 'fill';

  /* ---------------------------------------------------------------------- */
  /* DIMENSIONS                                                             */
  /* ---------------------------------------------------------------------- */

  let dim: number | undefined = 48;

  if (isFill) {
    dim = undefined;
  } else if (typeof size === 'number') {
    dim = size;
  } else {
    switch (size) {
      case 'sm':
        dim = 24;
        break;

      case 'md':
        dim = 48;
        break;

      case 'lg':
        dim = 64;
        break;

      case 'xl':
        dim = 96;
        break;

      default:
        dim = 48;
        break;
    }
  }

  /* ---------------------------------------------------------------------- */
  /* FALLBACK (se src vier vazio de alguma chamada anômala)                  */
  /* ---------------------------------------------------------------------- */

  if (!src) {
    return (
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500',
          isFill ? 'absolute inset-0 h-full w-full' : '',
          className
        )}
        style={
          isFill
            ? undefined
            : {
                width: dim,
                height: dim,
              }
        }
        aria-hidden="true"
      >
        <Grid2X2
          style={
            isFill
              ? {
                  width: '40%',
                  height: '40%',
                }
              : {
                  width: (dim || 48) * 0.5,
                  height: (dim || 48) * 0.5,
                }
          }
          aria-hidden="true"
        />
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* FILL MODE                                                              */
  /* ---------------------------------------------------------------------- */

  if (isFill) {
    return (
      <div
        className={cn(
          'absolute inset-0 flex h-full w-full items-center justify-center',
          className
        )}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          unoptimized
          sizes="(max-width: 640px) 50vw, 180px"
          className={cn(
            'object-contain p-2',
            imageClassName
          )}
        />
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* FIXED SIZE MODE                                                        */
  /* ---------------------------------------------------------------------- */

  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center',
        className
      )}
      style={{
        width: dim,
        height: dim,
      }}
    >
      <Image
        src={src}
        alt={alt}
        width={dim}
        height={dim}
        priority={priority}
        unoptimized
        className={cn(
          'max-h-full max-w-full object-contain',
          imageClassName
        )}
      />
    </div>
  );
}