'use client';

import { ArrowLeft, Scale } from 'lucide-react';
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
    <div className={cn("bg-white border-b border-slate-200 pt-8 pb-12 md:pt-12 md:pb-16 relative overflow-hidden", className)}>
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-50/50 to-transparent pointer-events-none" />
      
      <div className="container mx-auto px-4 relative">
        <Button 
          asChild 
          variant="ghost" 
          className="mb-8 -ml-4 text-slate-400 hover:text-slate-900 font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          tabIndex={1}
          aria-label="Voltar para página de empresas"
        >
          <Link href="/companies" className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Empresas
          </Link>
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-4">
              <Scale className="h-3.5 w-3.5" aria-hidden="true" /> 
              Comparativo Detalhado
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none mb-4">
              Lado a Lado
            </h1>
            
            <p className="text-slate-500 text-lg md:text-xl leading-relaxed">
              Analisamos tecnicamente{' '}
              <span className="text-slate-900 font-bold">{companiesCount} {companiesCount === 1 ? 'empresa' : 'empresas'}</span>
              {' '}para facilitar sua escolha.
              {hasPremiumCompanies && (
                <span className="block mt-2 text-blue-600 font-semibold flex items-center gap-1">
                  <Scale className="h-4 w-4" aria-hidden="true" />
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
              className="h-12 px-6 rounded-xl border-slate-200 text-slate-500 font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
