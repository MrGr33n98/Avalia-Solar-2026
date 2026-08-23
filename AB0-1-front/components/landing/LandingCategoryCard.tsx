'use client';

import { useId, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import {
  ArrowRight,
  Building2,
} from 'lucide-react';

import { Card } from '@/components/ui/card';

import type { Category } from '@/lib/api';
import { getCategoryVisualAsset } from '@/lib/categoryVisualAssets';
import { buildCategoryPath } from '@/lib/slug';
import { cn } from '@/lib/utils';
import { getFullImageUrl } from '@/utils/image';

/* -------------------------------------------------------------------------- */
/*                                   CONFIG                                   */
/* -------------------------------------------------------------------------- */

const CATEGORY_IMAGE_PLACEHOLDER =
  '/images/avalia-solar-place-holder.PNG';

const CATEGORY_FALLBACKS: Array<
  [RegExp, string]
> = [
  [
    /residencial|condom/i,
    '/residencial-e-condominio-avalia-solar.webp',
  ],
  [
    /comercial|industrial/i,
    '/images/industria-avalia-solar.webp',
  ],
  [
    /carregador|mobilidade|elétric|eletric/i,
    '/images/carregadores-veiculos-eletricos-avalia-solar.webp',
  ],
  [
    /rural|bomba/i,
    '/rural-avaliasolar.webp',
  ],
  [
    /instalador/i,
    '/instaladores-solar-avalia-solar.webp',
  ],
];

type LandingCategoryCardProps = {
  category: Category;
  className?: string;
};

/* -------------------------------------------------------------------------- */
/*                              IMAGE RESOLUTION                              */
/* -------------------------------------------------------------------------- */

type ResolvedCategoryImage = {
  src: string;
  isVisualAsset: boolean;
};

function resolveCategoryImage(
  category: Category,
): ResolvedCategoryImage {
  /*
   * Preserve a prioridade original:
   *
   * 1. Asset visual mapeado internamente
   * 2. Banner do carrossel
   * 3. Banner da categoria
   * 4. Logo
   * 5. Fallback contextual
   * 6. Placeholder global
   */

  const visualAsset = getCategoryVisualAsset(
    category?.seo_url,
    category?.name,
    category?.visual_key,
  );

  if (visualAsset) {
    return {
      src: visualAsset,
      isVisualAsset: true,
    };
  }

  const remoteImage =
    getFullImageUrl(
      category
        ?.home_carousel_banner_url ||
        category?.banner_url ||
        category?.logo?.url,
    );

  if (remoteImage) {
    return {
      src: remoteImage,
      isVisualAsset: false,
    };
  }

  const contextualFallback =
    CATEGORY_FALLBACKS.find(
      ([pattern]) =>
        pattern.test(
          category?.name || '',
        ),
    )?.[1];

  return {
    src: contextualFallback || CATEGORY_IMAGE_PLACEHOLDER,
    isVisualAsset: false,
  };
}

/* -------------------------------------------------------------------------- */
/*                                  COMPONENT                                 */
/* -------------------------------------------------------------------------- */

export default function LandingCategoryCard({
  category,
  className,
}: LandingCategoryCardProps) {
  const [
    imageError,
    setImageError,
  ] = useState(false);

  /*
   * Mantido para acessibilidade e IDs únicos,
   * inclusive quando uma categoria vier sem ID.
   */
  const reactId = useId().replace(
    /:/g,
    '',
  );

  /*
   * Mantém exatamente o mecanismo existente
   * para construção da URL pública da categoria.
   */
  const href = buildCategoryPath(
    category?.seo_url,
    category?.id,
  );

  const titleId = `landing-category-${
    category?.id || reactId
  }-title-${reactId}`;

  const resolvedImage = imageError
    ? {
        src: CATEGORY_IMAGE_PLACEHOLDER,
        isVisualAsset: false,
      }
    : resolveCategoryImage(category);

  return (
    <Card
      className={cn(
        /* -------------------------------------------------------------- */
        /* CONTAINER                                                      */
        /* -------------------------------------------------------------- */

        'group/card relative min-w-0 overflow-hidden',

        /*
         * Altura controlada mantém todos os cards
         * visualmente alinhados no grid da Home.
         */
        'h-[280px] sm:h-[288px]',

        /* Premium rounded card */
        'rounded-[24px]',

        /* Neutral premium surface */
        'border border-slate-200/80',
        'bg-white',

        /*
         * Sombra propositalmente leve.
         * Não usamos glassmorphism pesado.
         */
        'shadow-[0_1px_2px_rgba(15,23,42,0.02),0_8px_24px_rgba(15,23,42,0.035)]',

        /*
         * Microinteraction.
         */
        'transition-[transform,border-color,box-shadow] duration-300 ease-out',

        /*
         * Hover desktop.
         */
        'hover:-translate-y-1',
        'hover:border-blue-200',
        'hover:shadow-[0_18px_42px_rgba(15,23,42,0.09)]',

        className,
      )}
    >
      <Link
        href={href}
        aria-labelledby={titleId}
        className={cn(
          'flex h-full flex-col',

          /*
           * O próprio elemento clicável segue
           * o radius externo.
           */
          'rounded-[24px]',

          'outline-none',

          /*
           * Estado de teclado acessível.
           */
          'focus-visible:ring-2',
          'focus-visible:ring-blue-500',
          'focus-visible:ring-offset-2',
        )}
      >
        {/* ---------------------------------------------------------------- */}
        {/* IMAGE / VISUAL                                                   */}
        {/* ---------------------------------------------------------------- */}

        <div
          className={cn(
            'relative shrink-0 overflow-hidden',

            /*
             * Imagem mais protagonista que no
             * componente antigo.
             */
            'h-[130px] sm:h-[136px]',

            /*
             * Fundo elegante para imagens 3D,
             * PNGs e fotografias.
             */
            'bg-gradient-to-b from-slate-50 to-slate-100/80',
          )}
        >
          <Image
            src={resolvedImage.src}
            alt=""
            fill
            sizes="
              (max-width: 640px) 100vw,
              (max-width: 1024px) 50vw,
              25vw
            "
            className={cn(
              resolvedImage.isVisualAsset
                ? 'object-contain object-center p-2'
                : 'object-cover object-center',

              /*
               * Animação muito discreta.
               */
              'transition-transform duration-500 ease-out',
              'group-hover/card:scale-[1.035]',
            )}
            onError={() =>
              setImageError(true)
            }
          />

          {/* iluminação superior muito sutil */}

          <div
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-0',

              'bg-gradient-to-b',
              'from-white/10',
              'via-transparent',
              'to-slate-950/[0.025]',
            )}
          />

          {/* suavização na transição imagem → conteúdo */}

          <div
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute inset-x-0 bottom-0',
              'h-10',
              'bg-gradient-to-t from-white/10 to-transparent',
            )}
          />
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* BODY                                                             */}
        {/* ---------------------------------------------------------------- */}

        <div className="flex min-h-0 flex-1 flex-col">
          <div
            className={cn(
              'flex-1',

              'px-4',
              'pb-3',
              'pt-4',

              'sm:px-[18px]',
            )}
          >
            {/* TITLE */}

            <h3
              id={titleId}
              className={cn(
                'line-clamp-2',

                /*
                 * Mais compacto que um card tradicional,
                 * mantendo sensação de produto SaaS.
                 */
                'text-[14px]',
                'font-bold',
                'leading-[1.25rem]',
                'tracking-[-0.015em]',

                'text-slate-950',

                'transition-colors duration-200',

                'group-hover/card:text-blue-950',
              )}
            >
              {category?.name ||
                'Categoria'}
            </h3>

            {/* DESCRIPTION */}

            <p
              className={cn(
                'mt-1.5',

                /*
                 * Mesma altura visual mesmo quando
                 * as descrições têm tamanhos diferentes.
                 */
                'line-clamp-2',
                'min-h-[34px]',

                'text-[12px]',
                'leading-[1.08rem]',

                'text-slate-500',
              )}
            >
              {category
                ?.short_description ||
                'Compare empresas especializadas e encontre a solução adequada ao seu projeto.'}
            </p>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* ACTION FOOTER                                                    */}
          {/* ---------------------------------------------------------------- */}

          <div
            className={cn(
              /*
               * Não colocamos uma caixa adicional.
               * Apenas uma divisão elegante.
               */
              'mx-4',
              'sm:mx-[18px]',

              'flex',
              'min-h-[47px]',
              'items-center',
              'justify-between',
              'gap-2',

              'border-t',
              'border-slate-100',
            )}
          >
            {/* VER EMPRESAS */}

            <span
              className={cn(
                'inline-flex min-w-0 items-center gap-2',

                'text-[11px]',
                'font-semibold',

                'text-slate-500',

                'transition-colors duration-200',

                'group-hover/card:text-slate-700',
              )}
            >
              <span
                className={cn(
                  'flex',
                  'h-6',
                  'w-6',
                  'shrink-0',
                  'items-center',
                  'justify-center',

                  'rounded-lg',

                  'bg-blue-50',
                  'text-blue-600',

                  'transition-colors duration-200',

                  'group-hover/card:bg-blue-100',
                )}
              >
                <Building2
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                />
              </span>

              <span className="truncate">
                Ver empresas
              </span>
            </span>

            {/* EXPLORAR */}

            <span
              className={cn(
                'inline-flex',
                'shrink-0',
                'items-center',

                'text-[11px]',
                'font-bold',

                'text-blue-700',
              )}
            >
              Explorar

              <ArrowRight
                className={cn(
                  'ml-1.5',
                  'h-3.5',
                  'w-3.5',

                  'transition-transform',
                  'duration-300',

                  'group-hover/card:translate-x-1',
                )}
                aria-hidden="true"
              />
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
}