'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeftRight,
  Columns,
  Sliders,
  Maximize2,
  ExternalLink,
  BookOpen,
  Info,
  Calendar,
} from 'lucide-react';
import ComparisonSlider from './ComparisonSlider';
import ComparisonSideBySide from './ComparisonSideBySide';
import ComparisonImageViewer from './ComparisonImageViewer';
import {
  trackFounderComparisonViewed,
  trackFounderComparisonInteracted,
  trackFounderComparisonModeChanged,
  trackFounderComparisonExpanded,
  trackFounderCtaClick,
} from './FounderTelemetry';

export default function FounderBeforeAfter() {
  const [premiumPercent, setPremiumPercent] = useState<number>(50); // 0 a 100
  const [viewMode, setViewMode] = useState<'reveal' | 'side-by-side'>('reveal');
  const [mobileTab, setMobileTab] = useState<'free' | 'premium'>('premium');
  const [mobileCompare, setMobileCompare] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerTarget, setViewerTarget] = useState<'free' | 'premium'>('premium');

  const sectionRef = useRef<HTMLElement>(null);
  const hasAnimatedRef = useRef(false);
  const userInteractedRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastAnimationPaintRef = useRef(0);

  // Registro de visualização da seção com IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !hasAnimatedRef.current) {
          hasAnimatedRef.current = true;
          trackFounderComparisonViewed();

          // Motion de Entrada: 20% -> 65% -> 50%
          const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
          if (!mediaQuery.matches && !userInteractedRef.current) {
            runEntryAnimation();
          }
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Animação de entrada suave executada uma única vez
  const runEntryAnimation = () => {
    const startTime = performance.now();
    const duration = 1400; // 1.4s

    const animate = (currentTime: number) => {
      if (userInteractedRef.current) return;

      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Trajetória: inicia em 20%, sobe até 65% na metade e acomoda em 50%
      let currentVal: number;
      if (progress < 0.5) {
        const t = progress / 0.5;
        // Ease out quad até 65
        currentVal = 20 + 45 * (1 - (1 - t) * (1 - t));
      } else {
        const t = (progress - 0.5) / 0.5;
        // Ease in-out quad de 65 para 50
        currentVal = 65 - 15 * (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
      }

      // Keep the 1.4s reveal but cap React state updates to ~30fps.
      if (currentTime - lastAnimationPaintRef.current >= 32 || progress >= 1) {
        setPremiumPercent(Math.round(currentVal));
        lastAnimationPaintRef.current = currentTime;
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setPremiumPercent(50);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Interrompe qualquer animação automática no primeiro toque do usuário
  const handleUserInteraction = useCallback(() => {
    userInteractedRef.current = true;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const handlePercentChange = (newPercent: number, _method: 'drag' | 'keyboard') => {
    handleUserInteraction();
    setPremiumPercent(newPercent);
  };

  const handleDragEnd = (finalPercent: number) => {
    trackFounderComparisonInteracted(finalPercent, 'drag');
  };

  const handlePresetClick = (presetPercent: number) => {
    handleUserInteraction();
    setPremiumPercent(presetPercent);
    trackFounderComparisonInteracted(presetPercent, 'preset');
  };

  const handleModeSwitch = (mode: 'reveal' | 'side-by-side') => {
    handleUserInteraction();
    setViewMode(mode);
    trackFounderComparisonModeChanged(mode);
  };

  const handleOpenViewer = (target: 'free' | 'premium') => {
    handleUserInteraction();
    setViewerTarget(target);
    setIsViewerOpen(true);
    trackFounderComparisonExpanded(target);
  };

  const selectMobileTab = (tab: 'free' | 'premium') => {
    handleUserInteraction();
    setMobileTab(tab);
    trackFounderComparisonInteracted(tab === 'free' ? 0 : 100, 'mobile_tab');
  };

  const handleMobileTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const nextTab = mobileTab === 'free' ? 'premium' : 'free';
    selectMobileTab(nextTab);
    document.getElementById(`founder-tab-${nextTab}`)?.focus();
  };

  return (
    <section
      ref={sectionRef}
      id="comparador-visual"
      className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#d0d7de] scroll-mt-16"
    >
      {/* ============================================================ */}
      {/* CABEÇALHO DA SEÇÃO (COPY CORPORATIVA IBM-STYLE) */}
      {/* ============================================================ */}
      <div className="max-w-4xl mb-8 sm:mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#edf5ff] border border-[#d0e2ff] text-xs font-mono text-[#0043ce] uppercase tracking-wider mb-3">
          <ArrowLeftRight className="w-3.5 h-3.5" />
          COMPARADOR VISUAL · ANTES E DEPOIS
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-[#09172f] tracking-tight">
          Veja a diferença entre um perfil básico e uma Brand Page completa.
        </h2>
        <p className="mt-3 text-sm sm:text-base text-[#475569] leading-relaxed">
          Compare a apresentação da empresa, o catálogo de soluções, os canais de contato e os
          recursos disponíveis em cada modalidade.
        </p>

        {/* BARRA DE CONTROLES: PRESETS & MODOS DE VISUALIZAÇÃO */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
          {/* Presets de Porcentagem (0%, 50%, 100%) */}
          {viewMode === 'reveal' && (
            <div className="hidden md:flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="text-slate-500 mr-1 hidden sm:inline">Visualização:</span>
              <button
                type="button"
                onClick={() => handlePresetClick(0)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                  premiumPercent === 0
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                }`}
              >
                Ver perfil básico (0%)
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick(50)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                  premiumPercent === 50
                    ? 'bg-[#0f62fe] text-white border-[#0f62fe] shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                }`}
              >
                Meio a meio (50%)
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick(100)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                  premiumPercent === 100
                    ? 'bg-[#0043ce] text-white border-[#0043ce] shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
                }`}
              >
                Ver Brand Page (100%)
              </button>
            </div>
          )}

          {/* Toggle de Modo: Reveal vs. Lado a Lado (Desktop) */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 ml-auto">
            <button
              type="button"
              onClick={() => handleModeSwitch('reveal')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                viewMode === 'reveal'
                  ? 'bg-white text-[#09172f] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Arraste para comparar
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch('side-by-side')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                viewMode === 'side-by-side'
                  ? 'bg-white text-[#09172f] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              Ver lado a lado
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* FAIXA MOBILE (< 768px): TABS INDIVIDUAIS COM ZOOM ACESSÍVEL */}
      {/* ============================================================ */}
      <div className="block md:hidden mb-6">
        <div
          role="tablist"
          aria-label="Imagem do comparador"
          className="flex items-center justify-between gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200 mb-3"
        >
          <button
            id="founder-tab-free"
            type="button"
            role="tab"
            aria-selected={mobileTab === 'free'}
            aria-controls="founder-comparison-panel"
            tabIndex={mobileTab === 'free' ? 0 : -1}
            onKeyDown={handleMobileTabKeyDown}
            onClick={() => {
              selectMobileTab('free');
            }}
            className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f62fe] focus-visible:ring-offset-2 ${
              mobileTab === 'free' ? 'bg-white text-[#09172f] shadow-sm' : 'text-slate-600'
            }`}
          >
            Antes · Perfil Básico
          </button>
          <button
            id="founder-tab-premium"
            type="button"
            role="tab"
            aria-selected={mobileTab === 'premium'}
            aria-controls="founder-comparison-panel"
            tabIndex={mobileTab === 'premium' ? 0 : -1}
            onKeyDown={handleMobileTabKeyDown}
            onClick={() => {
              selectMobileTab('premium');
            }}
            className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f62fe] focus-visible:ring-offset-2 ${
              mobileTab === 'premium' ? 'bg-[#0f62fe] text-white shadow-sm' : 'text-slate-600'
            }`}
          >
            Depois · Brand Page
          </button>
        </div>

        {/* Card Mobile com a imagem em destaque */}
        <div
          id="founder-comparison-panel"
          role="tabpanel"
          aria-labelledby={`founder-tab-${mobileTab}`}
          tabIndex={0}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f62fe] focus-visible:ring-offset-2"
        >
          {mobileCompare ? (
            <ComparisonSlider
              premiumPercent={premiumPercent}
              onPercentChange={handlePercentChange}
              onDragEnd={handleDragEnd}
              onExpand={handleOpenViewer}
            />
          ) : (
            <div className="relative rounded-xl border-2 border-slate-200 overflow-hidden bg-slate-900 aspect-[1672/941]">
              <Image
                src={
                  mobileTab === 'free'
                    ? '/assets/founder/founder-free.webp'
                    : '/assets/founder/founder-premium.webp'
                }
                alt={
                  mobileTab === 'free'
                    ? 'Captura do perfil básico gratuito no Avalia Solar'
                    : 'Captura da Brand Page Premium no Avalia Solar'
                }
                width={1672}
                height={941}
                quality={84}
                className="w-full h-full object-contain"
                draggable={false}
              />
              <button
                type="button"
                onClick={() => handleOpenViewer(mobileTab)}
                className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 text-white text-xs font-mono font-bold border border-white/20 shadow-md"
              >
                <Maximize2 className="w-3.5 h-3.5 text-[#f8ca3a]" />
                Ampliar para leitura
              </button>
            </div>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>
            {mobileTab === 'free'
              ? 'Estrutura padrão gratuita'
              : 'Brand Page completa com catálogo'}
          </span>
          <button
            type="button"
            onClick={() => {
              handleUserInteraction();
              setMobileCompare((current) => !current);
              trackFounderComparisonModeChanged('mobile_tabs');
            }}
            className="text-[#0f62fe] font-bold underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f62fe] focus-visible:ring-offset-2"
          >
            {mobileCompare ? 'Voltar às imagens individuais' : 'Comparar com divisor'}
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* ÁREA PRINCIPAL DO COMPARADOR (REVEAL SLIDER OU LADO A LADO) */}
      {/* ============================================================ */}
      <div className="hidden md:block">
        {viewMode === 'reveal' ? (
          <ComparisonSlider
            premiumPercent={premiumPercent}
            onPercentChange={handlePercentChange}
            onDragEnd={handleDragEnd}
            onExpand={handleOpenViewer}
          />
        ) : (
          <ComparisonSideBySide onExpand={handleOpenViewer} />
        )}
      </div>

      {/* ============================================================ */}
      {/* NOTA LEGAL/TÉCNICA & CTAS DE CONVERSÃO */}
      {/* ============================================================ */}
      <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-2.5 max-w-2xl text-xs text-slate-500 leading-relaxed font-mono">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p>
            Imagens ilustrativas de apresentação baseadas em perfis homologados na plataforma Avalia
            Solar. Recursos dependem do plano e da habilitação; verificação de integrador é um
            processo independente de auditoria.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <a
            href="https://zbooking.us/6shCH"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackFounderCtaClick('Agendar apresentação (Comparador)', 'https://zbooking.us/6shCH')
            }
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#09172f] hover:bg-[#002d9c] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98]"
          >
            <Calendar className="w-4 h-4 text-[#f8ca3a]" />
            <span>Agendar apresentação</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <Link
            href="/blog/plano-founder-avalia-solar"
            onClick={() =>
              trackFounderCtaClick(
                'Conhecer o Plano Founder (Comparador)',
                '/blog/plano-founder-avalia-solar'
              )
            }
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm border border-slate-300 transition-colors"
          >
            <BookOpen className="w-4 h-4 text-slate-500" />
            <span>Conhecer o Plano Founder</span>
          </Link>
        </div>
      </div>

      {/* MODAL DE AMPLIAÇÃO EM TELA CHEIA */}
      <ComparisonImageViewer
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        initialTab={viewerTarget}
      />
    </section>
  );
}
