"use client";

import { ShieldCheck, Lock, ChevronRight, ChevronLeft, AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Company } from "@/lib/api";
import { hasPaidPlan } from "@/lib/feature-access";
import Link from "next/link";
import React, { useEffect, useState, useRef } from "react";
import RelatedCompanyCard from "./RelatedCompanyCard";

export type RelatedCompaniesDisplayMode =
  | 'protected' // Empresa possui plano pago comprovado com proteção de perfil
  | 'hidden'    // Alternativas desligadas no plano Free (sem direito a selo de proteção)
  | 'loading'   // Carregando dados
  | 'results'   // Resultados encontrados e prontos para exibição
  | 'empty'     // Nenhum concorrente/alternativa encontrada
  | 'error';    // Erro na requisição à API

export interface RelatedCompaniesCarouselProps {
  company: Company;
  mode?: RelatedCompaniesDisplayMode;
  showAlternatives?: boolean; // Mantido para compatibilidade regressiva
  relatedCompanies?: Company[];
  loading?: boolean;
  onRetry?: () => void;
}

export default function RelatedCompaniesCarousel({
  company,
  mode,
  showAlternatives,
  relatedCompanies = [],
  loading = false,
  onRetry,
}: RelatedCompaniesCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Detecta preferência de movimento reduzido (A11y WCAG 2.1)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Resolução segura do modo de exibição (Zero Brecha Comercial)
  const resolvedMode: RelatedCompaniesDisplayMode = mode ?? (() => {
    if (showAlternatives === false) {
      // Somente empresas com plano pago comprovado recebem o selo exclusivo
      return hasPaidPlan(company) ? 'protected' : 'hidden';
    }
    if (loading) return 'loading';
    if (!relatedCompanies || relatedCompanies.length === 0) return 'empty';
    return 'results';
  })();

  // Autoplay Effect (Pausado se hover, focus, touch ou reduced motion)
  useEffect(() => {
    if (
      resolvedMode !== 'results' ||
      relatedCompanies.length <= 1 ||
      isInteracting ||
      prefersReducedMotion
    ) {
      return;
    }

    const intervalTime = 50; // ms
    const totalTime = 5000; // 5 segundos
    const increment = (intervalTime / totalTime) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          scroll('right', true);
          return 0;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [resolvedMode, relatedCompanies.length, isInteracting, prefersReducedMotion]);

  const scroll = (direction: 'left' | 'right', isAutoplay = false) => {
    if (scrollContainerRef.current) {
      const { current } = scrollContainerRef;
      const scrollAmount = 300; // Largura do card + gap
      
      if (direction === 'left') {
        current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        const isAtEnd = current.scrollLeft + current.clientWidth >= current.scrollWidth - 20;
        if (isAtEnd && isAutoplay) {
          current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
      }

      if (!isAutoplay) {
        setProgress(0); // Reseta a barra ao clicar manualmente
      }
    }
  };

  // 1. Estado Protegido: Apenas para empresas com plano pago comprovado
  if (resolvedMode === 'protected') {
    return (
      <Card className="rounded-2xl border border-blue-100 bg-blue-50/20 p-6 shadow-sm overflow-hidden relative mt-8">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none select-none" aria-hidden="true">
          <ShieldCheck className="h-24 w-24 text-blue-600" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Lock className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5 uppercase">
                Perfil Protegido Exclusivo
              </h4>
              <p className="text-xs text-slate-500 max-w-xl mt-1 leading-relaxed">
                Esta empresa protege seu perfil comercial no portal <strong>Avalia Solar</strong>. Banners e anúncios de concorrentes são desativados para garantir uma navegação focada e transparente sobre a sua marca.
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // 2. Estado Oculto: Alternativas desligadas no plano Free sem direito a selo de proteção
  if (resolvedMode === 'hidden') {
    return null;
  }

  // 3. Estado de Carregamento (Loading Skeleton suave)
  if (resolvedMode === 'loading') {
    return (
      <div className="w-full flex flex-col gap-4 mt-8 animate-pulse" aria-busy="true" aria-label="Carregando empresas semelhantes">
        <div className="flex items-center justify-between px-1">
          <div className="space-y-2">
            <div className="h-5 w-48 bg-slate-200 rounded" />
            <div className="h-3.5 w-64 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="flex gap-3 sm:gap-4 overflow-hidden pt-1 pb-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 w-[280px] shrink-0 rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-200 rounded-lg" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="h-8 bg-slate-200 rounded-xl mt-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 4. Estado de Erro na API (com botão de retry acessível)
  if (resolvedMode === 'error') {
    return (
      <Card className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-5 mt-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <AlertCircle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Não foi possível carregar empresas semelhantes no momento
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Ocorreu uma instabilidade temporária na consulta de recomendações.
              </p>
            </div>
          </div>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="rounded-xl border-amber-300 text-amber-800 hover:bg-amber-100/60 self-start sm:self-auto text-xs font-semibold shrink-0"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Tentar novamente
            </Button>
          )}
        </div>
      </Card>
    );
  }

  // 5. Estado Vazio Honesto (Nenhuma empresa encontrada)
  if (resolvedMode === 'empty') {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center mt-8">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-2">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </div>
        <h4 className="text-sm font-bold text-slate-800">
          Nenhuma outra empresa correspondente encontrada
        </h4>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
          Esta empresa atende a esta categoria ou região de forma destacada, sem concorrentes diretos cadastrados para comparação imediata.
        </p>
      </div>
    );
  }

  // 6. Estado de Resultados: Renderiza o Carrossel
  return (
    <section
      aria-label="Empresas Relacionadas"
      className="w-full flex flex-col gap-4 mt-8"
      onMouseEnter={() => setIsInteracting(true)}
      onMouseLeave={() => setIsInteracting(false)}
      onFocus={() => setIsInteracting(true)}
      onBlur={() => setIsInteracting(false)}
      onTouchStart={() => setIsInteracting(true)}
      onTouchEnd={() => setIsInteracting(false)}
    >
      {/* Cabeçalho do Carrossel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-1 gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Empresas Relacionadas</h3>
          <p className="text-sm text-slate-500 font-medium">Recomendadas para soluções similares</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 relative">
            <Button
              variant="outline"
              size="icon"
              aria-label="Empresa anterior"
              className="h-8 w-8 rounded-full border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200"
              onClick={() => scroll('left')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Próxima empresa"
              className="h-8 w-8 rounded-full border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 relative overflow-hidden"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="h-4 w-4 relative z-10" />
            </Button>
          </div>
          
          <Link href="/companies" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1">
            Ver todas <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Barra de Progresso Linear do Autoplay */}
      {relatedCompanies.length > 1 && !prefersReducedMotion && (
        <div
          className="w-full h-0.5 sm:h-1 bg-slate-100 rounded-full overflow-hidden mb-2 hidden sm:block"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso da transição automática"
        >
          <div 
            className="h-full bg-blue-400 transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Carrossel Horizontal com Snap e Touch Acessível */}
      <div className="relative w-full pb-4">
        <div 
          ref={scrollContainerRef}
          tabIndex={0}
          aria-label="Lista de empresas semelhantes"
          className="flex gap-3 sm:gap-4 w-full overflow-x-auto snap-x snap-mandatory scroll-smooth px-1 pt-1 pb-2 scroll-pl-1 sm:scroll-pl-1 [&::-webkit-scrollbar]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-2xl"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {relatedCompanies.map((comp) => (
            <div key={comp.id} className="snap-start shrink-0">
              <RelatedCompanyCard
                company={comp}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
