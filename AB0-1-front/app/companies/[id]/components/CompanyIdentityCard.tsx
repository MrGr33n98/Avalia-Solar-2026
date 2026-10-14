'use client';

import { useMemo, useState } from 'react';
import { ReactNode } from 'react';
import { MapPin, Star, BadgeCheck, Truck, Calendar, Globe, ExternalLink, Heart, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Company } from '@/lib/api';
import Image from 'next/image';
import { getFullImageUrl } from '@/utils/image';
import { useFavorites } from '@/hooks/useFavorites';
import { track } from '@/lib/analytics/lazy';
import { cn } from '@/lib/utils';

import CompanyViewCounter from './CompanyViewCounter';
import { CompanyVerifiedBadge } from '@/components/company/CompanyVerifiedBadge';

interface CompanyIdentityCardProps {
  company: Company;
  companyStats: {
    rating: string;
    reviewCount: number;
  };
  logoUrl: string | null;
  logoError: boolean;
  setLogoError: (error: boolean) => void;
  children?: ReactNode;
}

export default function CompanyIdentityCard({
  company,
  companyStats,
  logoUrl,
  logoError,
  setLogoError,
  children,
}: CompanyIdentityCardProps) {
  const [badgeImageError, setBadgeImageError] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const companyIdNum = Number(company.id);
  const isFav = isFavorite(companyIdNum);

  const handleToggleFavorite = () => {
    track('company_favorite_click', {
      company_id: company.id,
      company_name: company.name,
      action: isFav ? 'remove' : 'add',
    });
    toggleFavorite(companyIdNum);
    if (isFav) {
      toast.info('Empresa removida dos favoritos.');
    } else {
      toast.success('Empresa adicionada aos favoritos!');
    }
  };

  const handleShare = async () => {
    track('company_share_click', {
      company_id: company.id,
      company_name: company.name,
      element_type: 'button',
      action_type: 'click',
    });
    setIsSharing(true);
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: company.name,
          text: company.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copiado para a área de transferência!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsSharing(false);
    }
  };
  const hasLogo = Boolean(logoUrl) && !logoError;
  const locationLabel = [company.city, company.state].filter(Boolean).join(', ');

  const companyBadges = Array.isArray(company.badges) ? company.badges : [];
  const badgeToRender = companyBadges.find((b) => b && b.image_url);
  const badgeImageUrl = badgeToRender?.image_url ? getFullImageUrl(badgeToRender.image_url) : null;

  const initialLetter = useMemo(() => {
    return company.name ? company.name.charAt(0).toUpperCase() : 'A';
  }, [company.name]);

  const isVerified = Boolean(
    company.verified || company.trust?.verification_status === 'verified'
  );


  const cleanWebsite = useMemo(() => {
    if (!company.website) return null;
    return company.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  }, [company.website]);

  const websiteHref = useMemo(() => {
    if (!company.website) return undefined;
    return company.website.startsWith('http') ? company.website : `https://${company.website}`;
  }, [company.website]);

  const coverageLabel = useMemo(() => {
    const extCompany = company as unknown as {
      coverage_national?: boolean;
      coverage_states?: string[] | string;
      coverage_cities?: string[] | string;
    };
    const serviceAreas = company.service_areas || [];
    const national = serviceAreas.some((area) => area.coverage_type === 'national') || Boolean(extCompany.coverage_national);
    if (national) return 'Atua em todo o Brasil';

    const statesList: string[] = Array.isArray(extCompany.coverage_states)
      ? extCompany.coverage_states
      : typeof extCompany.coverage_states === 'string'
      ? [extCompany.coverage_states]
      : serviceAreas.filter((a) => a.coverage_type === 'state').map((a) => a.state_code).filter((s): s is string => Boolean(s));

    if (statesList.length > 0) return `Atende ${statesList.slice(0, 3).join(', ')}`;

    const citiesList: string[] = Array.isArray(extCompany.coverage_cities)
      ? extCompany.coverage_cities
      : typeof extCompany.coverage_cities === 'string'
      ? [extCompany.coverage_cities]
      : serviceAreas.filter((a) => a.coverage_type === 'city').map((a) => a.city_name).filter((c): c is string => Boolean(c));

    if (citiesList.length > 0) return `Atende ${citiesList.slice(0, 2).join(', ')}`;
    if (company.city && company.state) return 'Atuação regional';
    return null;
  }, [company]);

  const numericRating = Number.parseFloat(companyStats.rating);
  const hasReviews = companyStats.reviewCount > 0;
  const ratingFormatted =
    hasReviews && !Number.isNaN(numericRating) && numericRating > 0 ? numericRating.toFixed(1) : null;

  return (
    <section
      id="company-identity-card"
      aria-label="Card da empresa com ações"
      className="relative overflow-visible bg-white px-3 min-[412px]:px-3.5 pb-3 pt-0 sm:px-6 sm:pb-4 lg:px-7"
    >
      {/* Silhueta com Curva Côncava na Shelf da Logo/Nome (Estilo WEG) */}
      <div className="pointer-events-none absolute -top-6 left-0 z-20 hidden h-6 lg:flex lg:items-end px-6">
        <div className="flex items-end">
          <div className="h-6 w-44 bg-white rounded-tl-2xl" />
          <svg viewBox="0 0 36 24" className="h-6 w-9 text-white fill-current shrink-0" preserveAspectRatio="none" aria-hidden="true">
            <path d="M 0,0 C 18,0 18,24 36,24 L 0,24 Z" />
          </svg>
        </div>
      </div>

      {/* Linha Principal de Identidade: Logo + Nome/Badges (Esquerda) + Ações (Direita) */}
      <div className="flex w-full items-start justify-between gap-2 sm:gap-4">
        {/* Lado Esquerdo: Logo + Nome + Badges */}
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4 lg:gap-5">
          {/* Box da Logo (Overlapping no Banner) */}
          <div className="relative shrink-0 -mt-7 sm:-mt-11 lg:-mt-15 overflow-visible z-30">
            <div className="relative h-[68px] w-[68px] rounded-2xl border-2 border-white bg-white p-1 shadow-md sm:h-[88px] sm:w-[88px] lg:h-[100px] lg:w-[100px]">
              <div className="relative h-full w-full overflow-hidden rounded-xl bg-white flex items-center justify-center">
                {hasLogo ? (
                  <OptimizedImage
                    src={logoUrl!}
                    alt={company.name}
                    fill
                    priority
                    imageContext="company-logo"
                    entityName={company.name}
                    locationLabel={locationLabel}
                    objectFit="contain"
                    className="p-0"
                    containerClassName="absolute inset-0 h-full w-full"
                    fallbackSrc="/images/logo-placeholder.svg"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="flex h-full w-full select-none items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl font-black text-white sm:text-2xl">
                    {initialLetter}
                  </div>
                )}
              </div>
            </div>
            {badgeImageUrl && !badgeImageError && (
              <div
                className="pointer-events-none absolute left-0 top-0 z-40 h-8 w-7 -translate-x-[18%] -translate-y-[28%] overflow-visible bg-transparent drop-shadow-[0_2px_4px_rgba(15,23,42,0.25)] sm:h-10 sm:w-8"
                title={badgeToRender?.name || 'Selo de conquista'}
              >
                <Image
                  src={badgeImageUrl}
                  alt={badgeToRender?.name || 'Selo'}
                  fill
                  className="object-contain bg-transparent"
                  sizes="(max-width: 640px) 28px, 36px"
                  unoptimized
                  onError={() => setBadgeImageError(true)}
                />
              </div>
            )}
          </div>

          {/* Header: Nome + Verificado */}
          <div className="min-w-0 flex-1 pt-1 sm:pt-2">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
              <h1 className="truncate text-lg font-extrabold leading-tight tracking-tight text-slate-950 sm:text-2xl">
                {company.name}
              </h1>
              {isVerified && <CompanyVerifiedBadge size="lg" />}
            </div>
          </div>
        </div>

        {/* Lado Direito: Botões de Ação Topo Direito (Favoritar e Compartilhar) Ancorados na Borda Direita */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 pt-1 sm:pt-2">
          <button
            type="button"
            onClick={handleToggleFavorite}
            aria-label={isFav ? 'Remover dos favoritos' : 'Favoritar empresa'}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl border transition-colors sm:h-10 sm:w-10',
              isFav
                ? 'border-red-200 bg-red-50 text-red-600'
                : 'border-slate-200/90 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
            )}
          >
            <Heart className={cn('h-4 w-4', isFav ? 'fill-current text-red-600' : 'text-slate-600')} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={isSharing}
            aria-label="Compartilhar empresa"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 sm:h-10 sm:w-10"
          >
            <Share2 className="h-4 w-4 text-slate-600" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Linha 2: Metadados (Esquerda) + CTA Shelf (Direita no Desktop) */}
      <div className="mt-1 flex flex-col gap-2 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
        {/* Lado Esquerdo: Metadados */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="mt-1 space-y-1.5 w-full">
            {/* Descrição curta */}
            {(company.description || company.about) && (
              <p className="line-clamp-2 text-xs font-medium text-slate-500 max-w-2xl leading-snug">
                {company.description || company.about}
              </p>
            )}

            {/* Linha 1 de Metadados: Localização, Atuação e Fundação */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-slate-600 sm:text-xs">
              {locationLabel && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                  <span className="truncate">{locationLabel}</span>
                </div>
              )}

              {locationLabel && (coverageLabel || company.founded_year) && (
                <span className="text-slate-300 select-none" aria-hidden="true">·</span>
              )}

              {coverageLabel && (
                <div className="flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                  <span>{coverageLabel}</span>
                </div>
              )}

              {coverageLabel && company.founded_year && (
                <span className="text-slate-300 select-none" aria-hidden="true">·</span>
              )}

              {company.founded_year && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                  <span>Fundada em {company.founded_year}</span>
                </div>
              )}
            </div>

            {/* Linha 2 de Metadados: Website, Avaliações e Visualizações */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-medium text-slate-500 sm:text-xs">
              {cleanWebsite && websiteHref && (
                <>
                  <div className="flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5 text-blue-600 shrink-0" aria-hidden="true" />
                    <a
                      href={websiteHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-blue-600 hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>{cleanWebsite}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                  <span className="text-slate-300 select-none" aria-hidden="true">·</span>
                </>
              )}

              {hasReviews && ratingFormatted ? (
                <div className="flex items-center gap-1 font-bold text-slate-950">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" strokeWidth={0} aria-hidden="true" />
                  <span>{ratingFormatted}</span>
                  <span className="font-normal text-slate-500">
                    ({companyStats.reviewCount})
                  </span>
                </div>
              ) : (
                <span>Sem avaliações · Seja o primeiro</span>
              )}

              <span className="text-slate-300 select-none" aria-hidden="true">·</span>
              <CompanyViewCounter companyId={company.id} />
            </div>
          </div>
        </div>

        {/* Lado Direito: CTA Shelf Estilo WEG (Todos os CTAs juntos abaixo da curva) */}
        {children && (
          <div className="relative w-full shrink-0 pt-2 lg:w-auto lg:pt-0">
            {/* Wrapper Desktop com a Curva Côncava na borda esquerda da Shelf */}
            <div className="relative hidden lg:block">
              {/* SVG Curva Côncava (Subida suave do banner para a Shelf de CTAs) */}
              <div className="absolute -left-9 top-0 h-7 w-9 pointer-events-none z-10">
                <svg viewBox="0 0 36 28" className="h-7 w-9 text-white fill-current shrink-0" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M 0,28 C 18,28 18,0 36,0 L 36,28 Z" />
                </svg>
              </div>

              {/* Shelf Branca de CTAs elevada com cantos arredondados no topo */}
              <div className="relative z-20 bg-white pt-2 pb-1.5 pl-2 pr-1 rounded-t-2xl lg:rounded-tr-2xl">
                {children}
              </div>
            </div>

            {/* Layout Mobile / Tablet */}
            <div className="block lg:hidden">
              {children}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
