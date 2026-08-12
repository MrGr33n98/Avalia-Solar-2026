'use client';

import { ArrowLeft } from 'lucide-react';
import { AnimatedCompareIcon } from '@/components/icons/AnimatedCompareIcon' from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ComparePageHeaderProps {
  companiesCount: number;
  hasPremiumCompanies?: boolean;
  onClearAll: () => void;
  className?: string;
}

export default function ComparePageHeader({
  companiesCount,
  hasPremiumCompanies = false,
  onClearAll,
  className,
}: ComparePageHeaderProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden border-b border-slate-200/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,248,255,0.92))] pt-5 pb-7 md:pt-6 md:pb-9",
        className
      )}
    >
      <div className="absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-blue-50/60 via-blue-50/20 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-100 to-transparent pointer-events-none" />

      <div className="container mx-auto max-w-[1180px] px-4 relative">
        <Button
          asChild
          variant="ghost"
          className="mb-4 -ml-3 h-10 rounded-xl px-3 text-slate-400 hover:text-slate-900 font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          tabIndex={1}
          aria-label="Voltar para página de empresas"
        >
          <Link href="/companies" className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Empresas
          </Link>
        </Button>

        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/85 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 shadow-[0_10px_30px_-20px_rgba(37,99,235,0.55)]">
              <AnimatedCompareIcon size={14} intensity="subtle" aria-hidden="true" />
              Comparativo Detalhado
            </div>

            <h1 className="mb-3 text-3xl font-black leading-none tracking-tight text-slate-900 md:text-[3.25rem]">
              Lado a Lado
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-slate-500 md:text-lg">
              Analisamos tecnicamente{' '}
              <span className="text-slate-900 font-bold">{companiesCount} {companiesCount === 1 ? 'empresa' : 'empresas'}</span>
              {' '}para facilitar sua escolha.
              {hasPremiumCompanies && (
                <span className="mt-2 flex items-center gap-1 text-sm font-semibold text-blue-600">
                  <AnimatedCompareIcon size={16} intensity="subtle" aria-hidden="true" />
                  Incluindo empresas premium destacadas
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onClearAll}
              tabIndex={2}
              className="h-11 rounded-2xl border-slate-200/80 bg-white/85 px-5 text-slate-500 font-bold shadow-[0_14px_40px_-28px_rgba(15,23,42,0.3)] hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={`Limpar todas as ${companiesCount} empresas da comparação`}
            >
              Limpar tudo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
