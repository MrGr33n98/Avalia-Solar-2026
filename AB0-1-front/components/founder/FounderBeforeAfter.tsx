'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  ArrowLeftRight,
  MapPin,
} from 'lucide-react';
import { trackFounderBeforeAfter } from './FounderTelemetry';

export default function FounderBeforeAfter() {
  const [sliderPos, setSliderPos] = useState(50); // 0 a 100%
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percent);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    handleMove(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      trackFounderBeforeAfter(sliderPos);
    }
  };

  // Suporte a teclado acessível
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setSliderPos((prev) => Math.max(0, prev - 10));
      trackFounderBeforeAfter(sliderPos - 10);
    } else if (e.key === 'ArrowRight') {
      setSliderPos((prev) => Math.min(100, prev + 10));
      trackFounderBeforeAfter(sliderPos + 10);
    }
  };

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#d0d7de]">
      <div className="max-w-3xl mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#edf5ff] border border-[#d0e2ff] text-xs font-mono text-[#0043ce] uppercase tracking-wider mb-2">
          <ArrowLeftRight className="w-3.5 h-3.5" />
          Comparador Visual · Antes e Depois da Estruturação
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#09172f] tracking-tight">
          A transformação da sua presença: organização e autoridade
        </h2>
        <p className="mt-2 text-sm sm:text-base text-[#475569] leading-relaxed">
          Arraste o divisor central para contrastar um perfil básico não verificado com a Brand Page oficial
          homologada. O comparativo foca estritamente na organização da informação e clareza da proposta de valor.
        </p>

        {/* Botões de Acessibilidade / Alternância Rápida */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-mono">
          <button
            type="button"
            onClick={() => {
              setSliderPos(0);
              trackFounderBeforeAfter(0);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-colors"
          >
            Ver apenas Perfil Básico (0%)
          </button>
          <button
            type="button"
            onClick={() => {
              setSliderPos(50);
              trackFounderBeforeAfter(50);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold transition-colors"
          >
            Divisão Meio a Meio (50%)
          </button>
          <button
            type="button"
            onClick={() => {
              setSliderPos(100);
              trackFounderBeforeAfter(100);
            }}
            className="px-3 py-1.5 rounded-lg border border-[#0f62fe] bg-[#edf5ff] text-[#0f62fe] font-bold transition-colors"
          >
            Ver Brand Page Homologada (100%)
          </button>
        </div>
      </div>

      {/* CONTAINER DO COMPARADOR ARRASTÁVEL (09 Before / After Motion) */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="slider"
        aria-label="Comparador de Perfil Básico versus Brand Page Homologada da SolarMax Integradora"
        aria-valuenow={Math.round(sliderPos)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[580px] rounded-2xl border-2 border-[#09172f] overflow-hidden select-none shadow-2xl bg-slate-900 focus:outline-none focus:ring-4 focus:ring-[#0f62fe]/40 cursor-ew-resize"
      >
        {/* ============================================================ */}
        {/* CAMADA INFERIOR: ESTADO "DEPOIS" (BRAND PAGE OFICIAL HOMOLOGADA) */}
        {/* ============================================================ */}
        <div className="absolute inset-0 bg-[#f4f7fb] text-[#09172f] p-4 sm:p-8 flex flex-col justify-between overflow-hidden">
          {/* Header da Brand Page */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#09172f] text-white font-black text-sm sm:text-base flex items-center justify-center shadow-md">
                  SM
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-base sm:text-lg text-[#09172f]">
                      SolarMax Integradora Solar
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#107c41] text-[10px] font-mono font-bold flex items-center gap-1 border border-emerald-300">
                      <ShieldCheck className="w-3 h-3 text-[#107c41]" />
                      PERFIL VERIFICADO OFICIAL
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#f8ca3a]" /> Campinas, SP
                    </span>
                    <span>·</span>
                    <span className="text-[#f8ca3a] font-bold">★ 4.9 (38 avaliações auditadas)</span>
                  </div>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-[#f8ca3a] text-[#09172f] font-bold text-xs shadow-sm">
                  Solicitar Proposta Direta
                </span>
              </div>
            </div>

            {/* Grid de Conteúdo Estruturado */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#0f62fe] font-bold block mb-1">
                  CATÁLOGO HOMOLOGADO
                </span>
                <h4 className="text-xs font-bold text-[#09172f]">Inversores &amp; Baterias</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Modelos com datasheet técnico, garantias e canais para integradores.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#0f62fe] font-bold block mb-1">
                  PROVA SOCIAL REAL
                </span>
                <h4 className="text-xs font-bold text-[#09172f]">Notas por Critérios</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Qualidade técnica 5.0, prazo 4.8 e depoimentos autenticados.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#107c41] font-bold block mb-1">
                  PROTEÇÃO DE MARCA
                </span>
                <h4 className="text-xs font-bold text-[#09172f]">Sem Anúncios Concorrentes</h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Exclusividade do tráfego: seu cliente não é direcionado a terceiros.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-500">
            <span>BRAND PAGE HOMOLOGADA · PLATAFORMA AVALIA SOLAR 2026</span>
            <span className="text-[#107c41] font-bold">100% IDENTIDADE AZUL PRIME</span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CAMADA SUPERIOR RECORTADA: ESTADO "ANTES" (PERFIL BÁSICO) */}
        {/* ============================================================ */}
        <div
          className="absolute inset-0 bg-[#e2e8f0] text-slate-700 p-4 sm:p-8 flex flex-col justify-between overflow-hidden"
          style={{
            clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
          }}
        >
          {/* Header Desestruturado */}
          <div>
            <div className="flex items-center justify-between border-b border-slate-300 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-slate-300 text-slate-500 font-bold text-xs flex items-center justify-center border border-dashed border-slate-400">
                  SEM FOTO
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base sm:text-lg text-slate-600 line-through">
                      SolarMax - CNPJ 28.***.***
                    </span>
                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-mono font-bold flex items-center gap-1 border border-red-200">
                      <ShieldAlert className="w-3 h-3 text-red-600" />
                      NÃO VERIFICADO
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    Registro não administrado · Sem catálogo vinculado
                  </div>
                </div>
              </div>
            </div>

            {/* Painéis Desorganizados com Anúncio Concorrente */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-100 border border-dashed border-slate-300 opacity-70">
                <span className="text-[10px] font-mono text-slate-400 block mb-1">PRODUTOS</span>
                <p className="text-xs text-slate-400">Nenhum produto cadastrado pela empresa.</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-100 border border-dashed border-slate-300 opacity-70">
                <span className="text-[10px] font-mono text-slate-400 block mb-1">AVALIAÇÕES</span>
                <p className="text-xs text-slate-400">Sem histórico de reputação consolidado.</p>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-900">
                <span className="text-[10px] font-mono font-bold text-amber-800 block mb-1">
                  ANÚNCIO DE CONCORRENTE
                </span>
                <p className="text-xs font-semibold">Empresa Competidora em Campinas</p>
                <span className="text-[10px] text-amber-700 block mt-1">O concorrente atrai o seu visitante.</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-300 flex items-center justify-between text-xs font-mono text-slate-500">
            <span>PERFIL BÁSICO DESORGANIZADO · SEM RETENÇÃO DE MARCA</span>
            <span className="text-red-600 font-bold">SEM PROTEÇÃO DE PERFIL</span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* LINHA DIVISÓRIA ARRASTÁVEL COM HANDLE CIRCULAR */}
        {/* ============================================================ */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_rgba(0,0,0,0.6)] cursor-ew-resize z-30"
          style={{ left: `${sliderPos}%` }}
        >
          {/* Handle Circular Central */}
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#09172f] border-2 border-white shadow-2xl flex items-center justify-center text-white font-bold transition-transform hover:scale-110 active:scale-95">
            <ArrowLeftRight className="w-4 h-4 text-[#f8ca3a]" />
          </div>
        </div>

        {/* LABELS FLUTUANTES (BEFORE / AFTER) */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none">
          <span className="px-2.5 py-1 rounded bg-black/75 backdrop-blur-sm text-white text-[11px] font-mono font-bold uppercase tracking-wider border border-white/20">
            Antes · Perfil Básico
          </span>
        </div>

        <div className="absolute top-3 right-3 z-20 pointer-events-none">
          <span className="px-2.5 py-1 rounded bg-[#09172f]/90 backdrop-blur-sm text-[#f8ca3a] text-[11px] font-mono font-bold uppercase tracking-wider border border-[#f8ca3a]/40 shadow-lg">
            Depois · Brand Page Oficial
          </span>
        </div>
      </div>
    </section>
  );
}
