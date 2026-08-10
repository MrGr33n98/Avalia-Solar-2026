'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BannerSlot } from '@/components/banners/BannerSlot';

type UnifiedHeroBannerProps = {
  categoryName?: string;
  categorySlug?: string;
  companyId?: number;
  companyName?: string;
  className?: string;
};

export function UnifiedHeroBanner({
  categoryName = 'Energia Solar',
  categorySlug,
  companyId,
  companyName,
  className,
}: UnifiedHeroBannerProps) {
  const slotKey = categorySlug ? `category_${categorySlug}_hero` : 'category_hero_unified';

  const defaultContent = (
    <div className={cn('relative overflow-hidden rounded-2xl border border-slate-800 bg-[#070B16] text-white shadow-md', className)}>
      <div
        className="pointer-events-none absolute inset-0 -z-0 opacity-40"
        aria-hidden="true"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 12%, rgba(37,99,235,0.25), transparent 40%), radial-gradient(circle at 90% 82%, rgba(255,200,44,0.15), transparent 35%)',
        }}
      />
      <div className="relative z-10 flex flex-col justify-between p-5 sm:p-6 md:flex-row md:items-center md:gap-6 min-h-[160px] md:min-h-[180px]">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-[#FFC82C] mb-2">
            <Sparkles className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest bg-[#FFC82C]/10 px-2 py-0.5 rounded-full border border-[#FFC82C]/20">
              Solução Patrocinada • {categoryName}
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl text-white">
            Equipamentos e projetos em <span className="text-[#FFC82C]">{categoryName}</span> com garantia estendida
          </h2>
          <p className="mt-1.5 text-xs text-slate-300 sm:text-sm max-w-xl">
            {companyName
              ? `Aproveite as melhores condições e orçamento direto da ${companyName}.`
              : 'Encontre instaladores verificados e receba cotações personalizadas sem compromisso.'}
          </p>
        </div>
        <div className="mt-4 shrink-0 md:mt-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button asChild className="bg-blue-600 font-bold text-white hover:bg-blue-500 shadow-sm" size="sm">
            <Link href="/quote-wizard">
              Solicitar Orçamento <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn('w-full my-4', className)}>
      <BannerSlot
        placement={slotKey}
        companyId={companyId}
        limit={1}
        priority={true}
        fallback={defaultContent}
      />
    </div>
  );
}
