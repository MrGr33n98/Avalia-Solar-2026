'use client';

import ComparisonToggleButton from '@/components/ComparisonToggleButton';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { getFullImageUrl } from '@/utils/image';
import { Award, ChevronRight, MapPin, Star } from 'lucide-react';
import Link from 'next/link';
import { Company } from '@/lib/api';
import { openQuoteWizard } from '@/lib/quote-wizard';

interface TopRankingSectionProps {
  companies: Company[];
  category: string;
  onMethodologyClick?: () => void;
}

type RankingCompany = Company & {
  feature_access?: Record<string, { state?: string; value?: unknown }>;
  sponsored?: boolean;
};

export default function TopRankingSection({
  companies,
  category,
  onMethodologyClick,
}: TopRankingSectionProps) {
  const topCompanies = companies.slice(0, 3);

  if (topCompanies.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight text-slate-950 sm:text-lg">
            Destaques Patrocinados
          </h2>
          <p className="mt-0.5 truncate text-[11px] font-medium text-slate-500 sm:text-xs">
            Empresas parceiras recomendadas para esta categoria.
          </p>
        </div>
        <button
          type="button"
          onClick={onMethodologyClick}
          className="inline-flex shrink-0 items-center gap-1 pt-0.5 text-[10px] font-semibold text-blue-600 transition-colors hover:text-blue-700 sm:text-xs"
        >
          Saiba como funciona
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      <div className="space-y-3">
        {topCompanies.map((company, index) => (
          <RankingCompanyCard
            key={company.id}
            company={company}
            category={category}
            rank={index + 1}
          />
        ))}
      </div>
    </section>
  );
}

function RankingCompanyCard({
  company,
  category,
  rank,
}: {
  company: Company;
  category: string;
  rank: number;
}) {
  const logoUrl = company.logo_url
    ? getFullImageUrl(company.logo_url)
    : '/images/logo-placeholder.svg';
  const location = [company.city, company.state].filter(Boolean).join(', ');
  const rating = Number(company.rating_avg || company.rating || company.average_rating || 0);
  const ratingLabel = rating > 0 ? rating.toFixed(1) : '5.0';
  const reviewCount = company.rating_count || company.reviews_count || company.total_reviews || 0;
  const href = company.slug ? `/companies/${company.slug}` : `/companies/${company.id}`;
  const rankTone =
    rank === 1
      ? 'bg-amber-100 text-amber-700'
      : rank === 2
        ? 'bg-slate-100 text-slate-600'
        : 'bg-orange-100 text-orange-700';
  const logoBorderTone =
    rank === 1 ? 'border-blue-500' : rank === 2 ? 'border-teal-600' : 'border-green-600';
  const cardBorderTone =
    rank === 1
      ? 'hover:border-blue-200'
      : rank === 2
        ? 'hover:border-teal-200'
        : 'hover:border-green-200';
  const rankingCompany = company as RankingCompany;
  const featureAccess = rankingCompany.feature_access ?? {};
  const customCta = featureAccess.custom_ctas;
  const canQuote =
    Object.keys(featureAccess).length > 0
      ? Boolean(
          customCta &&
          ['enabled', 'limited', 'trial'].includes(customCta.state || '') &&
          customCta.value !== false &&
          customCta.value !== null
        )
      : rankingCompany.sponsored === true;

  return (
    <article
      className={`relative overflow-hidden rounded-[8px] border border-slate-200 bg-white p-3 transition-all hover:shadow-md ${cardBorderTone}`}
    >
      <div className="grid grid-cols-[72px_minmax(0,1fr)_52px] items-start gap-2 sm:grid-cols-[96px_minmax(0,1fr)_64px] sm:gap-3">
        <div>
          <Link
            href={href}
            className={`relative flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-[6px] border bg-white sm:h-24 sm:w-24 ${logoBorderTone}`}
          >
            <OptimizedImage
              src={logoUrl}
              alt={`Logo ${company.name}`}
              fill
              sizes="(max-width: 640px) 72px, 96px"
              objectFit="contain"
              className="p-2"
              containerClassName="h-full w-full"
              fallbackSrc="/images/logo-placeholder.svg"
            />
          </Link>
        </div>

        <div className="min-w-0">
          <div className="mb-1 flex min-w-0 items-center gap-1">
            <RankBadge className={rankTone} />
            <span className="truncate rounded-[4px] bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 sm:text-[10px]">
              Premium
            </span>
          </div>

          <Link href={href} className="block">
            <h3 className="truncate text-sm font-bold leading-tight text-slate-950 sm:text-base">
              {company.name}
            </h3>
          </Link>

          {location && (
            <span className="mt-1 inline-flex max-w-full items-center gap-1 text-[10px] font-medium text-slate-500 sm:text-[11px]">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{location}</span>
            </span>
          )}

          <p className="mt-1 line-clamp-2 text-[10px] leading-[1.25] text-slate-600 sm:text-xs">
            {company.description || `Empresa especializada em ${category}.`}
          </p>
        </div>

        <RatingBadge rating={ratingLabel} count={reviewCount} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1.5 sm:ml-[108px] sm:max-w-[420px] sm:gap-2">
        {/* Botão "Orçamento" — feature paga, estilo laranja diferenciado */}
        {canQuote ? (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openQuoteWizard({ source: 'category-ranking' });
            }}
            className="h-8 min-w-0 rounded-[6px] border border-[#FDBA74] bg-[#FFF7ED] px-1.5 text-[10px] font-bold text-[#C2410C] shadow-none hover:bg-[#FFEED5] sm:h-9 sm:text-xs"
          >
            Orçamento
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            asChild
            className="h-8 min-w-0 rounded-[6px] border-slate-200 px-1.5 text-[10px] font-bold text-slate-700 sm:h-9 sm:text-xs"
          >
            <Link href={href}>Ver perfil</Link>
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          asChild
          className="h-8 min-w-0 rounded-[6px] border-slate-200 px-1.5 text-[10px] font-bold text-blue-700 sm:h-9 sm:text-xs"
        >
          <Link href={`${href}/review`}>
            <Star className="mr-1 hidden h-3.5 w-3.5 min-[360px]:block" />
            Avaliar
          </Link>
        </Button>
        <ComparisonToggleButton
          company={company}
          size="sm"
          compactLabel
          className="h-8 min-w-0 rounded-[6px] px-1.5 text-[10px] font-bold shadow-none [&>div]:gap-1 sm:h-9 sm:text-xs"
        />
      </div>
    </article>
  );
}

function RankBadge({ className }: { className: string }) {
  return (
    <span
      className={`inline-flex min-w-0 items-center gap-0.5 rounded-[4px] px-1.5 py-0.5 text-[9px] font-bold ${className} sm:text-[10px]`}
    >
      <Award className="h-3 w-3 shrink-0" />
      Patrocinado
    </span>
  );
}

function RatingBadge({ rating, count }: { rating: string; count: number }) {
  return (
    <div className="w-[52px] shrink-0 rounded-[6px] border border-slate-200 bg-white px-1 py-1 text-center sm:w-16 sm:px-2">
      <div className="flex items-center justify-center gap-0.5 text-[11px] font-bold text-slate-950 sm:text-xs">
        <Star className="h-3 w-3 fill-amber-400 text-amber-400 sm:h-3.5 sm:w-3.5" />
        {rating}
      </div>
      <p className="mt-0.5 text-[9px] font-medium text-slate-500 sm:text-[10px]">({count})</p>
    </div>
  );
}
