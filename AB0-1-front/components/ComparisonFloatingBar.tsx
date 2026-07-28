'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  List,
  Maximize2,
  Minus,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { ComparisonSponsoredRecommendation } from '@/components/compare/ComparisonSponsoredRecommendation';
import { CompanyLogo } from '@/components/CompanyLogo';
import { Button } from '@/components/ui/button';
import { useComparison } from '@/hooks/useComparison';
import type { Company } from '@/lib/api';
import { track } from '@/lib/analytics/lazy';
import {
  OPEN_ASSISTANT_COMPACT_EVENT,
  OPEN_COMPARISON_DOCK_EVENT,
  openComparisonDock,
} from '@/lib/floating-widget-events';
import { getFloatingWidgetZIndex, WIDGET_POSITION_CLASSES } from '@/lib/floating-widgets-positioning';
import { cn } from '@/lib/utils';

const CompanyComparisonModal = dynamic(() => import('./CompanyComparisonModal'), {
  ssr: false,
});

function CompanyChip({ company, onRemove }: { company: Company; onRemove: (id: number) => void }) {
  return (
    <div className="group flex h-16 min-w-[176px] max-w-[220px] items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 shadow-sm transition-colors hover:border-blue-300">
      <CompanyLogo
        logoUrl={company.logo_url}
        name={company.name}
        size="custom"
        badges={company.badges}
        className="h-10 w-10 rounded-md bg-slate-50"
        badgeClassName="-right-1 -top-1 h-[18px] w-[18px]"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-slate-900">{company.name}</span>
          {company.verified ? (
            <ShieldCheck
              className="h-3.5 w-3.5 shrink-0 text-emerald-600"
              aria-label="Empresa verificada"
            />
          ) : null}
        </div>
        <span className="mt-0.5 block truncate text-[11px] text-slate-500">
          {company.city && company.state
            ? `${company.city}, ${company.state}`
            : 'Empresa selecionada'}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onRemove(company.id)}
        aria-label={`Remover ${company.name} da comparação`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function CompactCompanyRow({
  company,
  onRemove,
}: {
  company: Company;
  onRemove: (id: number) => void;
}) {
  const location = [company.city, company.state].filter(Boolean).join(', ');

  return (
    <div className="flex h-[52px] items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50/60 px-2.5">
      <CompanyLogo
        logoUrl={company.logo_url}
        name={company.name}
        size="custom"
        badges={company.badges}
        className="h-8 w-8 rounded-lg"
        badgeClassName="-right-1 -top-1 h-4 w-4"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-slate-950">{company.name}</p>
        <p className="truncate text-[11px] text-slate-500">
          {location || 'Localização não informada'}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onRemove(company.id)}
        aria-label={`Remover ${company.name} da comparação`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

function TrustItem({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-medium text-slate-600">
      <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
      {children}
    </span>
  );
}

export default function ComparisonFloatingBar() {
  const router = useRouter();
  const {
    comparisonList,
    removeFromComparison,
    clearComparison,
    count,
    canAddMore,
    maxComparison,
  } = useComparison();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dockState, setDockState] = useState<'expanded' | 'minimized' | 'hidden'>('minimized');
  const [isForcedOpen, setIsForcedOpen] = useState(false);

  useEffect(() => {
    const openComparison = () => {
      setIsForcedOpen(true);
      setIsModalOpen(false);
      setDockState('expanded');
      track('compare_popover_opened', { comparison_count: count });
    };
    const handleAssistantOpen = () => {
      if (window.matchMedia('(max-width: 767px)').matches) {
        setDockState('minimized');
      }
    };

    window.addEventListener(OPEN_COMPARISON_DOCK_EVENT, openComparison);
    window.addEventListener(OPEN_ASSISTANT_COMPACT_EVENT, handleAssistantOpen);
    return () => {
      window.removeEventListener(OPEN_COMPARISON_DOCK_EVENT, openComparison);
      window.removeEventListener(OPEN_ASSISTANT_COMPACT_EVENT, handleAssistantOpen);
    };
  }, [count]);

  // Reexibe o botão minimizado quando empresas são adicionadas com o dock fechado
  useEffect(() => {
    if (count > 0 && dockState === 'hidden') {
      setDockState('minimized');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  if (count === 0 && !isForcedOpen) return null;

  if (dockState === 'hidden') return null;

  const companyLabel = count === 1 ? 'empresa' : 'empresas';
  const handleComparisonPageClick = () => {
    track('comparison_dock_compare_click', {
      comparison_count: count,
      placement: 'comparison_dock',
    });

    router.push('/compare');
  };

  const handleDetailsClick = () => {
    setIsModalOpen(true);
  };

  const handleAddCompany = () => {
    track('comparison_dock_add_company_click', {
      comparison_count: count,
      placement: 'comparison_dock',
    });
    setIsForcedOpen(false);
    setDockState('minimized');
    router.push('/search?tab=companies');
  };

  const closeDock = () => {
    setIsForcedOpen(false);
    setDockState('hidden');
    track('compare_popover_closed', { comparison_count: count });
  };

  const minimizeDock = () => {
    setIsForcedOpen(false);
    setDockState('minimized');
    track('compare_popover_minimized', { comparison_count: count });
  };

  const handleOpenDock = () => {
    track('compare_floating_clicked', { comparison_count: count });
    openComparisonDock();
  };

  return (
    <>
      <svg aria-hidden="true" className="pointer-events-none absolute h-0 w-0" focusable="false">
        <defs>
          <filter id="comparison-electric-distortion" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.018 0.22"
              numOctaves="2"
              seed="7"
              result="electricNoise"
            >
              <animate attributeName="seed" values="2;9;4;12;2" dur="1.4s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="electricNoise" scale="13" xChannelSelector="R" yChannelSelector="B" />
          </filter>
        </defs>
      </svg>
      <AnimatePresence>
        {dockState === 'minimized' ? (
          <div 
            className={cn("fixed z-[50]", WIDGET_POSITION_CLASSES.comparison)}
            style={{ zIndex: getFloatingWidgetZIndex('comparison') }}
          >
            <motion.aside
              key="comparison-dock-minimized"
              initial={{ y: 32, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 32, opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', damping: 28, stiffness: 340 }}
              aria-label="Comparação minimizada"
            >
            {/* Mobile: Botão compacto sem wrapper branco */}
            <button
              type="button"
              onClick={handleOpenDock}
              aria-label={`Comparar: ${count} de ${maxComparison} itens selecionados`}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-lg md:hidden"
            >
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
              Comparar
              <span className="text-xs font-bold text-blue-100" aria-hidden="true">
                {count}/{maxComparison}
              </span>
            </button>
            
            {/* Desktop: Original design with white wrapper */}
            <div className="hidden items-center gap-2 rounded-lg border border-blue-400 bg-white p-2 shadow-xl shadow-blue-500/10 md:flex">
              <button
                type="button"
                onClick={handleOpenDock}
                aria-label={`Comparar: ${count} de ${maxComparison} itens selecionados`}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
                Comparar
                <span className="rounded-full bg-blue-800 px-1.5 py-0.5 text-[10px] text-white ring-1 ring-white/35" aria-hidden="true">
                  {count}/{maxComparison}
                </span>
              </button>
              <button
                type="button"
                onClick={closeDock}
                aria-label="Fechar comparador"
                title="Fechar"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            </motion.aside>
          </div>
        ) : (
          <div
            className={cn(
              "pointer-events-none fixed z-[9050] w-auto mx-auto max-w-[380px] left-4 right-4 md:w-[calc(100vw-64px)] md:max-w-[1120px] md:left-1/2 md:-translate-x-1/2 md:bottom-6",
              "bottom-[calc(var(--mobile-nav-height,_4rem)_+_env(safe-area-inset-bottom)_+_96px)]"
            )}
          >
            <motion.aside
              key="comparison-dock-expanded"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 320 }}
              aria-label="Empresas selecionadas para comparação"
            >
            <section className="comparison-modal-led-border pointer-events-auto flex max-h-[60vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 md:hidden">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold tracking-tight text-slate-950">
                    Comparação transparente
                  </p>
                  <p className="mt-1 text-xs leading-[1.15rem] text-slate-600">
                    Compare lado a lado com os mesmos critérios para todas.
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={minimizeDock}
                    aria-label="Minimizar comparação"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-100 hover:text-slate-700 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <Minus className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={closeDock}
                    aria-label="Fechar comparação"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-red-50 hover:text-red-500 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="min-h-0 overflow-y-auto overscroll-contain px-4 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-slate-800">
                    Empresas selecionadas ({count}/{maxComparison})
                  </p>
                  {count > 0 ? (
                    <button
                      type="button"
                      onClick={clearComparison}
                      className="text-[11px] font-medium text-slate-500 hover:text-red-600"
                    >
                      Limpar
                    </button>
                  ) : null}
                </div>

                {count > 0 ? (
                  <div className="mt-2.5 max-h-[24vh] space-y-2 overflow-y-auto overscroll-contain pr-0.5">
                    {comparisonList.map((company) => (
                      <CompactCompanyRow
                        key={company.id}
                        company={company}
                        onRemove={removeFromComparison}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs leading-5 text-slate-500">
                    Adicione empresas para comparar lado a lado.
                  </p>
                )}

                <div className="mt-3 grid gap-2 min-[380px]:grid-cols-2">
                  {canAddMore ? (
                    <button
                      type="button"
                      onClick={handleAddCompany}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 hover:border-blue-300 hover:bg-blue-50"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      Adicionar empresa
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleComparisonPageClick}
                    disabled={count < 2}
                    aria-label="Ver comparação completa"
                    className={cn(
                      'inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500',
                      !canAddMore && 'min-[380px]:col-span-2'
                    )}
                  >
                    Ver comparação
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                  Patrocínios não alteram sua comparação.
                </div>
              </div>
            </section>

            <section className="comparison-modal-led-border pointer-events-auto hidden overflow-hidden rounded-lg border border-blue-300 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.08)] md:block">
              <div className="relative border-b border-slate-200 px-4 py-4 pr-20 md:px-5 md:pr-24">
                <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
                  <div className="min-w-0">
                    <p className="text-base font-semibold tracking-tight text-slate-950">
                      Comparação transparente
                    </p>
                    <p className="mt-1 max-w-[220px] text-xs leading-5 text-slate-600">
                      Compare lado a lado com os mesmos critérios para todas.
                    </p>
                  </div>

                  <div
                    className="flex min-w-0 snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]"
                    aria-label="Lista de empresas selecionadas"
                  >
                    {comparisonList.map((company) => (
                      <div key={company.id} className="snap-start">
                        <CompanyChip company={company} onRemove={removeFromComparison} />
                      </div>
                    ))}

                    {canAddMore ? (
                      <button
                        type="button"
                        onClick={handleAddCompany}
                        className="flex h-16 min-w-[148px] snap-start items-center justify-center gap-2 rounded-md border border-dashed border-blue-300 bg-blue-50/40 px-4 text-sm font-semibold text-blue-700 transition-colors hover:border-blue-500 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        Adicionar empresa
                      </button>
                    ) : null}
                  </div>

                  <div className="absolute right-3 top-3 flex items-center gap-1 md:right-4 md:top-4">
                    <button
                      type="button"
                      onClick={minimizeDock}
                      aria-label="Minimizar comparação"
                      title="Minimizar comparação"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={closeDock}
                      aria-label="Fechar comparação"
                      title="Fechar comparação"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 px-4 py-4 md:px-5 lg:flex-row lg:items-center lg:justify-between">
                <span
                  className="inline-flex w-fit rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700"
                  aria-live="polite"
                >
                  {count} de {maxComparison}{' '}
                  {count === 1 ? 'empresa selecionada' : 'empresas selecionadas'}
                </span>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <Button
                    variant="ghost"
                    onClick={clearComparison}
                    className="h-10 rounded-md px-3 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  >
                    <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                    Limpar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDetailsClick}
                    className="h-10 rounded-md border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <List className="mr-2 h-4 w-4" aria-hidden="true" />
                    Ver detalhes
                  </Button>
                  {canAddMore ? (
                    <Button
                      variant="outline"
                      onClick={handleAddCompany}
                      className="h-10 rounded-md border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 sm:hidden"
                    >
                      <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                      Adicionar
                    </Button>
                  ) : null}
                  <Button
                    onClick={handleComparisonPageClick}
                    className={cn(
                      'h-10 rounded-md bg-blue-600 px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(37,99,235,0.18)] hover:bg-blue-700',
                      !canAddMore && 'sm:ml-0'
                    )}
                  >
                    Comparar {count} {companyLabel}
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 md:px-5 lg:grid-cols-[1fr_minmax(360px,560px)] lg:items-center">
                <div className="hidden items-center gap-6 lg:flex">
                  <TrustItem>Dados verificados</TrustItem>
                  <span className="h-5 w-px bg-slate-200" aria-hidden="true" />
                  <TrustItem>Sem viés comercial</TrustItem>
                  <span className="h-5 w-px bg-slate-200" aria-hidden="true" />
                  <TrustItem>Comparação justa e imparcial</TrustItem>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600 lg:hidden">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  Patrocínios não alteram sua comparação.
                </div>
                <ComparisonSponsoredRecommendation
                  excludedCompanyIds={comparisonList.map((company) => company.id)}
                />
              </div>
            </section>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {dockState === 'expanded' ? (
        <div aria-hidden="true" className="hidden h-[220px] md:block" />
      ) : null}

      <CompanyComparisonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        companies={comparisonList}
        onRemoveCompany={removeFromComparison}
        onClearAll={clearComparison}
      />
    </>
  );
}
