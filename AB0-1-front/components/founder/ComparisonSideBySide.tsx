'use client';

import React from 'react';
import Image from 'next/image';
import { Maximize2, ShieldCheck, Info } from 'lucide-react';

interface ComparisonSideBySideProps {
  onExpand: (target: 'free' | 'premium') => void;
}

export default function ComparisonSideBySide({ onExpand }: ComparisonSideBySideProps) {
  return (
    <div className="w-full" data-testid="comparison-side-by-side">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* ============================================================ */}
        {/* COLUNA ESQUERDA: PERFIL BÁSICO (FREE) */}
        {/* ============================================================ */}
        <div className="flex flex-col bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          {/* Header da Coluna */}
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-slate-200 text-slate-700 text-xs font-mono font-bold uppercase tracking-wider">
                Antes · Perfil Básico
              </span>
              <span className="text-xs font-mono text-slate-500 hidden sm:inline">
                (modalidade gratuita)
              </span>
            </div>
            <button
              type="button"
              onClick={() => onExpand('free')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors"
              title="Ampliar captura do Perfil Básico"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Ampliar</span>
            </button>
          </div>

          {/* Imagem Proporção 1672:941 */}
          <div className="relative aspect-[1672/941] w-full bg-slate-100 overflow-hidden border-b border-slate-200">
            <Image
              src="/assets/founder/founder-free.webp"
              alt="Captura real da página básica de empresa no Avalia Solar (GoodWe Brasil)"
              width={1672}
              height={941}
              quality={84}
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>

          {/* Descritivo de Recursos */}
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#09172f] mb-1">
                Estrutura Essencial de Presença
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dados cadastrais institucionais, localização, formulário de contato padrão e
                histórico de avaliações recebidas na plataforma.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] font-mono text-slate-500">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Disponível para qualquer integrador ou fabricante cadastrado.</span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* COLUNA DIREITA: BRAND PAGE PREMIUM (PRO) */}
        {/* ============================================================ */}
        <div className="flex flex-col bg-white rounded-2xl border-2 border-[#0043ce]/40 overflow-hidden shadow-md hover:shadow-lg transition-shadow relative">
          {/* Header da Coluna */}
          <div className="px-5 py-4 border-b border-[#0043ce]/20 bg-[#edf5ff] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-[#0043ce] text-white text-xs font-mono font-bold uppercase tracking-wider">
                Depois · Brand Page Premium
              </span>
              <span className="text-xs font-mono text-[#0043ce] font-bold hidden sm:inline">
                (modalidade Premium)
              </span>
            </div>
            <button
              type="button"
              onClick={() => onExpand('premium')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-[#0043ce] hover:text-[#002d9c] bg-white hover:bg-slate-50 rounded-lg border border-[#0043ce]/30 transition-colors font-bold"
              title="Ampliar captura da Brand Page Premium"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Ampliar</span>
            </button>
          </div>

          {/* Imagem Proporção 1672:941 */}
          <div className="relative aspect-[1672/941] w-full bg-slate-900 overflow-hidden border-b border-[#0043ce]/20">
            <Image
              src="/assets/founder/founder-premium.webp"
              alt="Captura ilustrativa da Brand Page Premium no Avalia Solar (GoodWe Brasil)"
              width={1672}
              height={941}
              quality={84}
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>

          {/* Descritivo de Recursos */}
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-[#09172f]">
                  Apresentação Oficial com Catálogo e Mídia
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#107c41] text-[10px] font-mono font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#107c41]" />
                  PREMIUM
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Banner customizado, vitrine expandida de produtos com especificações, materiais
                técnicos para download, portfólio de projetos e canais diretos de contato comercial.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] font-mono text-[#0043ce]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0043ce] shrink-0" />
              <span className="font-semibold">
                Mais recursos de apresentação nesta captura ilustrativa.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
