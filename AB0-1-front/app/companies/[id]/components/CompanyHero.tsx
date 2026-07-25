'use client';

import { OptimizedImage } from '@/components/ui/optimized-image';
import { useRouter } from 'next/navigation';
import { MessageCircle, Share2, ArrowLeft, MapPin, Star, BadgeCheck } from 'lucide-react';
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
    (company as any)?.actions?.p2p_chat_enabled === true ||
    (Boolean(company.feature_access) && isFeatureEnabled(company.feature_access, 'p2p_chat'));
  const directChatVisible = directChatAvailable;
  const directChatEnabled = canUseBuyerChat;
  const directChatReturnTo = `/chat?company_id=${company.id}`;
  const wizardCategoryId = resolveWizardCategoryId(company);
  const locationLabel = [company.city, company.state].filter(Boolean).join(', ');
  const ratingLabel = `${Number(companyStats.rating).toFixed(1)}/5.0`;
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

    // Track company profile view on mount
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
      <section className="rounded-2xl border border-slate-200 bg-transparent shadow-sm">
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

          {/* Gradient overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/5" />

          {(!bannerUrl || bannerError) && (
            <div className="pointer-events-none absolute inset-0 ring-1 ring-slate-300/60">
              <span className="absolute top-3 right-3 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-medium text-slate-600 backdrop-blur">
                Imagem ilustrativa
              </span>
            </div>
          )}
        </div>

        {/* 2. IDENTIDADE DA EMPRESA - logo atravessa a borda do banner */}
        <div className="relative px-4 pb-4 pt-0 sm:px-5 sm:pb-5 lg:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* Lado Esquerdo: Logo + Dados */}
            <div className="flex items-start gap-4 min-w-0">
              {/* Logo - atravessa a linha inferior do banner (~30% acima) */}
              <div className="relative -mt-8 shrink-0 overflow-visible sm:-mt-9 lg:-mt-10">
                <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 shadow-sm sm:h-24 sm:w-24 lg:h-[104px] lg:w-[104px]">
                  <OptimizedImage
                    src={!logoUrl || logoError ? '/images/logo-placeholder.svg' : logoUrl}
                    alt={company.name}
                    fill
                    priority
                    imageContext="company-logo"
                    entityName={company.name}
                    locationLabel={locationLabel}
                    objectFit="cover"
                    className="p-0"
                    containerClassName="absolute inset-0 h-full w-full"
                    fallbackSrc="/images/logo-placeholder.svg"
                    onError={() => setLogoError(true)}
                  />
                </div>

                {/* Selo de conquista sobre a logo */}
                {heroBadgeUrl && !badgeImageError && (
                  <div
                    className="absolute -right-1.5 -top-2 z-30 h-9 w-9 overflow-visible sm:h-10 sm:w-10"
                    title="Selo de conquista"
                  >
                    <OptimizedImage
                      src={heroBadgeUrl}
                      alt="Selo de conquista"
                      fill
                      sizes="40px"
                      objectFit="contain"
                      className="drop-shadow-sm"
                      containerClassName="h-full w-full bg-transparent"
                      onError={() => setBadgeImageError(true)}
                    />
                  </div>
                )}
              </div>

              {/* Informações da Empresa */}
              <div className="min-w-0 space-y-1 pt-1 sm:pt-2">
                <div className="flex min-w-0 items-center gap-2">
                  <h1 className="truncate text-xl font-bold text-slate-950 sm:text-2xl">
                    {company.name}
                  </h1>
                  {company.verified && (
                    <BadgeCheck
                      className="h-5 w-5 shrink-0 fill-emerald-100 text-emerald-600 sm:h-6 sm:w-6"
                      aria-label="Empresa verificada"
                    />
                  )}
                </div>

                {locationLabel && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 sm:text-sm">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{locationLabel}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs sm:text-sm">
                  <div className="flex items-center gap-1 font-bold text-slate-950">
                    <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" strokeWidth={0} />
                    <span>{ratingLabel}</span>
                  </div>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500">
                    {companyStats.reviewCount} {companyStats.reviewCount === 1 ? 'avaliação' : 'avaliações'}
                  </span>

                  {directChatVisible && (
                    <span className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-100" />
                      </span>
                      Chat Online
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Lado Direito: Premium + Botões */}
            <div className="ml-auto flex shrink-0 flex-col items-end gap-3">
              {/* Badge PREMIUM */}
              {company.verified && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 px-3 py-1.5 shadow-lg border border-purple-300/50">
                  <svg className="h-3.5 w-3.5 text-purple-100" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-xs font-bold tracking-wide text-white drop-shadow-sm">PREMIUM</span>
                </div>
              )}

              {/* Botões de ação */}
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap sm:justify-end">
                {ctaEnabled && ctaUrl && (
                  <div {...heroWhatsappHoverIntent}>
                    <WhatsappButton
                      size="default"
                      enabled
                      href={ctaUrl}
                      className="h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 sm:text-sm"
                      label="WhatsApp"
                      companyId={company.id}
                      requireSignup
                      signupGateSource="contact_reveal"
                      signupGateTitle="Crie sua conta para falar no WhatsApp"
                      signupGateDescription="Libere o contato direto desta empresa e volte exatamente para o mesmo lugar depois do cadastro."
                    />
                  </div>
                )}

                {directChatVisible && (
                  <Button
                    size="default"
                    className="relative group h-10 shrink-0 items-center justify-center whitespace-nowrap overflow-hidden rounded-lg bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 px-3 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 border border-emerald-400/30 sm:text-sm"
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
                    <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 ease-in-out group-hover:translate-x-full" />
                    <MessageCircle className="mr-1.5 h-4 w-4 text-emerald-200" />
                    Chat
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="default"
                  className="h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 sm:text-sm"
                  onClick={handleShare}
                  disabled={isSharing}
                >
                  <Share2 className="mr-1.5 h-4 w-4 text-slate-400" />
                  Compartilhar
                </Button>

                {canRequestQuote ? (
                  <Button
                    size="default"
                    className="h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-lg bg-blue-600 px-3 text-xs font-bold text-white shadow-sm hover:bg-blue-700 sm:text-sm"
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
                    <Star className="mr-1.5 h-4 w-4 fill-white" />
                    Solicitar orçamento
                  </Button>
                ) : (
                  <ReviewCompanyButton
                    company={company}
                    compactLabel="Avaliar empresa"
                    className="h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 sm:text-sm"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. NAVEGAÇÃO POR ABAS */}
        {tabs.length > 0 && onTabChange && (
          <div className="border-t border-slate-200 bg-transparent">
            <ScrollArea className="w-full">
              <TabsList className="h-auto min-w-full justify-start gap-5 rounded-none bg-transparent p-0 px-4 text-slate-500 sm:px-5 lg:px-6">
                {tabs.map((tab) => {
                  const TabIcon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={cn(
                        'h-auto rounded-none border-b-2 border-transparent px-0 pb-3 pt-1 text-sm font-medium shadow-none',
                        'text-slate-500 hover:bg-transparent hover:text-slate-900',
                        'data-[state=active]:border-blue-700 data-[state=active]:bg-transparent data-[state=active]:text-slate-950 data-[state=active]:shadow-none'
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