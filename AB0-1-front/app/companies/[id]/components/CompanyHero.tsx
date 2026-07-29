'use client';

import { OptimizedImage } from '@/components/ui/optimized-image';
import CompanyBannerPlaceholder from './CompanyBannerPlaceholder';
import { useRouter } from 'next/navigation';
import {
  MessageCircle,
  Share2,
  ArrowLeft,
  MapPin,
  Star,
  BadgeCheck,
  Diamond,
  ClipboardList,
} from 'lucide-react';
import ReviewCompanyButton from '@/components/company/ReviewCompanyButton';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import WhatsappButton from '@/components/WhatsappButton';
import { Company } from '@/lib/api';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { openLeadModal, resolveWizardCategoryId } from '@/lib/lead-engine';
import { track } from '@/lib/analytics/lazy';
import { trackCTAClick, trackCompanyProfileView } from '@/lib/analytics/track-cta';
import { getFullImageUrl } from '@/utils/image';
import { useHoverIntent } from '@/lib/analytics/hooks/useIntentTracking';
import { isFeatureEnabled } from '@/lib/feature-access';
import { useAuth } from '@/contexts/AuthContext';
import { openSignupGate } from '@/lib/signup-gate';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const IMAGE_FILE_EXT_RE = /\.(png|jpe?g|webp|gif|avif|bmp|svg)(\?|#|$)/i;
const ACTIVE_STORAGE_RE = /\/rails\/active_storage\//i;

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface CompanyHeroProps {
  company: Company;
  companyStats: {
    rating: number;
    reviewCount: number;
  };
  bannerUrl: string | null;
  bannerError: boolean;
  setBannerError: (error: boolean) => void;
  logoUrl: string | null;
  logoError: boolean;
  setLogoError: (error: boolean) => void;
  canRequestQuote?: boolean;
  ctaEnabled: boolean;
  ctaUrl: string | null;
  tabs?: TabItem[];
  activeTab?: string;
  onTabChange?: (value: string) => void;
}

export default function CompanyHero({
  company,
  companyStats,
  bannerUrl,
  bannerError,
  setBannerError,
  logoUrl,
  logoError,
  setLogoError,
  canRequestQuote,
  ctaEnabled,
  ctaUrl,
  tabs = [],
  activeTab: _activeTab = 'overview',
  onTabChange,
}: CompanyHeroProps) {
  const router = useRouter();
  const [isSharing, setIsSharing] = useState(false);
  const [badgeImageError, setBadgeImageError] = useState(false);
  const showBannerPlaceholder = !bannerUrl || bannerError;
  const { user, isAuthenticated } = useAuth();
  const canUseBuyerChat = isAuthenticated && user?.role === 'review';
  const directChatAvailable =
    company.p2p_chat_enabled === true ||
    (company as Company & { actions?: { p2p_chat_enabled?: boolean } }).actions
      ?.p2p_chat_enabled === true ||
    (Boolean(company.feature_access) && isFeatureEnabled(company.feature_access, 'p2p_chat'));
  const directChatVisible = directChatAvailable;
  const directChatEnabled = canUseBuyerChat;
  const directChatReturnTo = `/chat?company_id=${company.id}`;
  const wizardCategoryId = resolveWizardCategoryId(company);
  const locationLabel = [company.city, company.state].filter(Boolean).join(', ');
  const ratingLabel = Number(companyStats.rating).toFixed(1);
  const intentCompanyId = String(company.id);
  const heroWhatsappHoverIntent = useHoverIntent(intentCompanyId, 'whatsapp', 800, {
    signalCategory: 'contact_intent',
    elementSelector: 'company-hero-whatsapp-cta',
    metadata: {
      source: 'company_hero',
    },
  });
  const heroQuoteHoverIntent = useHoverIntent(intentCompanyId, 'quote_button', 800, {
    signalCategory: 'contact_intent',
    elementSelector: 'company-hero-quote-cta',
    metadata: {
      source: 'company_hero',
    },
  });

  const heroBadgeUrl = useMemo(() => {
    const isValidImageUrl = (url: string) =>
      IMAGE_FILE_EXT_RE.test(url) || ACTIVE_STORAGE_RE.test(url);
    const companyBadges = Array.isArray(company.badges) ? company.badges : [];

    const badgeImageFromBadges = companyBadges
      .map((badge) => badge?.image_url)
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .map((url) => getFullImageUrl(url))
      .find((url) => isValidImageUrl(url));
    if (badgeImageFromBadges) return badgeImageFromBadges;

    const fallbackVerifiedBadge = [company.verified_badge_image_url, company.verified_badge_url]
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .map((url) => getFullImageUrl(url))
      .find((url) => isValidImageUrl(url) && !url.toLowerCase().endsWith('.svg'));

    return fallbackVerifiedBadge || null;
  }, [company.badges, company.verified_badge_image_url, company.verified_badge_url]);

  useEffect(() => {
    setBadgeImageError(false);

    trackCompanyProfileView(
      String(company.id),
      company.name,
      company.category_id ? String(company.category_id) : undefined
    );
  }, [company.id, company.name, company.category_id, heroBadgeUrl]);

  const handleShare = async () => {
    track('company_share_click', {
      company_id: company.id,
      company_name: company.name,
      element_type: 'button',
      action_type: 'click',
    });
    setIsSharing(true);
    try {
      if (navigator.share) {
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

  return (
    <div className="relative w-full">
      {/* Botão Voltar */}
      <div className="mb-3">
        <Button
          variant="ghost"
          size="sm"
          className="group h-auto p-0 text-xs font-medium text-slate-500 transition-colors hover:bg-transparent hover:text-slate-900"
          onClick={() => {
            track('company_back_click', {
              company_id: company.id,
              company_name: company.name,
              element_type: 'button',
              action_type: 'click',
            });
            router.back();
          }}
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
          Voltar
        </Button>
      </div>

      {/* Container principal: banner + identidade + tabs */}
      <section
        data-company-layout="standard-hero"
        className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]"
      >
        {/* 1. HERO BANNER */}
        <div className="relative h-[160px] w-full overflow-hidden rounded-t-2xl bg-slate-950 sm:h-[190px] md:h-[230px] lg:h-[230px]">
          {/* Background Blur Fill Layer */}
          {!showBannerPlaceholder && (
            <OptimizedImage
              src={bannerUrl}
              alt=""
              fill
              aria-hidden="true"
              className="object-cover opacity-40 blur-xl scale-110"
              containerClassName="absolute inset-0 h-full w-full pointer-events-none"
            />
          )}

          {/* Banner Image */}
          {showBannerPlaceholder ? (
            <CompanyBannerPlaceholder alt="Banner ilustrativo Avalia Solar" priority />
          ) : (
            <OptimizedImage
              src={bannerUrl}
              alt={company.name}
              fill
              priority
              quality={90}
              imageContext="company-banner"
              entityName={company.name}
              locationLabel={locationLabel}
              className="object-cover object-center"
              containerClassName="h-full w-full"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              fallbackSrc="/assets/avalia-solar-icon-pack/avalia-solar-banner-v2.png"
              useAspectRatio={false}
              width={1600}
              height={900}
              onError={() => setBannerError(true)}
            />
          )}

          {/* Overlay sutil — apenas para transição visual, sem texto sobreposto */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />

          {showBannerPlaceholder && (
            <div className="pointer-events-none absolute inset-0 ring-1 ring-slate-300/60">
              <span className="absolute top-3 right-3 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-medium text-slate-600 backdrop-blur">
                Imagem ilustrativa
              </span>
            </div>
          )}
        </div>

        {/* 2. IDENTIDADE DA EMPRESA — logo atravessa a borda do banner */}
        <div className="relative border-t border-slate-200 bg-white px-4 pb-5 pt-0 sm:px-6">
          <div className="flex flex-col gap-4 pt-4 sm:gap-5 sm:pt-5 lg:flex-row lg:items-center lg:justify-between lg:pt-6">
            {/* Identidade: logo, nome, sinais de confiança, localização e nota */}
            <div className="min-w-0 flex-1">
              {/* Lado Esquerdo: Logo + Informações — items-center alinha com a logo independente de quantas linhas de texto existem (item 4) */}
              <div className="flex min-w-0 flex-1 items-start gap-4 sm:items-center sm:gap-5">
                {/* Logo e selo integrados à mesma moldura */}
                <div className="relative shrink-0 -translate-y-8 overflow-visible sm:-translate-y-10 lg:-translate-y-12">
                  <div className="relative h-[88px] w-[88px] rounded-[18px] border border-slate-300 bg-white p-1.5 shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:h-[104px] sm:w-[104px] sm:rounded-[20px]">
                    <div className="relative h-full w-full overflow-hidden rounded-[14px] bg-white sm:rounded-[16px]">
                      <OptimizedImage
                        src={!logoUrl || logoError ? '/images/logo-placeholder.svg' : logoUrl}
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
                    </div>
                  </div>

                  {/* Selo preso ao canto superior esquerdo da logo, como na referência. */}
                  {heroBadgeUrl && !badgeImageError && (
                    <div
                      className="pointer-events-none absolute left-0 top-0 z-30 h-9 w-8 -translate-x-[18%] -translate-y-[32%] overflow-visible bg-transparent drop-shadow-[0_0_1px_rgba(255,255,255,1)] drop-shadow-[0_0_1.5px_rgba(203,213,225,0.95)] drop-shadow-[0_3px_6px_rgba(15,23,42,0.25)] sm:h-11 sm:w-9"
                      title="Selo de conquista"
                    >
                      <OptimizedImage
                        src={heroBadgeUrl}
                        alt="Selo de conquista"
                        fill
                        sizes="(max-width: 640px) 32px, 36px"
                        objectFit="contain"
                        className="bg-transparent p-0"
                        containerClassName="h-full w-full overflow-visible bg-transparent"
                        onError={() => setBadgeImageError(true)}
                      />
                    </div>
                  )}
                </div>

                {/* Informações da empresa */}
                <div className="min-w-0 flex-1 pt-1 sm:pt-2">
                  {/* Nome + verificado + premium (mobile, inline) */}
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h1 className="min-w-0 line-clamp-2 text-[22px] font-bold leading-tight tracking-[-0.02em] text-slate-950 sm:text-2xl">
                      {company.name}
                    </h1>
                    {company.verified && (
                      <BadgeCheck
                        className="h-5 w-5 shrink-0 fill-emerald-100 text-emerald-600 sm:h-[22px] sm:w-[22px]"
                        aria-label="Empresa verificada"
                      />
                    )}
                    {/* Premium é um atributo do perfil e permanece junto ao nome. */}
                    {company.verified && (
                      <div className="inline-flex h-6 w-fit shrink-0 items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2 text-[10px] font-bold tracking-[0.04em] text-violet-700">
                        <Diamond className="h-3 w-3" />
                        PREMIUM
                      </div>
                    )}
                  </div>

                  {/* Localização */}
                  {locationLabel && (
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                      <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                      <span>{locationLabel}</span>
                    </div>
                  )}

                  {/* Nota + avaliações */}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                    <span className="inline-flex items-center gap-1 font-bold text-slate-950">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" strokeWidth={0} />
                      {ratingLabel}
                    </span>
                    <span className="h-4 w-px bg-slate-200" aria-hidden="true" />
                    <span className="text-slate-500">
                      {companyStats.reviewCount}{' '}
                      {companyStats.reviewCount === 1 ? 'avaliação' : 'avaliações'}
                    </span>
                  </div>

                  {/* Indicador de atendimento online — linha separada, discreto */}
                  {directChatVisible && (
                    <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                      </span>
                      Atendimento online
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* Ações principais no mesmo eixo visual da identidade. */}
            <div className="flex w-full flex-wrap items-center justify-start gap-3 border-t border-slate-100 pt-4 lg:w-auto lg:flex-nowrap lg:justify-end lg:border-0 lg:pt-0">
              {/* CTA Primário: Solicitar orçamento */}
              {canRequestQuote ? (
                <Button
                  size="default"
                  className="h-12 shrink-0 whitespace-nowrap rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(37,99,235,0.22)] transition hover:bg-blue-700 hover:shadow-[0_6px_16px_rgba(37,99,235,0.28)]"
                  onMouseEnter={heroQuoteHoverIntent.onMouseEnter}
                  onMouseLeave={heroQuoteHoverIntent.onMouseLeave}
                  onClick={async () => {
                    await trackCTAClick({
                      ctaType: 'quote',
                      ctaLocation: 'hero',
                      companyId: String(company.id),
                      companyName: company.name,
                    });
                    openLeadModal({
                      preferredCompanyId: company.id,
                      categoryId: wizardCategoryId,
                      source: 'company-hero',
                      type: 'wizard',
                    });
                  }}
                >
                  <ClipboardList className="mr-1.5 h-4 w-4" />
                  Solicitar orçamento
                </Button>
              ) : null}

              {/* Avaliar empresa */}
              <ReviewCompanyButton
                company={company}
                label="Avaliar empresa"
                compactLabel="Avaliar empresa"
                className="h-12 shrink-0 whitespace-nowrap rounded-xl border border-blue-300 bg-white px-4 text-sm font-semibold text-blue-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-50"
              />

              {/* WhatsApp */}
              {ctaEnabled && ctaUrl && (
                <div {...heroWhatsappHoverIntent}>
                  <WhatsappButton
                    size="default"
                    enabled
                    href={ctaUrl}
                    className="h-12 shrink-0 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                    label="WhatsApp"
                    companyId={company.id}
                    requireSignup
                    signupGateSource="contact_reveal"
                    signupGateTitle="Crie sua conta para falar no WhatsApp"
                    signupGateDescription="Libere o contato direto desta empresa e volte exatamente para o mesmo lugar depois do cadastro."
                  />
                </div>
              )}

              {/* Chat — botão verde simples */}
              {directChatVisible && (
                <Button
                  size="default"
                  className="h-12 shrink-0 whitespace-nowrap rounded-xl bg-emerald-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                  onClick={() => {
                    track('company_direct_chat_click', {
                      company_id: company.id,
                      company_name: company.name,
                      authenticated: isAuthenticated,
                    });
                    if (directChatEnabled) {
                      router.push(directChatReturnTo);
                      return;
                    }
                    openSignupGate({
                      source: 'direct_chat',
                      returnTo: directChatReturnTo,
                      title: 'Crie sua conta para falar com esta empresa',
                      description:
                        'O chat direto fica disponível para usuários compradores cadastrados.',
                    });
                  }}
                >
                  <MessageCircle className="mr-1.5 h-4 w-4" />
                  Chat
                </Button>
              )}

              {/* Compartilhar — ação compacta, sem competir com os CTAs */}
              <Button
                variant="outline"
                size="default"
                className="h-12 w-12 shrink-0 rounded-xl border-slate-200 bg-white p-0 text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                onClick={handleShare}
                disabled={isSharing}
                aria-label="Compartilhar empresa"
              >
                <Share2 className="h-5 w-5 text-slate-600" />
              </Button>
            </div>
          </div>
        </div>

        {/* 3. NAVEGAÇÃO POR ABAS */}
        {tabs.length > 0 && onTabChange && (
          <div className="border-t border-slate-200 bg-white">
            <ScrollArea className="w-full">
              <div
                className="flex h-14 min-w-max items-stretch justify-start gap-6 px-4 sm:px-6 lg:px-7"
                role="navigation"
                aria-label="Seções do perfil da empresa"
              >
                {tabs.map((tab) => {
                  const TabIcon = tab.icon;
                  const isActive = _activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => onTabChange(tab.id)}
                      aria-pressed={isActive}
                      className={cn(
                        'relative h-14 rounded-none border-0 bg-transparent px-0 text-sm font-medium shadow-none',
                        'text-slate-500 hover:text-slate-900',
                        'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-center after:scale-x-0 after:bg-blue-600 after:transition-transform',
                        isActive && 'bg-transparent text-slate-950 shadow-none after:scale-x-100'
                      )}
                    >
                      <TabIcon className="mr-2 h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}
      </section>
    </div>
  );
}
