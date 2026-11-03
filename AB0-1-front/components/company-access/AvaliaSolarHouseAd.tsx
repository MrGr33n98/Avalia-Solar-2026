'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Zap, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AvaliaSolarHouseAdProps {
  className?: string;
  source?: string;
}

export function AvaliaSolarHouseAd({
  className,
  source = 'company_access_sidebar',
}: AvaliaSolarHouseAdProps) {
  return (
    <div
      data-testid="avalia-solar-house-ad"
      className={cn(
        'relative flex flex-col justify-between overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-b from-[#0B1F4B] to-[#081534] p-4 text-white shadow-sm transition-all hover:border-slate-300',
        'w-full max-w-[300px] h-[250px] mx-auto',
        className
      )}
    >
      {/* Detalhe sutil de grid/luz decorativa estilo Carbon */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#0755F5]/20 blur-2xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-[#FFB900]/10 blur-xl"
        aria-hidden="true"
      />

      {/* Header do Card com Marca e Badge */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-[#FFB900] text-[#0B1F4B]">
            <Zap className="h-3 w-3 fill-current" />
          </div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-white">
            Avalia Solar <span className="text-[#FFB900]">Ads</span>
          </span>
        </div>
        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-medium tracking-wide text-slate-300 uppercase">
          Divulgação
        </span>
      </div>

      {/* Conteúdo Editorial de Conversão */}
      <div className="relative z-10 my-auto space-y-1.5">
        <p className="text-sm font-bold leading-snug tracking-tight text-white">
          Sua empresa no radar de quem compra energia solar.
        </p>
        <p className="text-[11px] leading-relaxed text-slate-300 line-clamp-2">
          Anuncie para mais de 300.000 clientes e decisores com segmentação por estado e categoria.
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-slate-300">
          <span className="flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 border border-white/10">
            <Target className="h-3 w-3 text-[#FFB900]" />
            Leads B2B
          </span>
          <span className="flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 border border-white/10">
            <TrendingUp className="h-3 w-3 text-[#0755F5]" />
            Alta conversão
          </span>
        </div>
      </div>

      {/* CTA de Ação Comercial */}
      <div className="relative z-10 pt-2 border-t border-white/10">
        <Button
          asChild
          size="sm"
          className="h-8 w-full rounded bg-[#FFB900] text-[#0B1F4B] hover:bg-[#e5a600] font-bold text-xs tracking-wide shadow-none transition-all flex items-center justify-center gap-1.5"
        >
          <Link
            href={`/pricing?utm_source=select_company&utm_medium=sidebar_ad&utm_campaign=${source}`}
          >
            <span>Conhecer Planos de Mídia</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
