'use client';

import { OptimizedImage } from '@/components/ui/optimized-image';
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
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
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
        <div className="relative h-[190px] w-full overflow-hidden rounded-t-2xl bg-slate-950 sm:h-[230px] lg:h-[300px] xl:h-[320px]">
          {/* Background Blur Fill Layer */}
          <OptimizedImage
            src={!bannerUrl || bannerError ? '/images/banner-avalia-solar.png' : bannerUrl}
            alt=""
            fill
            aria-hidden="true"
            className="object-cover opacity-40 blur-xl scale-110"
            containerClassName="absolute inset-0 h-full w-full pointer-events-none"
            unoptimized={!bannerUrl || bannerError}
          />

          {/* Banner Image */}
          <OptimizedImage
            src={!bannerUrl || bannerError ? '/images/banner-avalia-solar.png' : bannerUrl}
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
            fallbackSrc="/images/banner-avalia-solar.png"
            useAspectRatio={false}
            width={1600}
            height={900}
            unoptimized={!bannerUrl || bannerError}
            onError={() => setBannerError(true)}
          />

          {/* Overlay sutil — apenas para transição visual, sem texto sobreposto */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />

          {(!bannerUrl || bannerError) && (
            <div className="pointer-events-none absolute inset-0 ring-1 ring-slate-300/60">
              <span className="absolute top-3 right-3 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-medium text-slate-600 backdrop-blur">
                Imagem ilustrativa
              </span>
            </div>
          )}
        </div>

        {/* 2. IDENTIDADE DA EMPRESA — logo atravessa a borda do banner */}
        <div className="relative border-t border-slate-200 bg-white px-4 pb-5 pt-4 sm:px-6 sm:pt-5">
          {/* Sem gap no wrapper: o espaçamento entre linha 1 e linha 2 vem só do pt-4 do divisor (item 1) */}
          <div className="flex flex-col">
            {/* Linha 1 — Logo + Nome/Info + Selo Premium (sem os botões) */}
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              {/* Lado Esquerdo: Logo + Informações — items-center alinha com a logo independente de quantas linhas de texto existem (item 4) */}
              <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-5">
                {/* Logo e selo integrados à mesma moldura */}
                <div className="relative shrink-0 overflow-visible">
                  <div className="relative h-[84px] w-[84px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:h-24 sm:w-24">
                    <OptimizedImage
                      src={!logoUrl || logoError ? '/images/logo-placeholder.svg' : logoUrl}
                      alt={company.name}
                      fill
                      priority
                      imageContext="company-logo"
                      entityName={company.name}
                      locationLabel={locationLabel}
                      objectFit="contain"
                      className="p-2"
                      containerClassName="absolute inset-0 h-full w-full"
                      fallbackSrc="/images/logo-placeholder.svg"
                      onError={() => setLogoError(true)}
                    />
                  </div>

                  {/* Selo preso ao canto da moldura, com sobreposição discreta */}
                  {heroBadgeUrl && !badgeImageError && (
                    <div
                      className="absolute right-1 top-1 z-30 h-10 w-10 translate-x-[28%] -translate-y-[28%] overflow-visible bg-transparent p-0 drop-shadow-[0_2px_5px_rgba(15,23,42,0.16)] sm:h-11 sm:w-11"
                      title="Selo de conquista"
                    >
                      <OptimizedImage
                        src={heroBadgeUrl}
                        alt="Selo de conquista"
                        fill
                        sizes="44px"
                        objectFit="contain"
                        className="p-0"
                        containerClassName="h-full w-full overflow-visible bg-transparent"
                        onError={() => setBadgeImageError(true)}
                      />
                    </div>
                  )}
                </div>

                {/* Informações da empresa */}
                <div className="min-w-0 flex-1">
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
                    {/* Premium inline — só no mobile, pra não ficar órfão abaixo da logo (item 2) */}
                    {company.verified && (
                      <div className="inline-flex h-6 w-fit shrink-0 items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2 text-[10px] font-bold tracking-[0.04em] text-violet-700 sm:hidden">
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

              {/* Badge PREMIUM — desktop/tablet, canto direito (item 2: escondido no mobile, a versão inline acima assume) */}
              {company.verified && (
                <div className="hidden h-7 w-fit shrink-0 items-center gap-1.5 self-start rounded-full border border-violet-200 bg-violet-50 px-2.5 text-[11px] font-bold tracking-[0.04em] text-violet-700 lg:inline-flex">
                  <Diamond className="h-3.5 w-3.5" />
                  PREMIUM
                </div>
              )}
            </div>

            {/* Linha 2 — Ações, sempre em linha própria abaixo da identidade, sempre alinhadas à esquerda (item 6) */}
            <div className="flex w-full flex-wrap items-center justify-start gap-2 border-t border-slate-100 pt-4 lg:justify-end lg:border-0 lg:pt-0">
              {/* CTA Primário: Solicitar orçamento */}
              {canRequestQuote ? (
                <Button
                  size="default"
                  className="h-10 shrink-0 whitespace-nowrap rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(37,99,235,0.22)] transition hover:bg-blue-700 hover:shadow-[0_6px_16px_rgba(37,99,235,0.28)]"
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

              {/* WhatsApp */}
              {ctaEnabled && ctaUrl && (
                <div {...heroWhatsappHoverIntent}>
                  <WhatsappButton
                    size="default"
                    enabled
                    href={ctaUrl}
                    className="h-10 shrink-0 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
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
                  className="h-10 shrink-0 whitespace-nowrap rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
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

              {/* Avaliar empresa (quando não pode solicitar orçamento) */}
              {!canRequestQuote && (
                <ReviewCompanyButton
                  company={company}
                  compactLabel="Avaliar empresa"
                  className="h-10 shrink-0 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                />
              )}

              {/* Compartilhar — ícone em mobile, label em desktop */}
              <Button
                variant="outline"
                size="default"
                className="h-10 shrink-0 whitespace-nowrap rounded-lg border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                onClick={handleShare}
                disabled={isSharing}
                aria-label="Compartilhar empresa"
              >
                <Share2 className="h-4 w-4 text-slate-400 lg:mr-1.5" />
                <span className="hidden lg:inline">Compartilhar</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 3. NAVEGAÇÃO POR ABAS */}
        {tabs.length > 0 && onTabChange && (
          <div className="border-t border-slate-200 bg-white">
            <ScrollArea className="w-full">
              <TabsList className="h-14 min-w-max justify-start gap-6 rounded-none bg-transparent px-4 sm:px-6 lg:px-7">
                {tabs.map((tab) => {
                  const TabIcon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={cn(
                        'relative h-14 rounded-none border-0 bg-transparent px-0 text-sm font-medium shadow-none',
                        'text-slate-500 hover:text-slate-900',
                        'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-center after:scale-x-0 after:bg-blue-600 after:transition-transform',
                        'data-[state=active]:bg-transparent data-[state=active]:text-slate-950 data-[state=active]:shadow-none',
                        'data-[state=active]:after:scale-x-100'
                      )}
                    >
                      <TabIcon className="mr-2 h-4 w-4" />
                      {tab.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}
      </section>
    </div>
  );
}
