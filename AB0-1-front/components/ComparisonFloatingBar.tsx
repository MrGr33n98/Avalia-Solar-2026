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
import { useEffect, useRef, useState } from 'react';

import { ComparisonSponsoredRecommendation } from '@/components/compare/ComparisonSponsoredRecommendation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useComparison } from '@/hooks/useComparison';
import type { Company } from '@/lib/api';
import { track } from '@/lib/analytics/lazy';
import { openSignupGate } from '@/lib/signup-gate';
import { cn } from '@/lib/utils';
import { getFullImageUrl } from '@/utils/image';

const CompanyComparisonModal = dynamic(() => import('./CompanyComparisonModal'), {
  ssr: false,
});

function CompanyChip({ company, onRemove }: { company: Company; onRemove: (id: number) => void }) {
  const logoUrl = getFullImageUrl(company.logo_url || undefined);

  return (
    <div className="group flex h-16 min-w-[176px] max-w-[220px] items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 shadow-sm transition-colors hover:border-blue-300">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-full w-full object-contain p-1" />
        ) : (
          <span className="text-sm font-bold uppercase text-slate-500">
            {company.name.charAt(0)}
          </span>
        )}
      </div>

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
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function TrustItem({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-medium text-slate-600">
      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      {children}
    </span>
  );
}

export default function ComparisonFloatingBar() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const {
    comparisonList,
    removeFromComparison,
    clearComparison,
    count,
    canAddMore,
    maxComparison,
    isLoading: comparisonLoading,
  } = useComparison();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dockState, setDockState] = useState<'expanded' | 'minimized' | 'hidden'>('expanded');
  const selectionKey = comparisonList.map((company) => company.id).join(',');
  const previousSelectionKeyRef = useRef(selectionKey);

  useEffect(() => {
    const selectionChanged = previousSelectionKeyRef.current !== selectionKey;
    previousSelectionKeyRef.current = selectionKey;

    if (selectionChanged && dockState === 'hidden') {
      setDockState('expanded');
    }
  }, [dockState, selectionKey]);

  if (count === 0) return null;

  if (dockState === 'hidden') return null;

  const companyLabel = count === 1 ? 'empresa' : 'empresas';
  const shouldGateHighIntent = !authLoading && !comparisonLoading && !isAuthenticated && count >= 2;

  const handleComparisonPageClick = () => {
    track('comparison_dock_compare_click', {
      comparison_count: count,
      placement: 'comparison_dock',
    });

    if (shouldGateHighIntent) {
      openSignupGate({
        source: 'comparison_cta',
        returnTo: '/compare',
        comparisonCount: count,
        title: 'Crie sua conta para continuar comparando',
        description:
          'Desbloqueie a análise completa, salve sua shortlist e volte exatamente para onde parou.',
      });
      return;
    }

    router.push('/compare');
  };

  const handleDetailsClick = () => {
    if (shouldGateHighIntent) {
      openSignupGate({
        source: 'comparison_cta',
        returnTo: `${window.location.pathname}${window.location.search}`,
        comparisonCount: count,
        title: 'Crie sua conta para ver a comparação completa',
        description:
          'Libere a visão lado a lado, mantenha suas empresas salvas e siga sua pesquisa sem perder o contexto.',
      });
      return;
    }

    setIsModalOpen(true);
  };

  const handleAddCompany = () => {
    track('comparison_dock_add_company_click', {
      comparison_count: count,
      placement: 'comparison_dock',
    });
    router.push('/search');
  };

  return (
    <>
      <AnimatePresence>
        {dockState === 'minimized' ? (
          <motion.aside
            key="comparison-dock-minimized"
            initial={{ y: 32, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 32, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', damping: 28, stiffness: 340 }}
            aria-label="Comparação minimizada"
            className="fixed bottom-[76px] right-3 z-50 md:bottom-5 md:right-6"
          >
            <div className="flex items-center gap-2 rounded-lg border border-blue-400 bg-white p-2 shadow-[0_12px_28px_rgba(37,99,235,0.14)]">
              <button
                type="button"
                onClick={() => setDockState('expanded')}
                aria-label={`Expandir comparação com ${count} ${companyLabel}`}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-bold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <Maximize2 className="h-4 w-4" />
                Comparar {count}
              </button>
              <button
                type="button"
                onClick={() => setDockState('hidden')}
                aria-label="Fechar comparador"
                title="Fechar"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </motion.aside>
        ) : (
          <motion.aside
            key="comparison-dock-expanded"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            aria-label="Empresas selecionadas para comparação"
            className="pointer-events-none fixed bottom-[76px] left-3 right-[5.75rem] z-50 md:bottom-5 md:left-6 md:right-6"
          >
            <section className="pointer-events-auto mx-auto max-w-[1480px] overflow-hidden rounded-lg border border-blue-300 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.08)]">
              <div className="border-b border-slate-200 px-4 py-4 md:px-5">
                <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)_auto] xl:items-start">
                  <div className="min-w-0">
                    <p className="text-base font-semibold tracking-tight text-slate-950">
                      Comparação transparente
                    </p>
                    <p className="mt-1 max-w-[220px] text-xs leading-5 text-slate-600">
                      Compare lado a lado com os mesmos critérios para todas.
                    </p>
                    <span
                      className="mt-2 inline-flex rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700"
                      aria-live="polite"
                    >
                      {count} de {maxComparison}{' '}
                      {count === 1 ? 'empresa selecionada' : 'empresas selecionadas'}
                    </span>
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
                        <Plus className="h-4 w-4" />
                        Adicionar empresa
                      </button>
                    ) : null}
                  </div>

                  <div className="flex items-start justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setDockState('minimized')}
                      aria-label="Minimizar comparação"
                      title="Minimizar comparação"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDockState('hidden')}
                      aria-label="Fechar comparação"
                      title="Fechar comparação"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 px-4 py-4 md:px-5 lg:flex-row lg:items-center lg:justify-end">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <Button
                    variant="ghost"
                    onClick={clearComparison}
                    className="h-10 rounded-md px-3 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Limpar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDetailsClick}
                    className="h-10 rounded-md border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                  >
                    <List className="mr-2 h-4 w-4" />
                    Ver detalhes
                  </Button>
                  {canAddMore ? (
                    <Button
                      variant="outline"
                      onClick={handleAddCompany}
                      className="h-10 rounded-md border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 sm:hidden"
                    >
                      <Plus className="mr-2 h-4 w-4" />
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
                    <ArrowRight className="ml-2 h-4 w-4" />
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
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Patrocínios não alteram sua comparação.
                </div>
                <ComparisonSponsoredRecommendation
                  excludedCompanyIds={comparisonList.map((company) => company.id)}
                />
              </div>
            </section>
          </motion.aside>
        )}
      </AnimatePresence>

      {dockState === 'expanded' ? (
        <div aria-hidden="true" className="h-[310px] md:h-[220px]" />
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
