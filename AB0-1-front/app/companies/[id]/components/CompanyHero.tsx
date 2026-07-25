'use client';

import { OptimizedImage } from '@/components/ui/optimized-image';
import { useRouter } from 'next/navigation';
import { MessageCircle, Share2, ArrowLeft, MapPin, Star } from 'lucide-react';
import PremiumBadge from '@/components/PremiumBadge';
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

      {/* Container unificado: Banner + Card de Identidade + Abas */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* 1. Hero Banner */}
        <div className="overflow-hidden rounded-t-2xl">
          <div className="relative h-[150px] w-full bg-slate-950 sm:h-[170px] lg:h-[210px] xl:h-[220px]">
          {/* Background Blur Fill Layer */}
          <OptimizedImage
            src={!bannerUrl || bannerError ? '/images/banner-avalia-solar.png' : bannerUrl}
            alt=""
            fill
            aria-hidden="true"
            className="object-cover filter blur-xl opacity-40 scale-110"
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
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/5 pointer-events-none" />
          {(!bannerUrl || bannerError) && (
            <div className="pointer-events-none absolute inset-0 ring-1 ring-slate-300/60">
              <span className="absolute bottom-3 right-3 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-medium text-slate-600 backdrop-blur">
                Imagem ilustrativa
              </span>
            </div>
          )}
          </div>
        </div>

        {/* 2. Card de Identidade da Empresa (integrado ao banner, sem margem) */}
        <div className="relative border-t border-slate-200 bg-white px-5 pb-5 pt-4">
          <div className="flex items-center justify-between gap-5">
            {/* Lado Esquerdo: Logo + Dados */}
            <div className="flex min-w-0 items-center gap-4">
              {/* Box da Logo — sobreposição LinkedIn */}
              <div className="relative -mt-12 shrink-0 overflow-visible">
                <div className="h-24 w-24 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                  <OptimizedImage
                    src={!logoUrl || logoError ? '/images/logo-placeholder.svg' : logoUrl}
                    alt={company.name}
                    fill
                    priority
                    imageContext="company-logo"
                    entityName={company.name}
                    locationLabel={locationLabel}
                    objectFit="contain"
                    className="p-1"
                    containerClassName="h-full w-full"
                    fallbackSrc="/images/logo-placeholder.svg"
                    onError={() => setLogoError(true)}
                  />
                </div>
                {heroBadgeUrl && !badgeImageError && (
                  <div
                    className="absolute -right-2 -top-2 z-30 h-10 w-10 transition-transform duration-200 hover:scale-110 sm:h-11 sm:w-11"
                    title="Selo de conquista"
                  >
                    <OptimizedImage
                      src={heroBadgeUrl}
                      alt="Selo de conquista"
                      fill
                      sizes="44px"
                      objectFit="contain"
                      className="drop-shadow-sm"
                      containerClassName="h-full w-full"
                      onError={() => setBadgeImageError(true)}
                    />
                  </div>
                )}
              </div>

              {/* Informações da Empresa */}
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold leading-tight text-slate-950 sm:text-xl truncate">
                    {company.name}
                  </h1>
                  {company.verified && (
                    <span className="inline-flex items-center justify-center text-emerald-500 shrink-0" title="Empresa Verificada">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </span>
                  )}
                </div>

                {locationLabel && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 sm:text-sm">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{locationLabel}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs sm:text-sm">
                  <div className="flex items-center gap-1 font-bold text-slate-900">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" strokeWidth={0} />
                    <span>{ratingLabel}</span>
                  </div>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500">
                    {companyStats.reviewCount} {companyStats.reviewCount === 1 ? 'avaliação' : 'avaliações'}
                  </span>

                  {directChatVisible && (
                    <span className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      Chat Online
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Lado Direito: Premium + Botões */}
            <div className="flex shrink-0 flex-col items-end gap-3">
              {company.verified && (
                <PremiumBadge className="h-6 px-3 sm:h-7 sm:px-4" />
              )}

              <div className="flex flex-wrap items-center gap-2 justify-end">
                {ctaEnabled && ctaUrl && (
                  <div {...heroWhatsappHoverIntent}>
                    <WhatsappButton
                      size="default"
                      enabled
                      href={ctaUrl}
                      className="h-9 rounded-xl border border-emerald-500 bg-transparent px-4 text-xs font-semibold text-emerald-700 shadow-none hover:bg-emerald-50 sm:text-sm"
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
                    className="relative group overflow-hidden h-9 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 px-4 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 border border-emerald-400/30 sm:text-sm"
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
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                    <MessageCircle className="mr-1.5 h-4 w-4 text-emerald-200" />
                    Chat
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="default"
                  className="h-9 rounded-xl border-slate-200 bg-slate-50/50 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100 sm:text-sm"
                  onClick={handleShare}
                  disabled={isSharing}
                >
                  <Share2 className="mr-1.5 h-4 w-4 text-slate-500" />
                  Compartilhar
                </Button>

                {canRequestQuote ? (
                  <Button
                    size="default"
                    className="h-9 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-700 sm:text-sm"
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
                    className="h-9 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-700 sm:text-sm"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Navegação por Abas (integrada ao bloco) */}
        {tabs.length > 0 && onTabChange && (
          <div className="rounded-b-2xl border-t border-slate-200 bg-white">
            <ScrollArea className="w-full">
              <TabsList className="h-auto min-w-full justify-start gap-5 rounded-none bg-transparent p-0 px-4 text-slate-500 sm:px-5">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={cn(
                      'h-auto rounded-none border-b-2 border-transparent px-0 pb-3 pt-1 text-sm font-medium shadow-none',
                      'text-slate-500 hover:bg-transparent hover:text-slate-900',
                      'data-[state=active]:border-blue-700 data-[state=active]:bg-transparent data-[state=active]:text-slate-950 data-[state=active]:shadow-none'
                    )}
                  >
                    <tab.icon className="mr-2 h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}
      </section>
    </div>
  );
}