'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Building2 } from 'lucide-react';

import { Card } from '@/components/ui/card';
import type { Category } from '@/lib/api';
import { buildCategoryPath } from '@/lib/slug';
import { cn } from '@/lib/utils';
import { getFullImageUrl } from '@/utils/image';

const CATEGORY_IMAGE_PLACEHOLDER = '/images/avalia-solar-place-holder.PNG';

const CATEGORY_FALLBACKS: Array<[RegExp, string]> = [
  [/residencial|condom/i, '/residencial-e-condominio-avalia-solar.webp'],
  [/comercial|industrial/i, '/images/industria-avalia-solar.webp'],
  [/carregador|mobilidade|elétric|eletric/i, '/images/carregadores-veiculos-eletricos-avalia-solar.webp'],
  [/rural|bomba/i, '/rural-avaliasolar.webp'],
  [/instalador/i, '/instaladores-solar-avalia-solar.webp'],
  [/solar|energia/i, '/energia-solar-avalia-solar.webp'],
];

type LandingCategoryCardProps = {
  category: Category;
  className?: string;
};

function resolveCategoryImage(category: Category): string {
  const remoteImage = getFullImageUrl(
    category?.home_carousel_banner_url || category?.banner_url || category?.logo?.url
  );
  if (remoteImage) return remoteImage;

  return (
    CATEGORY_FALLBACKS.find(([pattern]) => pattern.test(category?.name || ''))?.[1] ||
    CATEGORY_IMAGE_PLACEHOLDER
  );
}

export default function LandingCategoryCard({ category, className }: LandingCategoryCardProps) {
  const [imageError, setImageError] = useState(false);
  const href = buildCategoryPath(category?.seo_url, category?.id);

  return (
    <Card
      className={cn(
        'group/card h-[216px] min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-none transition-colors hover:border-blue-300 sm:h-[220px]',
        className
      )}
    >
      <Link
        href={href}
        className="flex h-full flex-col rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <div className="relative h-[92px] shrink-0 overflow-hidden bg-slate-100 sm:h-[96px]">
          <Image
            src={imageError ? CATEGORY_IMAGE_PLACEHOLDER : resolveCategoryImage(category)}
            alt={`Solução de ${category?.name || 'energia solar'}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover object-center transition-transform duration-300 group-hover/card:scale-[1.03]"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/35 to-transparent" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-3.5 py-3 sm:px-4">
          <div>
            <h3 className="line-clamp-2 text-sm font-semibold leading-[1.25rem] tracking-tight text-slate-950">
              {category?.name || 'Categoria'}
            </h3>
            <p className="mt-1 line-clamp-2 text-xs leading-[1.05rem] text-slate-500">
              {category?.short_description ||
                'Compare empresas especializadas e encontre a solução adequada ao seu projeto.'}
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Building2 className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
              Ver empresas
            </span>
            <span className="inline-flex items-center text-xs font-semibold text-blue-700">
              Explorar <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
}
