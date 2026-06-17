'use client';

import ComparisonToggleButton from '@/components/ComparisonToggleButton';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { getFullImageUrl } from '@/utils/image';
import { Award, ChevronRight, Info, MapPin, Star, Trophy } from 'lucide-react';
import Link from 'next/link';
import { Company } from '@/lib/api';
import { openQuoteWizard } from '@/lib/quote-wizard';

interface TopRankingSectionProps {
  companies: Company[];
  category: string;
  onMethodologyClick?: () => void;
}

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
    <section className="border-t border-slate-200 pt-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Trophy className="h-9 w-9 shrink-0 fill-amber-400 text-amber-400" />
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-950">
              Top {topCompanies.length} da categoria
            </h2>
            <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-slate-500">
              Ranking baseado em confiabilidade
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onMethodologyClick}
          className="hidden items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-blue-700 sm:inline-flex"
        >
          <Info className="h-4 w-4" />
          Saiba como funciona
          <ChevronRight className="h-4 w-4" />
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

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md ${cardBorderTone} sm:p-4`}
    >
      <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-3 sm:grid-cols-[150px_minmax(0,1fr)_70px] sm:gap-4">
        <div className="space-y-2">
          <RankBadge rank={rank} className={rankTone} />
          <Link
            href={href}
            className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border-2 bg-white shadow-sm ${logoBorderTone}`}
          >
            <OptimizedImage
              src={logoUrl}
              alt={`Logo ${company.name}`}
              fill
              sizes="(max-width: 640px) 104px, 150px"
              objectFit="contain"
              className="p-4"
              containerClassName="h-full w-full"
              fallbackSrc="/images/logo-placeholder.svg"
            />
          </Link>
        </div>

        <div className="min-w-0">
          <div className="mb-1.5 flex items-start justify-between gap-2 sm:hidden">
            <RatingBadge rating={ratingLabel} count={reviewCount} />
          </div>

          <Link href={href} className="block">
            <h3 className="line-clamp-2 text-base font-black leading-tight text-slate-950 sm:text-xl">
              {company.name}
            </h3>
          </Link>

          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-500 sm:text-xs">
            <span className="rounded-full bg-violet-600 px-2.5 py-0.5 text-[10px] font-black uppercase text-white">
              Premium
            </span>
            {location && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{location}</span>
              </span>
            )}
          </div>

          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
            {company.description || `Empresa especializada em ${category}.`}
          </p>

          <div className="mt-2 grid max-w-[420px] grid-cols-[minmax(104px,1fr)_minmax(96px,1fr)_64px] gap-1.5 sm:gap-2">
            <Button
              size="sm"
              onClick={() => openQuoteWizard({ source: 'category-ranking' })}
              className="h-9 rounded-lg bg-blue-700 text-[11px] font-bold text-white hover:bg-blue-800 sm:text-xs"
            >
              Orçamento
            </Button>
            <Button
              size="sm"
              variant="outline"
              asChild
              className="h-9 rounded-lg border-slate-200 text-[11px] font-bold text-blue-700 sm:text-xs"
            >
              <Link href={`${href}/review`}>
                <Star className="mr-1 h-4 w-4" />
                Avaliar
              </Link>
            </Button>
            <ComparisonToggleButton
              company={company}
              size="sm"
              className="h-9 min-w-0 rounded-lg px-2 text-[11px] font-bold shadow-none [&_svg]:mx-auto [&_span]:hidden"
            />
          </div>
        </div>

        <div className="hidden sm:block">
          <RatingBadge rating={ratingLabel} count={reviewCount} />
        </div>
      </div>
    </article>
  );
}

function RankBadge({ rank, className }: { rank: number; className: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-black uppercase ${className}`}
    >
      <Award className="h-3.5 w-3.5" />
      Top {rank}
    </span>
  );
}

function RatingBadge({ rating, count }: { rating: string; count: number }) {
  return (
    <div className="shrink-0 rounded-xl border border-slate-200 bg-white px-2 py-1 text-center shadow-sm">
      <div className="flex items-center justify-center gap-1 text-xs font-black text-slate-950">
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        {rating}
      </div>
      <p className="mt-0.5 text-[11px] font-medium text-slate-500">({count})</p>
    </div>
  );
}
