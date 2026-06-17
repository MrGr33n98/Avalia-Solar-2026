'use client';

import ComparisonToggleButton from '@/components/ComparisonToggleButton';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { getFullImageUrl } from '@/utils/image';
import { Award, Check, ChevronRight, Info, MapPin, Star, Trophy } from 'lucide-react';
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
  const coverUrl = company.banner_url
    ? getFullImageUrl(company.banner_url)
    : '/images/banner-avalia-solar.png';
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

  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:p-4">
      <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-4 sm:grid-cols-[170px_minmax(0,1fr)_76px] sm:gap-5">
        <Link
          href={href}
          className="relative block h-[118px] overflow-hidden rounded-xl bg-slate-900 sm:h-[142px]"
        >
          <OptimizedImage
            src={coverUrl}
            alt={company.name}
            fill
            sizes="(max-width: 640px) 112px, 170px"
            className="object-cover"
            fallbackSrc="/images/banner-avalia-solar.png"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/65 via-slate-950/10 to-transparent" />
          <div className="absolute left-3 top-4 flex h-12 w-20 items-center justify-center rounded-lg bg-white p-2 shadow-sm sm:w-24">
            <OptimizedImage
              src={logoUrl}
              alt={`Logo ${company.name}`}
              fill
              sizes="96px"
              objectFit="contain"
              className="p-1"
              containerClassName="h-full w-full"
              fallbackSrc="/images/logo-placeholder.svg"
            />
          </div>
          {company.verified && (
            <span className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
              <Check className="h-5 w-5" />
            </span>
          )}
        </Link>

        <div className="min-w-0">
          <div className="mb-2 flex items-start justify-between gap-2 sm:hidden">
            <RankBadge rank={rank} className={rankTone} />
            <RatingBadge rating={ratingLabel} count={reviewCount} />
          </div>

          <div className="hidden sm:mb-2 sm:block">
            <RankBadge rank={rank} className={rankTone} />
          </div>

          <Link href={href} className="block">
            <h3 className="line-clamp-2 text-lg font-black leading-tight text-slate-950 sm:text-2xl">
              {company.name}
            </h3>
          </Link>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 sm:text-sm">
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

          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
            {company.description || `Empresa especializada em ${category}.`}
          </p>

          <div className="mt-3 grid grid-cols-[1fr_1fr_1fr] gap-2">
            <Button
              size="sm"
              onClick={() => openQuoteWizard({ source: 'category-ranking' })}
              className="h-10 rounded-lg bg-blue-700 text-xs font-bold text-white hover:bg-blue-800"
            >
              Orçamento
            </Button>
            <Button
              size="sm"
              variant="outline"
              asChild
              className="h-10 rounded-lg border-slate-200 text-xs font-bold text-blue-700"
            >
              <Link href={`${href}/review`}>
                <Star className="mr-1 h-4 w-4" />
                Avaliar
              </Link>
            </Button>
            <ComparisonToggleButton
              company={company}
              size="sm"
              className="h-10 min-w-0 rounded-lg px-2 text-xs font-bold shadow-none [&_span]:hidden sm:[&_span]:inline"
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
      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-black uppercase ${className}`}
    >
      <Award className="h-4 w-4" />
      Top {rank}
    </span>
  );
}

function RatingBadge({ rating, count }: { rating: string; count: number }) {
  return (
    <div className="shrink-0 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-center shadow-sm">
      <div className="flex items-center justify-center gap-1 text-sm font-black text-slate-950">
        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
        {rating}
      </div>
      <p className="mt-0.5 text-xs font-medium text-slate-500">({count})</p>
    </div>
  );
}
