'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Scale, Plus } from 'lucide-react';
import Link from 'next/link';
import { Company } from '@/lib/api';
import { getFullImageUrl } from '@/utils/image';
import { cn } from '@/lib/utils';

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
  const premiumCount = companies.filter(c => 
    c.featured || c.plan_status === 'active' || c.has_paid_plan
  ).length;

  const emptySlots = Math.max(0, maxCompanies - companies.length);

  return (
    <section 
      className={cn("container mx-auto px-4 py-6", className)}
      aria-label="Resumo das empresas selecionadas"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <AnimatePresence mode="popLayout">
            {companies.slice(0, maxCompanies).map((company, idx) => (
              <motion.div
                key={company.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="relative group"
              >
                <div className="h-16 w-16 rounded-2xl p-2 bg-white shadow-md border border-slate-100 flex items-center justify-center overflow-hidden hover:shadow-lg transition-shadow">
                  <img
                    src={getFullImageUrl(company.logo_url || undefined) || '/images/logo-placeholder.svg'}
                    alt={`Logo da ${company.name}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                
                <button
                  onClick={() => onRemove(company.id)}
                  aria-label={`Remover ${company.name} da comparação`}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
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
              className="h-16 w-16 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-400 transition-colors group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
