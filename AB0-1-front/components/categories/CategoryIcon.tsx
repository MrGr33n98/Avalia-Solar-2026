import Image from 'next/image';
import { resolveCategoryVisual } from '@/lib/categories/category-visual-registry';
import { Grid2X2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CategoryIconSize = 'sm' | 'md' | 'lg' | 'xl' | 'fill' | number;

export interface CategoryIconProps {
  slug?: string | null;
  name?: string | null;
  visualKey?: string | null;
  iconUrl?: string | null;
  size?: CategoryIconSize;
  priority?: boolean;
  className?: string;
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
  fill = false,
}: CategoryIconProps) {
  // Se houver um fallback direto de URL de ícone, tenta usar ele. Caso contrário, resolve pelo registry 3D.
  const visual = resolveCategoryVisual(slug, name, visualKey);
  const src = iconUrl || visual?.src;
  const alt = visual?.alt || name || 'Categoria';

  const isFill = fill || size === 'fill';

  // Resolução de dimensões físicas do ícone
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
    }
  }

  if (!src) {
    return (
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500',
          isFill ? 'absolute inset-0 w-full h-full' : '',
          className
        )}
        style={isFill ? undefined : { width: dim, height: dim }}
      >
        <Grid2X2 style={isFill ? { width: '40%', height: '40%' } : { width: dim! * 0.5, height: dim! * 0.5 }} aria-hidden="true" />
      </div>
    );
  }

  if (isFill) {
    return (
      <div className={cn('absolute inset-0 w-full h-full flex items-center justify-center', className)}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, 180px"
          className="object-contain p-2"
        />
      </div>
    );
  }

  return (
    <div
      className={cn('relative shrink-0 flex items-center justify-center', className)}
      style={{ width: dim, height: dim }}
    >
      <Image
        src={src}
        alt={alt}
        width={dim}
        height={dim}
        priority={priority}
        className="object-contain max-w-full max-h-full"
      />
    </div>
  );
}
