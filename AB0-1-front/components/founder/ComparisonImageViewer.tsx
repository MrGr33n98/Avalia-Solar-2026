'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { X, ZoomIn, ZoomOut, ExternalLink } from 'lucide-react';

interface ComparisonImageViewerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'free' | 'premium';
}

export default function ComparisonImageViewer({
  isOpen,
  onClose,
  initialTab = 'premium',
}: ComparisonImageViewerProps) {
  const [activeTab, setActiveTab] = React.useState<'free' | 'premium'>(initialTab);
  const [zoomLevel, setZoomLevel] = React.useState<number>(1);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Sincronizar tab inicial ao abrir
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setZoomLevel(1);
    }
  }, [isOpen, initialTab]);

  // Tecla Escape e bloqueio de scroll
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focar no botão fechar ao abrir
    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentImage =
    activeTab === 'free'
      ? {
          src: '/assets/founder/founder-free.webp',
          fallback: '/assets/founder/founder-free-original.png',
          alt: 'Captura de tela real do perfil básico gratuito no Avalia Solar (GoodWe Brasil)',
          title: 'Antes · Perfil Básico (Gratuito)',
          tag: 'Presença Essencial',
          tagClass: 'bg-slate-700 text-slate-200',
        }
      : {
          src: '/assets/founder/founder-premium.webp',
          fallback: '/assets/founder/founder-premium-original.png',
          alt: 'Captura ilustrativa da Brand Page Premium no Avalia Solar (GoodWe Brasil)',
          title: 'Depois · Brand Page Premium',
          tag: 'Presença Estruturada',
          tagClass: 'bg-[#0f62fe] text-white',
        };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="viewer-modal-title"
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/90 backdrop-blur-md text-white animate-in fade-in duration-200"
      ref={modalRef}
    >
      {/* Barra superior de controles */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-800 bg-slate-900/90 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg bg-slate-800 p-1 border border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab('free')}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-md transition-colors ${
                activeTab === 'free'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Antes · Perfil Básico
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('premium')}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-md transition-colors ${
                activeTab === 'premium'
                  ? 'bg-[#0f62fe] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Depois · Brand Page
            </button>
          </div>

          <span
            id="viewer-modal-title"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-slate-300"
          >
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${currentImage.tagClass}`}>
              {currentImage.tag}
            </span>
            <span>· Imagem em alta resolução (1672 × 941)</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Controles de zoom */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={() => setZoomLevel((prev) => Math.max(0.75, prev - 0.25))}
              className="p-1.5 text-slate-400 hover:text-white rounded"
              title="Reduzir zoom"
              aria-label="Reduzir zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-mono text-slate-300 min-w-[45px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((prev) => Math.min(2.5, prev + 0.25))}
              className="p-1.5 text-slate-400 hover:text-white rounded"
              title="Aumentar zoom"
              aria-label="Aumentar zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Fechar visualizador (Esc)"
            aria-label="Fechar visualizador"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Área central com visualização em alta fidelidade */}
      <main className="flex-1 overflow-auto p-4 sm:p-6 flex items-center justify-center">
        <div
          className="relative transition-transform duration-150 origin-center max-w-full motion-reduce:transition-none"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <div className="relative rounded-xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-900 aspect-[1672/941] w-[min(1440px,94vw)]">
            <Image
              src={currentImage.src}
              alt={currentImage.alt}
              width={1672}
              height={941}
              quality={85}
              loading="lazy"
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
        </div>
      </main>

      {/* Rodapé informativo com CTA */}
      <footer className="px-4 py-2.5 border-t border-slate-800 bg-slate-900/90 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <span className="font-mono text-[11px]">
          {activeTab === 'free'
            ? 'Perfil gratuito: dados cadastrais essenciais, endereço e formulário padrão.'
            : 'Brand Page: catálogo completo, materiais técnicos, canais diretos e destaque institucional.'}
        </span>
        <div className="flex items-center gap-3">
          <a
            href="https://zbooking.us/6shCH"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#f8ca3a] hover:bg-[#e0b528] text-[#09172f] font-bold text-xs transition-colors"
          >
            Agendar apresentação
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </footer>
    </div>
  );
}
