'use client';

import React from 'react';
import { Megaphone, Compass, Sparkles } from 'lucide-react';

export function DefaultPricingAdBanner() {
  return (
    <div className="relative overflow-hidden w-full h-full min-h-[280px] sm:min-h-[320px] rounded-3xl border border-blue-500/20 bg-gradient-to-br from-brand-blue to-navy p-6 sm:p-8 text-white shadow-xl flex flex-col justify-between group cursor-pointer transition-all duration-300 hover:shadow-brand-blue/10 hover:border-brand-blue/30">
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
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <Compass className="h-3.5 w-3.5 text-white animate-spin-slow" />
          </div>
          <span className="text-xs font-black tracking-wider uppercase text-white/90">
            Avalia <span className="text-brand-blue-light">Solar</span>
          </span>
        </div>
        <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
          Anúncio Local
        </span>
      </div>
    </div>
  );
}
