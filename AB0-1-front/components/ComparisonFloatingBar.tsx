'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, X, ArrowRight, Trash2, Eye, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useComparison } from '@/hooks/useComparison';
import { getFullImageUrl } from '@/utils/image';
import { cn } from '@/lib/utils';
import { Company } from '@/lib/api';
import { isPremiumCompany } from '@/components/compare/compare-company-utils';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const CompanyComparisonModal = dynamic(() => import('./CompanyComparisonModal'), {
  ssr: false,
});

function ComparisonAvatar({
  company,
  onRemove,
}: {
  company: Company;
  onRemove: (id: number) => void;
}) {
  const premium = isPremiumCompany(company);

  return (
    <div className="group relative shrink-0" title={company.name}>
      <div
        className={cn(
          "relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[1rem] border p-1 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.55)] transition-transform duration-300 hover:-translate-y-0.5",
          premium
            ? "border-amber-300/60 bg-[linear-gradient(180deg,rgba(255,248,232,1),rgba(255,255,255,1))]"
            : "border-slate-600 bg-white/95"
        )}
      >
        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[0.82rem] bg-white">
          <img
            src={getFullImageUrl(company.logo_url || undefined) || '/images/logo-placeholder.svg'}
            alt={company.name}
            className="h-full w-full scale-[1.16] object-contain"
          />
        </div>
      </div>

      {premium && (
        <div className="absolute -bottom-1 -right-1 rounded-full bg-slate-900 p-1 text-amber-300 shadow-lg">
          <Crown className="h-3 w-3 fill-current" />
        </div>
      )}

      <button
        onClick={() => onRemove(company.id)}
        aria-label={`Remover ${company.name} da comparação`}
        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-red-200 bg-red-500 text-white shadow-lg transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export default function ComparisonFloatingBar() {
  const {
    comparisonList,
    removeFromComparison,
    clearComparison,
    premiumCount,
    remainingSlots,
    count,
  } = useComparison();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (count === 0) return null;

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const companyLabel = count === 1 ? 'empresa' : 'empresas';

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed inset-x-0 bottom-4 z-50 px-3 sm:px-4"
        >
          <div className="mx-auto w-full max-w-[1080px]">
            <div className="overflow-hidden rounded-[1.75rem] border border-slate-700/80 bg-[linear-gradient(135deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96))] p-2.5 text-white shadow-[0_22px_60px_-24px_rgba(15,23,42,0.7)] backdrop-blur-2xl">
              <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-start gap-3 md:items-center">
                  <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-primary/15 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] md:flex">
                    <Scale className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar md:pb-0">
                      {comparisonList.map((company) => (
                        <ComparisonAvatar
                          key={company.id}
                          company={company}
                          onRemove={removeFromComparison}
                        />
                      ))}

                      {remainingSlots > 0 && (
                        <div className="flex h-11 min-w-[3rem] items-center justify-center rounded-[1rem] border border-dashed border-slate-600 bg-slate-800/80 px-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                          +{remainingSlots}
                        </div>
                      )}
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-400">
                      <span className="whitespace-nowrap">
                        <span className="text-white">{count}</span> {companyLabel} em analise
                      </span>
                      {premiumCount > 0 && (
                        <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">
                          {premiumCount} premium
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid w-full grid-cols-[auto,1fr,1fr] gap-2 md:flex md:w-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearComparison}
                    aria-label="Limpar comparacao"
                    className="h-11 rounded-[1rem] px-3 text-slate-300 hover:bg-white/5 hover:text-white"
                  >
                    <Trash2 className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Limpar</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenModal}
                    className="h-11 rounded-[1rem] border-slate-600 bg-slate-800/80 font-bold text-white hover:bg-slate-700 hover:text-white"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Ver Detalhes</span>
                    <span className="sm:hidden">Detalhes</span>
                  </Button>

                  <Button
                    asChild
                    size="sm"
                    className="h-11 rounded-[1rem] bg-blue-600 px-4 font-black text-white shadow-lg shadow-blue-950/30 hover:bg-blue-500"
                  >
                    <Link href="/compare">
                      <span className="sm:hidden">Comparar</span>
                      <span className="hidden sm:inline">Comparar {count} {companyLabel}</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Comparison Modal */}
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
