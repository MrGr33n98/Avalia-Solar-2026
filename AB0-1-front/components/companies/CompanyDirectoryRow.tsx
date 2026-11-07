'use client';

import * as React from 'react';
import Link from 'next/link';
import { Star, MapPin } from 'lucide-react';
import { CompanyLogo } from '@/components/CompanyLogo';
import { CompanyVerifiedBadge } from '@/components/company/CompanyVerifiedBadge';
import { CompareCheckboxControl } from '@/components/compare/CompareCheckboxControl';
import { FavoriteButton } from '@/components/favorites/FavoriteButton';
import { CompanyDirectoryConversionActions } from './CompanyDirectoryConversionActions';
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
      data-testid={'company-directory-row-' + data.id}
      className={cn(
        'group relative flex min-w-0 flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs transition-[border-color,box-shadow] hover:border-slate-300 hover:shadow-xs focus-within:ring-2 focus-within:ring-blue-500 sm:gap-2.5',
        className
      )}
    >
      {/* O link cobre o card sem interceptar os controles interativos. */}
      <Link
        href={href}
        title={data.name}
        aria-label={'Ver perfil de ' + data.name}
        onClick={handleRowClick}
        className="absolute inset-0 z-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      />

      {/* PDR PWA: identidade e conversões na parte superior; quebram em telas estreitas. */}
      <div
        data-testid="directory-card-top"
        className="pointer-events-none relative z-10 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-2"
      >
        <div className="flex min-w-[145px] flex-1 items-center gap-2.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-white">
            <CompanyLogo
              logoUrl={data.logo_url}
              name={data.name}
              size="sm"
              priority={index !== undefined && index < 4}
              badges={data.badges}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <h3 className="min-w-0 truncate text-[15px] font-semibold leading-5 text-slate-900 transition-colors group-hover:text-blue-600">
                {data.name}
              </h3>
              {data.verified && (
                <span
                  data-testid="verified-badge-wrapper"
                  className="pointer-events-auto relative z-10 inline-flex shrink-0 items-center"
                  onClick={(event) => event.stopPropagation()}
                >
                  <CompanyVerifiedBadge size="sm" className="h-4 w-4" />
                </span>
              )}
              {Boolean(company?.sponsored || data.sponsored) && (
                <span className="shrink-0 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                  Patrocinado
                </span>
              )}
            </div>

            <div
              data-testid="company-directory-reputation"
              className="mt-0.5 flex items-center gap-1 text-xs text-slate-500"
            >
              {hasReviews ? (
                <>
                  <Star
                    className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400"
                    aria-hidden="true"
                  />
                  <span className="font-semibold tabular-nums text-slate-900">
                    {score.toFixed(1)}
                  </span>
                  <span className="text-slate-400">({count})</span>
                </>
              ) : (
                <span className="text-slate-400">Sem avaliações</span>
              )}
            </div>
          </div>
        </div>

        <div
          data-testid="company-directory-primary-actions"
          className="pointer-events-auto relative z-10 ml-auto flex shrink-0 items-center"
        >
          <CompanyDirectoryConversionActions company={company} />
        </div>
      </div>

      {/* Localização secundária + favoritos/comparação: sempre abaixo do divisor. */}
      <div
        data-testid="directory-card-bottom"
        className="pointer-events-none relative z-10 flex min-w-0 items-center justify-between gap-1.5 border-t border-slate-200/80 pt-1.5"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {location && (
            <div
              className="flex min-w-0 items-center gap-1 text-xs text-slate-500"
              title={location}
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
              <span className="min-w-0 truncate">{location}</span>
            </div>
          )}
          {Boolean(company?.recommendation_reason?.label) && (
            <span className="truncate text-[11px] font-medium text-blue-600">
              {company.recommendation_reason.label}
            </span>
          )}
        </div>

        <div
          data-testid="company-directory-actions"
          className="pointer-events-auto relative z-10 flex shrink-0 items-center gap-0.5"
        >
          <FavoriteButton
            favoritableType="Company"
            favoritableId={data.id}
            source="directory_list"
            className="h-11 w-11 shrink-0 text-slate-400 hover:text-rose-500"
          />
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
