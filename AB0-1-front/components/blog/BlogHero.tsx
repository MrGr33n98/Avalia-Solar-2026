'use client';

import * as React from 'react';
import Image from 'next/image';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { openQuoteWizard } from '@/lib/quote-wizard';

/**
 * BlogHero - Seção Hero do Blog com tipografia editorial no padrão Stripe
 * e preservação integral dos gatilhos de conversão e cotação do Avalia Solar.
 */
export function BlogHero() {
  return (
    <div className="py-6 md:py-10 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 relative">

          {/* Lado esquerdo: título editorial + CTAs de conversão */}
          <div className="max-w-2xl flex-shrink-0 relative z-10">
            <div className="flex items-center gap-2 mb-3.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/90 px-3 py-1 text-[11px] font-bold text-[#155EEF] tracking-wider uppercase">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                Blog Avalia Solar
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300" aria-hidden="true" />
              <span className="text-[11px] text-[#667085] font-medium">
                Energia Solar &amp; Mobilidade Elétrica
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#101114] leading-[1.12] tracking-tight [text-wrap:balance]">
              Tudo sobre{' '}
              <span className="text-[#155EEF]">energia solar</span>,{' '}
              economia e sustentabilidade
            </h1>

            <p className="mt-4 text-sm sm:text-base text-[#667085] max-w-lg leading-relaxed font-normal [text-wrap:pretty]">
              Guias práticos, análises do setor fotovoltaico e comparativos imparciais para você tomar a decisão mais inteligente em energia limpa.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                className="bg-[#FFD21F] hover:bg-[#F5C814] text-[#101114] font-bold rounded-xl px-5 h-11 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 border border-[#F0C51E]"
                onClick={() => openQuoteWizard({ source: 'blog_hero' })}
              >
                Simular Economia
                <ArrowRight className="w-4 h-4 ml-1.5 text-[#101114]" aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-[#E8EAED] bg-white text-[#101114] font-semibold px-5 h-11 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all"
                asChild
              >
                <a href="/blog?category=guias">Explorar Guias</a>
              </Button>
            </div>
          </div>

          {/* Lado direito: imagem editorial com cantos suaves */}
          <div
            className="hidden md:block relative flex-1 h-[260px] lg:h-[300px] overflow-hidden rounded-2xl border border-[#E8EAED] shadow-[0_8px_30px_rgba(16,17,20,0.04)]"
            aria-hidden="true"
          >
            <Image
              src="/images/hero-banner-avalia-solar-v1.png"
              alt="Casa com energia solar e carro elétrico"
              fill
              priority
              sizes="(max-width: 1280px) 50vw, 640px"
              className="object-cover object-center transition-transform duration-700 ease-out hover:scale-[1.015]"
            />
          </div>

        </div>
      </div>
    </div>
  );
}
