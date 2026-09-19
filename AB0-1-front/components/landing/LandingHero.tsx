'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Category } from '@/lib/api';
import type { HomeHeroTrustMetrics, HomeHeroVariant } from '@/lib/experiments/homeHeroExperiment';
import { HeroBackground } from './HeroBackground';
import LandingHeroClient from './LandingHeroClient';
import { useAdvertisingStore } from '@/store/useAdvertisingStore';
import { Sparkles, ArrowRight } from 'lucide-react';
import useScrollDrivenFrames from '@/hooks/useScrollDrivenFrames';
import { useIsMobile } from '@/hooks/useIsMobile';

type LandingHeroProps = {
  categories?: Category[];
  banners?: any[];
  variant?: HomeHeroVariant;
  experimentId?: string;
  experimentEnabled?: boolean;
  trustMetrics?: HomeHeroTrustMetrics;
};

const FRAMES_DESKTOP_DIR = '/videos/raio-x-fluxo-energia-frames';
const FRAMES_MOBILE_DIR = '/videos/raio-x-fluxo-energia-frames-mobile';
const TOTAL_FRAMES = 120;
const REDUCED_MOTION_VIDEO = '/videos/O_Raio_X_e_Fluxo_de_Energi.mp4';
const STATIC_FALLBACK = '/images/lp-avalia-solar-image.webp';

export default function LandingHero(props: LandingHeroProps) {
  const { activeCampaign, fetchActiveCampaign, subscribeToUpdates, unsubscribeFromUpdates } =
    useAdvertisingStore();
  const isMobile = useIsMobile();
  const travelRef = useRef<HTMLElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    fetchActiveCampaign();
    subscribeToUpdates();
    return () => unsubscribeFromUpdates();
  }, [fetchActiveCampaign, subscribeToUpdates, unsubscribeFromUpdates]);

  const targetLink = activeCampaign?.target_url || '#';
  const showSponsoredBanner = Boolean(activeCampaign && activeCampaign.image_url);

  /* ────────────────────────────────────────────────────────────────
     Scroll-Driven 3D Canvas (desktop only, lg breakpoint: 1024px+)
     ──────────────────────────────────────────────────────────────── */
  const {
    canvasRef,
    preloadProgress,
    isReady: canvasIsReady,
  } = useScrollDrivenFrames({
    totalFrames: TOTAL_FRAMES,
    framesPathDesktop: FRAMES_DESKTOP_DIR,
    framesPathMobile: FRAMES_MOBILE_DIR,
    canvasWidthDesktop: 1280,
    canvasHeightDesktop: 720,
    canvasWidthMobile: 800,
    canvasHeightMobile: 1200,
    smoothingDesktop: 0.22,
    smoothingMobile: 0.18,
    travelRef: travelRef as React.RefObject<HTMLElement>,
    preloadReadyThreshold: 0.25,
  });

  const scrollTravel = useMemo(
    () => (isMobile ? 'auto' : '280vh'),
    [isMobile]
  );

  return (
    <section
      ref={travelRef}
      data-scroll-travel
      className="relative isolate overflow-hidden border-b border-slate-200"
      style={{ minHeight: scrollTravel }}
    >
      {/* ══════════════════════════════════════════════════════════════
          VIEWPORT STICKY
          Fixado no topo enquanto a seção é percorrida.
          No desktop (lg+) este viewport tem 100dvh e a seção roda 280vh.
          No mobile a seção tem altura automática e o sticky não trava.
          ══════════════════════════════════════════════════════════════ */}
      <div
        className={`sticky top-0 flex w-full flex-col overflow-hidden ${
          isMobile ? 'h-auto' : 'h-[100dvh]'
        }`}
      >
        {/* ── Fundo decorativo: gradientes + sol + SVG geométrico ── */}
        <HeroBackground />

        {/* ── Animação 3D Scroll-Driven: painel direito desktop ──
             Largura 50%, alinhado a direita, sticky dentro do viewport. */}
        <div
          aria-hidden={showSponsoredBanner}
          className="absolute inset-y-0 right-0 hidden h-full w-[50%] lg:block"
          style={{
            zIndex: 1,
            maxWidth: 'calc((100% - 1320px) / 2 + 50%)',
          }}
        >
          <div className="relative h-full w-full">
            {/* Imagem estática fallback (até 25% dos frames pré-carregarem) */}
            {!showSponsoredBanner ? (
              <div className="absolute inset-0 flex items-end justify-end">
                <div className="relative h-full w-full">
                  {/* Fallback: imagem estática */}
                  {!canvasIsReady && STATIC_FALLBACK ? (
                    <Image
                      src={STATIC_FALLBACK}
                      alt=""
                      fill
                      priority
                      quality={88}
                      className="object-contain object-right-bottom transition-opacity duration-500 opacity-100"
                      sizes="(max-width: 1023px) 0vw, 50vw"
                      aria-hidden="true"
                    />
                  ) : null}

                  {/* Canvas scroll-driven (120 frames WebP) */}
                  <canvas
                    ref={canvasRef}
                    width={1280}
                    height={720}
                    style={{
                      mixBlendMode: 'normal',
                      imageRendering: 'auto',
                      willChange: 'transform',
                    }}
                    className={`absolute inset-0 h-full w-full object-contain object-right-bottom select-none pointer-events-none transition-opacity duration-500 ${
                      canvasIsReady ? 'opacity-100' : 'opacity-0'
                    }`}
                    role="img"
                    aria-label="Animação interativa 3D de Raio X e Fluxo de Energia Solar"
                  />

                  {/* Fallback para prefers-reduced-motion: vídeo autoplay */}
                  {prefersReducedMotion ? (
                    <video
                      key="reduced-motion-video"
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="auto"
                      className="absolute inset-0 h-full w-full object-contain object-right-bottom"
                      aria-hidden="true"
                    >
                      <source src={REDUCED_MOTION_VIDEO} type="video/mp4" />
                    </video>
                  ) : null}

                  {/* Barra de progresso do pré-carregamento (minúscula, não intrusiva) */}
                  {preloadProgress < 1 && canvasIsReady ? (
                    <div
                      className="absolute bottom-6 left-6 h-0.5 w-20 overflow-hidden rounded-full bg-slate-200/60"
                      aria-hidden="true"
                    >
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-150"
                        style={{ width: `${Math.round(preloadProgress * 100)}%` }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* ── Gradiente de fade: funde a borda esquerda do painel com o fundo da página
                  Coincide com o ponto médio #f8fbff do HeroBackground — ZERO silhueta visível. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-[2]"
              style={{
                background:
                  'linear-gradient(90deg, #f8fbff 0%, rgba(248,251,255,0.5) 30%, rgba(248,251,255,0.12) 55%, transparent 72%)',
              }}
            />

            {/* ── Banner patrocinado (se existir campanha ativa, sobrepõe a animação) ── */}
            {showSponsoredBanner ? (
              <Link
                href={targetLink}
                className="group relative z-[3] block h-full w-full overflow-hidden"
              >
                <Image
                  src={activeCampaign!.image_url!}
                  alt={activeCampaign!.name}
                  fill
                  priority
                  quality={90}
                  className="object-contain object-right-bottom transition-transform duration-300 group-hover:scale-[1.02]"
                  sizes="50vw"
                />
                <div className="absolute right-6 top-6 flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-900/80 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-white backdrop-blur-sm shadow-lg">
                  <Sparkles className="h-3 w-3 text-yellow-400" />
                  <span>Patrocinado</span>
                </div>
              </Link>
            ) : null}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            CONTEÚDO PRINCIPAL — coluna esquerda (texto + search + CTAs)
            ══════════════════════════════════════════════════════════ */}
        <div className="relative z-10 mx-auto flex w-full max-w-[1320px] flex-1 flex-col justify-center px-5 sm:px-6 lg:px-8 xl:px-10 py-9 sm:py-11 lg:py-14">
          <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
            {/* Coluna de conteúdo — 7/12 colunas */}
            <div className="flex w-full min-w-0 flex-col items-start text-left lg:col-span-7">
              <LandingHeroClient {...props} />

              {/* Banner integrado mobile/tablet (< 1024px) */}
              {activeCampaign && activeCampaign.image_url && (
                <div className="mt-6 w-full lg:hidden">
                  <Link
                    href={targetLink}
                    className="group relative block overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm transition-all hover:border-blue-500/50 hover:shadow-md"
                  >
                    <div className="relative aspect-[3/1] w-full overflow-hidden rounded-xl">
                      <Image
                        src={activeCampaign.image_url}
                        alt={activeCampaign.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1023px) 100vw, 0vw"
                      />
                      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-slate-950/80 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-white backdrop-blur-sm">
                        <span>Patrocinado</span>
                      </div>
                    </div>
                    {activeCampaign.description && (
                      <div className="p-3">
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                          {activeCampaign.name}{' '}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </h4>
                        <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                          {activeCampaign.description}
                        </p>
                      </div>
                    )}
                  </Link>
                </div>
              )}
            </div>

            {/* Espaço reservado para a animação desktop — alinha o grid */}
            <div className="hidden lg:col-span-5 lg:block" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
