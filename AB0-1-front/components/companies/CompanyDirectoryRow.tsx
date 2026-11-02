'use client';

import * as React from 'react';
import Link from 'next/link';
import { Star, MapPin } from 'lucide-react';
import { CompanyLogo } from '@/components/CompanyLogo';
import { CompanyVerifiedBadge } from '@/components/company/CompanyVerifiedBadge';
import { CompareCheckboxControl } from '@/components/compare/CompareCheckboxControl';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';
import { normalizeCompanyData, type CompanyCardData } from '@/components/CompanyCard';
import { useComparison } from '@/hooks/useComparison';
import { buildCompanyPath } from '@/lib/slug';
import { track } from '@/lib/analytics/consolidated';
import { cn } from '@/lib/utils';

export interface CompanyDirectoryRowProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  company: any;
  className?: string;
  index?: number;
  selectedState?: string;
}

export function CompanyDirectoryRow({
  company,
  className,
  index,
  selectedState,
}: CompanyDirectoryRowProps) {
  const data: CompanyCardData = React.useMemo(
    () => normalizeCompanyData(company),
    [company]
  );

  const { isInComparison, toggleComparison, canAddMore } = useComparison();
  const isComparing = isInComparison(data.id);
  const href = buildCompanyPath(data.slug, data.name, data.id);

  const handleRowClick = () => {
    track('company_list_row_clicked', {
      company_id: data.id,
      company_name: data.name,
      position: index,
    });
  };

  const score = data.reputation?.rating_avg ?? 0;
  const count = data.reputation?.rating_count ?? 0;
  const hasReviews = typeof count === 'number' && count > 0 && typeof score === 'number' && score > 0;

  const city = data.identity?.city || (data.coverage?.cities && data.coverage.cities[0]);
  const state = data.identity?.state || (data.coverage?.states && data.coverage.states[0]);
  const rawLocation = [city, state].filter(Boolean).join(', ');

  const normTargetState = selectedState?.trim().toUpperCase();
  const normHqState = data.identity?.state?.trim().toUpperCase();
  const isDifferentState = Boolean(normTargetState && normHqState && normHqState !== normTargetState);

  const location = isDifferentState
    ? rawLocation
      ? `Sede em ${rawLocation} • Atende ${normTargetState}`
      : `Atende ${normTargetState}`
    : rawLocation;

  return (
    <article
      data-testid={`company-directory-row-${data.id}`}
      className={cn(
        'group relative flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:p-3.5 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs focus-within:ring-2 focus-within:ring-blue-500',
        className
      )}
    >
      {/* Link de cobertura em toda a linha para navegação acessível e SEO */}
      <Link
        href={href}
        title={data.name}
        aria-label={`Ver perfil de ${data.name}`}
        onClick={handleRowClick}
        className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      />

      {/* Zona 1: Logo */}
      <div className="relative shrink-0 pointer-events-none">
        <CompanyLogo
          logoUrl={data.logo_url}
          name={data.name}
          size="sm"
          priority={index !== undefined && index < 4}
          badges={data.badges}
        />
      </div>

      {/* Zona 2: Identidade + Reputação + Localização */}
      <div className="min-w-0 flex-1 flex flex-col justify-center pointer-events-none">
        <div className="flex items-center gap-1.5 min-w-0">
          <h3 className="min-w-0 truncate text-[14px] sm:text-[15px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
            {data.name}
          </h3>
          {data.verified && (
            <span
              className="relative z-10 shrink-0 inline-flex items-center pointer-events-auto"
              data-testid="verified-badge-wrapper"
              onClick={(e) => e.stopPropagation()}
            >
              <CompanyVerifiedBadge size="sm" className="h-4 w-4" />
            </span>
          )}
          {Boolean((company as any)?.sponsored || data?.sponsored) && (
            <span className="shrink-0 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
              Patrocinado
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
          {hasReviews ? (
            <div className="flex items-center gap-1 font-medium text-slate-700">
              <Star
                className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0"
                aria-hidden="true"
              />
              <span className="font-bold tabular-nums text-slate-900">
                {score.toFixed(1)}
              </span>
              <span className="text-slate-400">({count})</span>
            </div>
          ) : (
            <span className="text-slate-400">Sem avaliações</span>
          )}

          {location && (
            <>
              <span className="text-slate-300 select-none">•</span>
              <div className="flex items-center gap-1 truncate text-slate-500">
                <MapPin className="h-3 w-3 text-slate-400 shrink-0" aria-hidden="true" />
                <span className="truncate">{location}</span>
              </div>
            </>
          )}

          {Boolean((company as any)?.recommendation_reason?.label) && (
            <>
              <span className="text-slate-300 select-none hidden sm:inline">•</span>
              <span className="truncate max-w-[130px] sm:max-w-none text-blue-600 font-medium text-[11px]">
                {(company as any).recommendation_reason.label}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Zona 3: Ações (Favoritos e Comparar) */}
      <div className="relative z-10 flex shrink-0 items-center gap-1 sm:gap-2">
        <FavoriteButton
          favoritableType="Company"
          favoritableId={data.id}
          source="directory_list"
          className="h-10 w-10 sm:h-11 sm:w-11 text-slate-400 hover:text-rose-500"
        />

        <div className="[&>label>span:last-child]:hidden min-[400px]:[&>label>span:last-child]:inline">
          <CompareCheckboxControl
            companyName={data.name}
            checked={isComparing}
            onCheckedChange={() => toggleComparison(company)}
            disabled={!isComparing && !canAddMore}
            density="compact"
            className="text-xs"
          />
        </div>
      </div>
    </article>
  );
}

export default CompanyDirectoryRow;
