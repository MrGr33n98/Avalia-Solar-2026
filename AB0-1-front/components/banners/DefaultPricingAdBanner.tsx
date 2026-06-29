'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Megaphone, Sparkles } from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';

export function DefaultPricingAdBanner() {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="relative overflow-hidden w-full h-full min-h-[280px] sm:min-h-[320px] rounded-3xl border border-blue-500/20 shadow-xl flex flex-col justify-between group cursor-pointer transition-all duration-300 hover:shadow-brand-blue/10 hover:border-brand-blue/30 bg-slate-950">
      {!imageError ? (
        <div className="absolute inset-0 w-full h-full bg-slate-950 overflow-hidden flex flex-col justify-end">
          <Image
            src="/images/pricing/pricing-ad-preview.webp"
            alt="Preview de Anúncio Avalia Solar"
            width={600}
            height={600}
            loading="lazy"
            sizes="(max-width: 768px) 100vw, 33vw"
            className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
          {/* Overlay gradiente premium para dar contraste e integrar com o card */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />
          
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-wider text-brand-blue-light shadow-sm">
            <Sparkles className="h-3 w-3 text-brand-blue-light animate-pulse" />
            <span>Exemplo de Anúncio</span>
          </div>
          
          <div className="absolute bottom-4 left-4 right-4 z-10">
            <div className="text-[10px] uppercase font-bold text-white/60 tracking-wider">
              Posicionamento Estratégico
            </div>
            <h5 className="text-sm font-black text-white mt-0.5">
              Vitrine de Merchandising Premium
            </h5>
          </div>
        </div>
      ) : (
        /* Fallback de CSS caso a imagem não exista */
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue to-navy p-6 sm:p-8 text-white flex flex-col justify-between">
          {/* Background Decorative elements */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-blue-light/10 rounded-full blur-3xl pointer-events-none group-hover:bg-brand-blue-light/20 transition-all duration-500" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-brand-cyan-light/10 rounded-full blur-2xl pointer-events-none" />

          {/* Header Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold uppercase tracking-wider text-brand-blue-light">
              <Sparkles className="h-3 w-3 text-brand-blue-light animate-pulse" />
              <span>Destaque Premium</span>
            </div>
            <Megaphone className="h-5 w-5 text-white/40 group-hover:rotate-12 transition-transform duration-300" />
          </div>

          {/* Main Copy */}
          <div className="my-auto space-y-3 z-10">
            <h4 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight text-white group-hover:text-brand-blue-light transition-colors duration-300">
              ANUNCIE AQUI!
            </h4>
            <p className="text-sm sm:text-base leading-relaxed text-blue-100 max-w-xs font-medium">
              Sua marca em destaque no maior portal de energia solar e mobilidade elétrica do Brasil.
            </p>
          </div>

          {/* Footer Branding */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="rounded-md bg-white px-2 py-1">
              <BrandLogo className="h-5" sizes="87px" />
            </div>
            <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
              Anúncio Local
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
