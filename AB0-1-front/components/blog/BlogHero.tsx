'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { openQuoteWizard } from '@/lib/quote-wizard';

export function BlogHero() {
  return (
    <div className="bg-white py-10 md:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          {/* Left: Title & CTA */}
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[11px] font-semibold text-blue-600 tracking-widest uppercase">
                Blog
              </span>
              <span className="w-1 h-1 rounded-full bg-gray-300" aria-hidden="true" />
              <span className="text-[11px] text-gray-500 font-medium">
                Energia Solar &amp; Mobilidade Elétrica
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 leading-[1.15] tracking-tight">
              Tudo sobre{' '}
              <span className="text-blue-600">energia solar</span>{' '}
              e sustentabilidade
            </h1>

            <p className="mt-4 text-base text-gray-500 max-w-lg leading-relaxed font-normal">
              Guias práticos, notícias do setor e comparações para ajudar você
              a tomar a melhor decisão em energia limpa.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-none px-5 h-9 shadow-none"
                onClick={() => openQuoteWizard({ source: 'blog_hero' })}
              >
                Simular Economia
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-none border-gray-300 text-gray-700 font-medium px-5 h-9 hover:bg-gray-50 shadow-none"
                asChild
              >
                <a href="/blog?category=guias">Ver Guias</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
