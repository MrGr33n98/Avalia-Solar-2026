'use client';

import { ShieldCheck } from 'lucide-react';

import { cn } from '@/lib/utils';

type LandingTrustBannerProps = {
  className?: string;
};

export default function LandingTrustBanner({ className }: LandingTrustBannerProps) {
  return (
    <section className={cn('px-4 md:px-6 py-6', className)}>
      <div className="container mx-auto">
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-5 md:p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/10">
              <ShieldCheck className="h-6 w-6 text-blue-700" />
            </div>
            <div className="space-y-1">
              <p className="text-lg md:text-xl font-semibold text-slate-900">
                Contrate <span className="text-blue-700">empresas confiáveis</span> e negocie mais rápido.
              </p>
              <p className="text-sm md:text-base text-slate-600">
                Encontre dezenas de categorias e compare centenas de empresas especializadas em energia solar em um só lugar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

