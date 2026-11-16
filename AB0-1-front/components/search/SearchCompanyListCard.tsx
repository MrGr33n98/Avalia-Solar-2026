'use client';

import Link from 'next/link';
import { Star, MapPin, CheckCircle, ChevronRight, Info, Globe } from 'lucide-react';
import { Company } from '@/lib/api';
import { CompanyLogo } from '@/components/CompanyLogo';
import { Button } from '@/components/ui/button';
import ComparisonToggleButton from '@/components/ComparisonToggleButton';
import { cn } from '@/lib/utils';
import { buildCompanyPath } from '@/lib/slug';
import { openLeadModal } from '@/lib/lead-engine';
import { QuoteCTA } from '@/components/quote/QuoteCTA';
import { canUsePaidConversion } from '@/lib/feature-access';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

interface SearchCompanyListCardProps {
  company: Company;
  className?: string;
}

export function SearchCompanyListCard({ company, className }: SearchCompanyListCardProps) {
  const rating = Number(company.rating_avg || company.average_rating || company.rating || 0);
  const ratingLabel = rating > 0 ? rating.toFixed(1) : 'Sem nota';
  const reviewCount = company.rating_count || company.reviews_count || company.total_reviews || 0;
  const href = buildCompanyPath(company.slug, company.name, company.id);
  const reviewsHref = `${href}#avaliacoes`;

  const location = [company.city, company.state].filter(Boolean).join(', ');
  const description =
    company.description ||
    company.about ||
    'Descrição ainda não informada pela empresa.';
  // Do not claim an SLA or operating region without real company data.
  const rawSla = (company as any).operations?.sla_label || (company as any).response_time_sla;
  const slaLabel = typeof rawSla === 'string' && rawSla.trim() ? rawSla.trim() : 'Não informado';
  const rawCoverage = (company as any).coverage;
  const coverageLabel =
    typeof rawCoverage === 'string' && rawCoverage.trim()
      ? rawCoverage
      : rawCoverage && typeof rawCoverage.label === 'string' && rawCoverage.label.trim()
        ? rawCoverage.label
        : 'Não informado';

  const canRequestQuote = canUsePaidConversion(company, 'quote');

  return (
    <article
      className={cn(
        'grid min-w-0 grid-cols-1 items-stretch overflow-hidden rounded-xl border border-[#dde1e6] bg-white shadow-[0_3px_14px_rgba(9,23,47,0.035)] transition-[border-color,box-shadow] duration-200 hover:shadow-[0_8px_24px_rgba(9,23,47,0.075)] hover:border-[#a6c8ff] lg:grid-cols-[minmax(260px,0.85fr)_minmax(0,1.15fr)]',
        className
      )}
    >
      {/* Left Column: Logo & Info */}
      <div className="flex min-w-0 flex-col justify-center border-b border-slate-100 p-4 lg:p-5 lg:border-r">
        <div className="flex items-center gap-4">
          <Link href={href} className="shrink-0">
            <CompanyLogo
              logoUrl={company.logo_url}
              name={company.name}
              size="lg"
              badges={company.badges}
              verifiedBadgeUrl={company.verified_badge_image_url || company.verified_badge_url}
              className="border border-slate-100 bg-white shadow-sm"
            />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Link href={href}>
                <h3 className="font-bold text-[#09172f] text-sm sm:text-base hover:text-[#0f62fe] transition-colors line-clamp-2">
                  {company.name}
                </h3>
              </Link>
              <Popover>
                <PopoverTrigger className="hover:text-blue-600 text-slate-400 p-0.5 shrink-0 transition-colors">
                  <Info className="w-3.5 h-3.5" />
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-white/95 backdrop-blur-md border border-slate-200/80 p-5 rounded-[1.75rem] shadow-xl text-xs text-slate-600 font-medium z-50">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CompanyLogo
                        logoUrl={company.logo_url}
                        name={company.name}
                        size="sm"
                        className="border border-slate-100 bg-white"
                      />
                      <div>
                        <div className="font-bold text-slate-900 text-sm leading-tight">
                          {company.name}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {company.founded_year ? `Fundada em ${company.founded_year}` : 'Fundação não informada'}
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {description}
                    </p>
                    <div className="border-t border-slate-100 pt-3 space-y-2 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Fundação</span>
                        <span className="font-bold text-slate-900">
                          {company.founded_year || 'Não informado'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Sede</span>
                        <span className="font-bold text-slate-900">
                          {company.city || 'Não informado'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-semibold">Site oficial</span>
                        {company.website ? (
                          <a
                            href={`/api/v1/outbound/redirect?company_id=${encodeURIComponent(String(company.id))}&source_context=search`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                          >
                            {company.website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                            <Globe className="w-3 h-3 text-blue-500" />
                          </a>
                        ) : (
                          <span className="font-bold text-slate-400">Não informado</span>
                        )}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="mt-1 flex items-center gap-2 text-[11px] sm:text-xs text-slate-500">
              <span className="flex items-center gap-1 font-bold text-slate-900">
                {rating > 0 && reviewCount > 0 ? <Star className="w-3.5 h-3.5 fill-slate-900 text-slate-900" /> : null}
                {rating > 0 && reviewCount > 0 ? ratingLabel : 'Sem nota'}
              </span>
              <span className="text-slate-300">|</span>
              <span>{reviewCount} {reviewCount === 1 ? 'avaliação' : 'avaliações'}</span>

            </div>

            <div className="mt-2 flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="line-clamp-1">{location || 'Localização não informada'}</span>
              <Popover>
                <PopoverTrigger className="hover:text-blue-600 text-slate-400 p-0.5 shrink-0 transition-colors">
                  <Info className="w-3.5 h-3.5" />
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-white/95 backdrop-blur-md border border-slate-200/80 p-5 rounded-[1.75rem] shadow-xl text-xs text-slate-600 font-medium z-50">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {location || 'Localização não informada'}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Unidade Principal / Sede
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] leading-relaxed text-slate-600">
                      {location ? `Sede informada: ${location}` : 'Localização não informada.'}
                      {' '}Consulte o perfil para conhecer os canais de contato disponíveis.
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Column 1: Description & Quick Features */}
      <div className="flex min-w-0 flex-col justify-center border-b border-slate-100 p-4 lg:p-5">
        <p className="line-clamp-3 break-words text-xs leading-relaxed text-slate-600 sm:text-sm">
          {description}
        </p>
        {coverageLabel !== 'Não informado' || slaLabel !== 'Não informado' ? (
          <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
            {coverageLabel !== 'Não informado' ? (
              <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                <span className="truncate">Cobertura: {coverageLabel}</span>
              </span>
            ) : null}
            {slaLabel !== 'Não informado' ? (
              <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                <span className="truncate">Respostas: {slaLabel}</span>
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Desktop: a single action rail avoids squeezing description into five columns.
          Keep the original comparison, review, quote and profile contracts intact. */}
      <div
        data-testid="search-card-desktop-actions"
        className="hidden min-w-0 gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 sm:px-5 lg:col-span-2 lg:flex lg:flex-wrap lg:items-center lg:justify-between"
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <ComparisonToggleButton
            company={company as any}
            variant="default"
            size="sm"
          />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-10 rounded-lg px-3 text-xs font-semibold text-blue-600 hover:bg-blue-50"
          >
            <Link href={reviewsHref}>
              <Star className="h-4 w-4" aria-hidden="true" />
              Avaliar
            </Link>
          </Button>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {canRequestQuote && (
            <QuoteCTA
              context="card"
              shortLabel="Solicitar orçamento"
              source="search-list-card"
              className="min-h-10"
              onRequest={() =>
                openLeadModal({
                  preferredCompanyId: company.id,
                  source: 'search-list-card',
                  type: 'quick',
                })
              }
            />
          )}
          <Button
            asChild
            variant={canRequestQuote ? 'outline' : 'default'}
            className={cn(
              'h-10 min-w-[126px] rounded-lg px-4 text-xs font-bold shadow-none',
              canRequestQuote
                ? 'border-blue-200 bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            <Link href={reviewCount > 0 ? reviewsHref : href}>
              {reviewCount > 0 ? `Ver avaliações ${reviewCount}` : 'Ver perfil'}
              <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Mobile footer: todas as ações numa barra inferior separada */}
      <div className="flex w-full border-t border-slate-100 bg-slate-50/50 lg:hidden">
        {canRequestQuote ? (
          // Com orçamento: [Comparar] [Avaliar] | [Solicitar orçamento (destaque)]
          <>
            <div className="flex flex-1 items-center justify-around divide-x divide-slate-100">
              <div className="flex-1 flex items-center justify-center py-1">
                <ComparisonToggleButton
                  company={company as any}
                  variant="default"
                  size="sm"
                />
              </div>
              <Button
                asChild
                variant="ghost"
                className="flex-1 h-11 rounded-none text-xs font-bold text-blue-600 hover:bg-blue-50 shadow-none gap-1.5"
              >
                <Link href={reviewsHref}>
                  <Star className="w-3.5 h-3.5 fill-blue-600" />
                  Avaliar
                </Link>
              </Button>
            </div>
            <Button
              onClick={() =>
                openLeadModal({
                  preferredCompanyId: company.id,
                  source: 'search-list-card-mobile',
                  type: 'quick',
                })
              }
              className="h-11 px-4 rounded-none bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-none gap-1.5 border-l border-blue-500 shrink-0"
            >
              Orçamento
            </Button>
          </>
        ) : (
          // Sem orçamento: [Comparar] [Avaliar] [Ver avaliações]
          <div className="flex w-full items-center justify-around divide-x divide-slate-100">
            <div className="flex-1 flex items-center justify-center py-1">
              <ComparisonToggleButton
                company={company as any}
                variant="default"
                size="sm"
              />
            </div>
            <Button
              asChild
              variant="ghost"
              className="flex-1 h-11 rounded-none text-xs font-bold text-blue-600 hover:bg-blue-50 shadow-none gap-1.5"
            >
              <Link href={reviewsHref}>
                <Star className="w-3.5 h-3.5 fill-blue-600" />
                Avaliar
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="flex-1 h-11 rounded-none font-bold text-xs text-blue-600 hover:bg-blue-50 shadow-none gap-1"
            >
              <Link href={reviewCount > 0 ? reviewsHref : href}>
                {reviewCount > 0 ? `Ver ${reviewCount}` : 'Ver perfil'} <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
