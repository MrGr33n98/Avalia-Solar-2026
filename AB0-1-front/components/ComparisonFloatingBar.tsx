'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useComparison } from '@/hooks/useComparison';
import { useAuth } from '@/contexts/AuthContext';
import { getFullImageUrl } from '@/utils/image';
import { cn } from '@/lib/utils';
import { Company } from '@/lib/api';
import { isPremiumCompany } from '@/components/compare/compare-company-utils';
import dynamic from 'next/dynamic';
import { openSignupGate } from '@/lib/signup-gate';

const CompanyComparisonModal = dynamic(() => import('./CompanyComparisonModal'), {
  ssr: false,
});

function CompanyChip({
  company,
  onRemove,
}: {
  company: Company;
  onRemove: (id: number) => void;
}) {
  const premium = isPremiumCompany(company);
  const logoUrl = getFullImageUrl(company.logo_url || undefined);

  return (
    <div className="group relative flex items-center gap-2 bg-white border border-slate-200 rounded-full px-2 py-1 shadow-sm hover:border-slate-300 transition-colors">
      {/* Logo */}
      <div className={cn(
        "relative w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border",
        premium ? "border-amber-300/60" : "border-slate-200"
      )}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={company.name}
            className="w-full h-full object-contain p-[2px]"
          />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
            <span className="text-[9px] font-bold text-slate-500 uppercase">
              {company.name.charAt(0)}
            </span>
          </div>
        )}
        {premium && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 flex items-center justify-center">
            <Crown className="w-1.5 h-1.5 text-white fill-current" />
          </div>
        )}
      </div>

      {/* Name */}
      <span className="text-[12px] font-light text-slate-700 max-w-[80px] truncate leading-none">
        {company.name}
      </span>

      {/* Remove button */}
      <button
        onClick={() => onRemove(company.id)}
        aria-label={`Remover ${company.name}`}
        className="w-4 h-4 rounded-full bg-slate-200 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-slate-400 transition-colors flex-shrink-0"
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </div>
  );
}

export default function ComparisonFloatingBar() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const {
    comparisonList,
    removeFromComparison,
    clearComparison,
    premiumCount,
    count,
    isLoading: comparisonLoading,
  } = useComparison();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (count === 0) return null;

  const companyLabel = count === 1 ? 'empresa' : 'empresas';

  const shouldGateHighIntent = !authLoading && !comparisonLoading && !isAuthenticated && count >= 2;

  const handleComparisonPageClick = () => {
    if (shouldGateHighIntent) {
      openSignupGate({
        source: 'comparison_cta',
        returnTo: '/compare',
        comparisonCount: count,
        title: 'Crie sua conta para continuar comparando',
        description: 'Desbloqueie a análise completa, salve sua shortlist e volte exatamente para onde parou.',
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
        description: 'Libere a visão lado a lado, mantenha suas empresas salvas e siga sua pesquisa sem perder o contexto.',
      });
      return;
    }

    setIsModalOpen(true);
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="fixed inset-x-0 bottom-0 z-50"
        >
          <div className="border-t border-slate-200 bg-white/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="flex items-center justify-between gap-4 py-3">

                {/* Left — companies chips */}
                <div className="flex items-center gap-2 min-w-0 overflow-x-auto no-scrollbar">
                  <span className="text-[11px] font-light text-slate-400 whitespace-nowrap hidden sm:block">
                    {count} {companyLabel} em análise
                    {premiumCount > 0 && (
                      <span className="ml-1.5 text-amber-500 font-medium">{premiumCount} premium</span>
                    )}
                  </span>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {comparisonList.map((company) => (
                      <CompanyChip
                        key={company.id}
                        company={company}
                        onRemove={removeFromComparison}
                      />
                    ))}
                  </div>
                </div>

                {/* Right — actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={clearComparison}
                    className="text-[12px] font-light text-slate-400 hover:text-slate-600 transition-colors underline-offset-2 hover:underline whitespace-nowrap"
                  >
                    Limpar
                  </button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDetailsClick}
                    className="h-9 rounded-full border-slate-300 text-slate-600 font-light text-[12px] px-4 hidden sm:flex hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    Ver Detalhes
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleComparisonPageClick}
                    className="h-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-light text-[12px] px-5 shadow-sm shadow-blue-200 transition-colors"
                  >
                    <span className="hidden sm:inline">Comparar {count} {companyLabel}</span>
                    <span className="sm:hidden">Comparar</span>
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </div>

              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

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
