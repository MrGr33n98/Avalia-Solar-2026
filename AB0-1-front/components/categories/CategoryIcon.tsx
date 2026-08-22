import Image from 'next/image';
import { Grid2X2 } from 'lucide-react';

import { resolveCategoryVisual } from '@/lib/categories/category-visual-registry';
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
  size?: CategoryIconSize;
  priority?: boolean;
  className?: string;

  /**
   * Classe aplicada diretamente à imagem.
   *
   * Permite customizar o tamanho visual do asset
   * sem alterar o container do CategoryIcon.
   *
   * Exemplo:
   * imageClassName="!p-0.5"
   *
   * Importante:
   * - não altera o comportamento padrão;
   * - consumidores existentes continuam usando p-2;
   * - ideal para componentes que precisam de ícone
   *   mais presente visualmente.
   */
  imageClassName?: string;

  fill?: boolean;
}

export function CategoryIcon({
  slug,
  name,
  visualKey,
  iconUrl,
  size = 'md',
  priority = false,
  className,
  imageClassName,
  fill = false,
}: CategoryIconProps) {
  /* ---------------------------------------------------------------------- */
  /* VISUAL RESOLUTION                                                      */
  /* ---------------------------------------------------------------------- */

  const visual = resolveCategoryVisual(
    slug,
    name,
    visualKey,
  );

  const src =
    iconUrl || visual?.src;

  const alt =
    visual?.alt ||
    name ||
    'Categoria';

  const isFill =
    fill || size === 'fill';

  /* ---------------------------------------------------------------------- */
  /* DIMENSIONS                                                             */
  /* ---------------------------------------------------------------------- */

  let dim: number | undefined = 48;

  if (isFill) {
    dim = undefined;
  } else if (
    typeof size === 'number'
  ) {
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
  /* FALLBACK                                                               */
  /* ---------------------------------------------------------------------- */

  if (!src) {
    return (
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500',
          isFill
            ? 'absolute inset-0 h-full w-full'
            : '',
          className,
        )}
        style={
          isFill
            ? undefined
            : {
                width: dim,
                height: dim,
              }
        }
      >
        <Grid2X2
          style={
            isFill
              ? {
                  width: '40%',
                  height: '40%',
                }
              : {
                  width:
                    (dim || 48) * 0.5,
                  height:
                    (dim || 48) * 0.5,
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
          className,
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
            /*
             * Mantém exatamente o comportamento
             * histórico como default.
             */
            'object-contain p-2',

            /*
             * Consumidores específicos podem
             * sobrescrever apenas o asset.
             */
            imageClassName,
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
        className,
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
          imageClassName,
        )}
      />
    </div>
  );
}