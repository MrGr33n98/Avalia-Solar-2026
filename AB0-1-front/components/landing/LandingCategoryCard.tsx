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

const CATEGORY_IMAGE_PLACEHOLDER = '/images/category-placeholder.jpg';

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
  const companiesCount = category?.companies_count ?? category?.companies?.length ?? 0;

  return (
    <Card
      className={cn(
        'group/card h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-none transition-colors hover:border-blue-300',
        className
      )}
    >
      <Link
        href={href}
        className="block h-full rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
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

        <div className="flex min-h-[154px] flex-col justify-between p-4">
          <div>
            <h3 className="line-clamp-2 text-base font-black leading-tight text-slate-950">
              {category?.name || 'Categoria'}
            </h3>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
              {category?.short_description ||
                'Compare empresas especializadas e encontre a solução adequada ao seu projeto.'}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Building2 className="h-4 w-4 text-blue-600" aria-hidden="true" />
              {companiesCount > 0 ? `${companiesCount} empresas` : 'Ver empresas'}
            </span>
            <span className="inline-flex items-center text-sm font-extrabold text-blue-700">
              Explorar <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
}
