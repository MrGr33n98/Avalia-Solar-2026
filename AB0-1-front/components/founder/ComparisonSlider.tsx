'use client';

import React, { useRef, useCallback } from 'react';
import Image from 'next/image';
import { ArrowLeftRight, Maximize2 } from 'lucide-react';

interface ComparisonSliderProps {
  premiumPercent: number; // 0 a 100
  onPercentChange: (percent: number, method: 'drag' | 'keyboard') => void;
  onDragEnd?: (percent: number) => void;
  onExpand?: (target: 'free' | 'premium') => void;
}

export default function ComparisonSlider({
  premiumPercent,
  onPercentChange,
  onDragEnd,
  onExpand,
}: ComparisonSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Posição visual do divisor (da esquerda para a direita):
  // premiumPercent = 0 => dividerLeft = 100% (100% Free visível)
  // premiumPercent = 50 => dividerLeft = 50% (50/50)
  // premiumPercent = 100 => dividerLeft = 0% (100% Premium visível)
  const dividerLeft = Math.max(0, Math.min(100, 100 - premiumPercent));

  const updateFromPointer = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const rawPercent = (x / rect.width) * 100;
      const clampedPercent = Math.max(0, Math.min(100, rawPercent));
      // Se o cursor está em x%, a porção à direita (Premium) tem largura (100 - x)%
      const newPremiumPercent = Math.round(100 - clampedPercent);
      onPercentChange(newPremiumPercent, 'drag');
    },
    [onPercentChange]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignora se não for suportado
    }
    updateFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    updateFromPointer(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignora
      }
      if (onDragEnd) {
        onDragEnd(premiumPercent);
      }
    }
  };

  // Navegação por teclado acessível
  const handleKeyDown = (e: React.KeyboardEvent) => {
    let nextPercent = premiumPercent;
    let handled = false;

    if (e.key === 'ArrowRight') {
      // Seta direita amplia a visualização do Premium (+5%)
      nextPercent = Math.min(100, premiumPercent + 5);
      handled = true;
    } else if (e.key === 'ArrowLeft') {
      // Seta esquerda amplia a visualização do Básico (-5%)
      nextPercent = Math.max(0, premiumPercent - 5);
      handled = true;
    } else if (e.key === 'Home') {
      nextPercent = 0; // Perfil Básico 100%
      handled = true;
    } else if (e.key === 'End') {
      nextPercent = 100; // Brand Page 100%
      handled = true;
    }

    if (handled) {
      e.preventDefault();
      onPercentChange(nextPercent, 'keyboard');
    }
  };

  return (
    <div className="relative w-full">
      {/* Chips Superiores Fora da Imagem (Sem sobreposição) */}
      <div className="flex items-center justify-between gap-3 pb-3 text-xs font-mono">
        <span className="px-3 py-1 rounded-md bg-slate-100 border border-slate-300 text-slate-700 font-bold uppercase tracking-wider shadow-xs">
          ANTES · PERFIL BÁSICO
        </span>
        <div className="flex items-center gap-2">
          {onExpand && (
            <button
              type="button"
              onClick={() => onExpand(premiumPercent > 50 ? 'premium' : 'free')}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-[#09172f] text-[#f8ca3a] transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f62fe] focus-visible:ring-offset-2"
              title="Ampliar captura em tela cheia"
              aria-label="Ampliar captura em tela cheia"
            >
              <Maximize2 className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
          <span className="px-3 py-1 rounded-md bg-[#0043ce] text-white font-bold uppercase tracking-wider shadow-xs">
            DEPOIS · BRAND PAGE PREMIUM
          </span>
        </div>
      </div>

      {/* Container Principal com Proporção 1672:941 */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="slider"
        aria-label="Divisor de comparação entre Perfil Básico e Brand Page Premium da GoodWe Brasil"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(premiumPercent)}
        aria-valuetext={`${Math.round(premiumPercent)}% da Brand Page Premium visível`}
        className="relative w-full aspect-[1672/941] rounded-2xl border-2 border-[#09172f] overflow-hidden select-none shadow-2xl bg-slate-900 focus:outline-none focus:ring-4 focus:ring-[#0f62fe]/40 cursor-ew-resize touch-none"
      >
        {/* ============================================================ */}
        {/* CAMADA BASE: PERFIL BÁSICO (FREE) À ESQUERDA */}
        {/* ============================================================ */}
        <div className="absolute inset-0 w-full h-full bg-slate-100 overflow-hidden pointer-events-none">
          <Image
            src="/assets/founder/founder-free.webp"
            alt="Captura de tela real do perfil básico gratuito no Avalia Solar (GoodWe Brasil)"
            width={1672}
            height={941}
            quality={84}
            loading="lazy"
            className="w-full h-full object-contain"
            draggable={false}
          />
        </div>

        {/* ============================================================ */}
        {/* CAMADA SUPERIOR MASCARADA: BRAND PAGE PREMIUM À DIREITA */}
        {/* ============================================================ */}
        <div
          className="absolute inset-0 w-full h-full bg-slate-950 overflow-hidden pointer-events-none will-change-[clip-path]"
          style={{
            clipPath: `inset(0 0 0 ${dividerLeft}%)`,
          }}
        >
          <Image
            src="/assets/founder/founder-premium.webp"
            alt="Captura ilustrativa da Brand Page Premium no Avalia Solar (GoodWe Brasil)"
            width={1672}
            height={941}
            quality={84}
            loading="lazy"
            className="w-full h-full object-contain"
            draggable={false}
          />
        </div>

        {/* ============================================================ */}
        {/* LINHA DIVISÓRIA VERTICAL E HANDLE DE ARRASTE (TOUCH-FRIENDLY) */}
        {/* ============================================================ */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_14px_rgba(0,0,0,0.7)] pointer-events-none z-30"
          style={{ left: `${dividerLeft}%` }}
        >
          {/* Handle Circular (Mínimo 44x44px para toque mobile) */}
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#09172f] border-2 border-white shadow-2xl flex items-center justify-center text-white font-bold transition-transform hover:scale-110 active:scale-95">
            <ArrowLeftRight className="w-4 h-4 text-[#f8ca3a]" />
          </div>
        </div>
      </div>
    </div>
  );
}
