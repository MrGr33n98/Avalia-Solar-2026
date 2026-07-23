'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import Link from 'next/link';
import { Company } from '@/lib/api';
import { cn } from '@/lib/utils';
import { isPremiumCompany } from './compare-company-utils';
import { CompanyLogo } from '@/components/CompanyLogo';

interface ComparisonSummaryProps {
  companies: Company[];
  maxCompanies?: number;
  onRemove: (id: number) => void;
  className?: string;
}

export default function ComparisonSummary({
  companies,
  maxCompanies = 3,
  onRemove,
  className,
}: ComparisonSummaryProps) {
  const premiumCount = companies.filter(isPremiumCompany).length;

  const emptySlots = Math.max(0, maxCompanies - companies.length);

  return (
    <section 
      className={cn("py-2", className)}
      aria-label="Resumo das empresas selecionadas"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <AnimatePresence mode="popLayout">
            {companies.slice(0, maxCompanies).map((company) => (
              <motion.div
                key={company.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="relative group"
              >
                <CompanyLogo
                  logoUrl={company.logo_url}
                  name={company.name}
                  size="custom"
                  badges={company.badges}
                  className={cn(
                    "h-14 w-14 rounded-[1.15rem] shadow-[0_16px_34px_-24px_rgba(15,23,42,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_42px_-26px_rgba(37,99,235,0.35)]",
                    "clay-surface clay-convex",
                    isPremiumCompany(company) ? "border-blue-200/80" : "border-slate-100"
                  )}
                  badgeClassName="-right-1.5 -top-1.5 h-6 w-6"
                />
                
                <button
                  onClick={() => onRemove(company.id)}
                  aria-label={`Remover ${company.name} da comparação`}
                  className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 md:opacity-0 md:group-hover:opacity-100"
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Empty slots */}
          {Array.from({ length: emptySlots }).map((_, i) => (
            <Link 
              key={`empty-${i}`}
              href="/companies"
              className="group flex h-14 w-14 items-center justify-center rounded-[1.15rem] border-2 border-dashed border-slate-200 bg-slate-50 text-slate-300 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Adicionar mais uma empresa à comparação"
            >
              <Plus className="h-6 w-6" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>

      <div className="text-sm text-slate-500 font-medium">
        <span className="font-bold text-slate-900">{companies.length}</span> 
        {' '}{companies.length === 1 ? 'empresa' : 'empresas'} em análise
        {premiumCount > 0 && (
          <>
            {' • '}
            <span className="text-blue-600 font-semibold">
              {premiumCount} premium
            </span>
          </>
        )}
      </div>
    </section>
  );
}
