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
    <div className="bg-white py-8 md:py-12 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 relative">

          {/* Lado esquerdo: título editorial + CTAs de conversão */}
          <div className="max-w-2xl flex-shrink-0 relative z-10">
            <div className="flex items-center gap-2 mb-3.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/80 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 tracking-wider uppercase">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                Blog Editorial
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300" aria-hidden="true" />
              <span className="text-[11px] text-slate-500 font-medium">
                Energia Solar &amp; Mobilidade Elétrica
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-[1.12] tracking-tight [text-wrap:balance]">
              Tudo sobre{' '}
              <span className="text-blue-600">energia solar</span>,{' '}
              economia e sustentabilidade
            </h1>

            <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-lg leading-relaxed font-normal [text-wrap:pretty]">
              Guias práticos, análises do setor fotovoltaico e comparativos imparciais para você tomar a decisão mais inteligente em energia limpa.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                className="bg-[#0047bb] hover:bg-[#003b9d] text-white font-bold rounded-xl px-5 h-10 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                onClick={() => openQuoteWizard({ source: 'blog_hero' })}
              >
                Simular Economia
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-slate-200 text-slate-700 font-semibold px-5 h-10 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all"
                asChild
              >
                <a href="/blog?category=guias">Explorar Guias</a>
              </Button>
            </div>
          </div>

          {/* Lado direito: imagem editorial com cantos suaves sem recorte brusco */}
          <div
            className="hidden md:block relative flex-1 h-[260px] lg:h-[300px] overflow-hidden rounded-2xl border border-slate-200/80 shadow-[0_12px_32px_rgba(15,23,42,0.04)]"
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
