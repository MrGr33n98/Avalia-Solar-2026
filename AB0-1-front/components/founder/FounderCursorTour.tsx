'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import {
  trackFounderCtaClick,
  trackFounderTourCompleted,
  trackFounderTourBookingClicked,
  trackFounderTourPaused,
  trackFounderTourRestarted,
  trackFounderTourResumed,
  trackFounderTourStarted,
  trackFounderTourStep,
} from './FounderTelemetry';

const BOOKING_URL = 'https://zbooking.us/6shCH';
const IMAGE_RATIO = 1055 / 1491;
const TOUR_STEPS = [
  { id: 'hero-banner', title: 'Hero Banner Customizável', desc: 'Personalize a apresentação da sua marca com um banner exclusivo, imagens e mensagens institucionais.', pin: [0.033, 0.054], target: [0.39, 0.077], entry: 'left', zoom: 1.22, duration: 1100, legend: 'right' },
  { id: 'verification-seal', title: 'Selo de Verificação', desc: 'Identifique empresas com administração verificada na plataforma, conforme os critérios de elegibilidade.', pin: [0.498, 0.173], target: [0.391, 0.19], entry: 'top', zoom: 1.35, duration: 1000, legend: 'right' },
  { id: 'quote-request', title: 'Solicitar Orçamento', desc: 'Facilite o contato direto entre visitantes e empresas por meio do canal de orçamento.', pin: [0.853, 0.181], target: [0.84, 0.251], entry: 'right', zoom: 1.35, duration: 1050, legend: 'left' },
  { id: 'about-company', title: 'Sobre a Empresa', desc: 'Apresente sua trajetória e ajude visitantes a compreenderem a experiência da sua empresa.', pin: [0.059, 0.335], target: [0.244, 0.34], entry: 'left', zoom: 1.28, duration: 1150, legend: 'right' },
  { id: 'featured-products', title: 'Produtos em Destaque', desc: 'Apresente suas principais soluções com imagens, especificações e acesso aos detalhes.', pin: [0.028, 0.485], target: [0.24, 0.51], entry: 'left', zoom: 1.28, duration: 1200, legend: 'right' },
  { id: 'whatsapp', title: 'Botão WhatsApp', desc: 'Permita que potenciais clientes iniciem uma conversa diretamente com sua empresa.', pin: [0.906, 0.419], target: [0.785, 0.469], entry: 'right', zoom: 1.35, duration: 950, legend: 'left' },
  { id: 'downloadable-materials', title: 'Materiais Baixáveis', desc: 'Disponibilize catálogos, manuais e conteúdos técnicos para apoiar a avaliação de produtos.', pin: [0.916, 0.648], target: [0.766, 0.689], entry: 'right', zoom: 1.32, duration: 1100, legend: 'left' },
  { id: 'featured-reviews', title: 'Avaliações em Destaque', desc: 'Apresente experiências de clientes e construa seu histórico de reputação.', pin: [0.028, 0.669], target: [0.26, 0.687], entry: 'left', zoom: 1.3, duration: 1050, legend: 'right' },
  { id: 'portfolio-projects', title: 'Portfólio e Projetos', desc: 'Organize fotografias e vídeos dos trabalhos realizados para demonstrar a experiência da empresa.', pin: [0.027, 0.811], target: [0.23, 0.82], entry: 'left', zoom: 1.3, duration: 1150, legend: 'right' },
  { id: 'protected-profile', title: 'Perfil Protegido Exclusivo', desc: 'Conheça os recursos de proteção e apresentação exclusiva disponíveis conforme as condições do plano.', pin: [0.035, 0.925], target: [0.26, 0.928], entry: 'bottom', zoom: 1.28, duration: 1100, legend: 'right' },
] as const;

type TourStep = (typeof TOUR_STEPS)[number];
type Camera = { x: number; y: number; scale: number; cursorX: number; cursorY: number; pinX: number; pinY: number };

function useCamera(step: TourStep, viewport: { width: number; height: number }): Camera {
  const canvasWidth = viewport.width;
  const canvasHeight = canvasWidth / IMAGE_RATIO;
  const scale = step.zoom;
  const targetX = step.target[0] * canvasWidth;
  const targetY = step.target[1] * canvasHeight;
  const pinX = step.pin[0] * canvasWidth;
  const pinY = step.pin[1] * canvasHeight;
  const x = Math.min(0, Math.max(viewport.width - canvasWidth * scale, viewport.width / 2 - targetX * scale));
  const y = Math.min(0, Math.max(viewport.height - canvasHeight * scale, viewport.height / 2 - targetY * scale));
  return {
    x,
    y,
    scale,
    cursorX: targetX * scale + x,
    cursorY: targetY * scale + y,
    pinX: Math.min(viewport.width - 12, Math.max(12, pinX * scale + x)),
    pinY: Math.min(viewport.height - 12, Math.max(12, pinY * scale + y)),
  };
}

export function FounderCinematicCursor({ x, y, pinX, pinY, duration, entry, reducedMotion }: { x: number; y: number; pinX: number; pinY: number; duration: number; entry: TourStep['entry']; reducedMotion: boolean }) {
  const entryOffsets = { left: [-24, 0], right: [24, 0], top: [0, -24], bottom: [0, 24] };
  const [offsetX, offsetY] = entryOffsets[entry];
  return (
    <motion.div
      aria-hidden="true"
      data-testid="founder-cinematic-cursor"
      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2"
      animate={reducedMotion ? { left: x, top: y } : { left: [pinX + offsetX, x], top: [pinY + offsetY, y] }}
      transition={reducedMotion ? { duration: 0 } : { duration: duration / 1000, times: [0, 1], ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="absolute -inset-3 rounded-full border-2 border-amber-300/90 shadow-[0_0_24px_rgba(250,204,21,.55)]" />
      <span className="relative block h-4 w-4 rounded-full border-2 border-white bg-amber-400 shadow-lg" />
    </motion.div>
  );
}

export default function FounderCursorTour() {
  const reducedMotion = useReducedMotion();
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const frameRef = useRef<HTMLDivElement>(null);
  const tourRef = useRef<HTMLElement>(null);
  const touchStartX = useRef<number | null>(null);
  const hasStarted = useRef(false);
  const step = TOUR_STEPS[currentStep];
  const camera = useCamera(step, viewport);

  const announceStep = useCallback((index: number, mode: 'manual' | 'autoplay') => {
    const item = TOUR_STEPS[index];
    trackFounderTourStep(index + 1, item.id, item.title, mode);
  }, []);

  const goTo = useCallback((index: number, mode: 'manual' | 'autoplay' = 'manual') => {
    const nextIndex = (index + TOUR_STEPS.length) % TOUR_STEPS.length;
    if (mode === 'manual') {
      setPlaying(false);
      trackFounderTourPaused();
      if (!hasStarted.current) {
        hasStarted.current = true;
        trackFounderTourStarted('manual');
      }
    }
    setCurrentStep(nextIndex);
    announceStep(nextIndex, mode);
    if (nextIndex === TOUR_STEPS.length - 1) trackFounderTourCompleted(TOUR_STEPS.length);
  }, [announceStep]);

  useEffect(() => {
    const element = frameRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setViewport({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // Autoplay acompanha a imagem, não toda a seção (que pode continuar na tela sem o preview).
    const element = frameRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setIsInView(entry.intersectionRatio >= 0.25), {
      threshold: [0, 0.25],
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || !isInView) return;
    const timer = window.setInterval(() => {
      setCurrentStep((current) => {
        const next = (current + 1) % TOUR_STEPS.length;
        announceStep(next, 'autoplay');
        if (next === TOUR_STEPS.length - 1) trackFounderTourCompleted(TOUR_STEPS.length);
        return next;
      });
    }, 6500);
    return () => window.clearInterval(timer);
  }, [playing, isInView, announceStep]);

  const start = () => {
    setPlaying(true);
    if (!hasStarted.current) {
      hasStarted.current = true;
      trackFounderTourStarted('manual');
      announceStep(currentStep, 'manual');
    } else trackFounderTourResumed();
  };

  const restart = () => {
    setPlaying(false);
    setCurrentStep(0);
    hasStarted.current = true;
    trackFounderTourRestarted();
    announceStep(0, 'manual');
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(currentStep + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(currentStep - 1);
    }
  };

  return (
    <section
      id="tour-interativo"
      ref={tourRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="mx-auto max-w-7xl px-4 py-6 outline-none sm:px-6 sm:py-10 lg:px-8 lg:py-14"
      aria-label="Tour interativo da Brand Page Premium"
    >
      <header className="mb-4 max-w-3xl text-left sm:mb-8">
        <div className="mb-2 inline-flex items-center rounded-md border border-[#d0e2ff] bg-[#edf5ff] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#0043ce]">
          Tour interativo · Brand Page Premium
        </div>
        <h2 className="text-[clamp(1.45rem,5vw,1.8rem)] font-bold leading-tight tracking-tight text-[#09172f] sm:text-3xl lg:text-4xl">
          Veja como a Brand Page opera na tela do computador
        </h2>
        <p className="mt-2 text-[13px] leading-5 text-slate-600 sm:mt-3 sm:text-base sm:leading-relaxed">
          Explore os recursos da página real da Solaris Energia. Use os controles ou as setas do teclado.
        </p>
      </header>

      <div className="overflow-hidden rounded-xl border border-[#dde1e6] bg-white lg:grid lg:grid-cols-12 lg:grid-rows-[minmax(0,1fr)_auto_auto]">
        {/* Preview: permanece ao lado do texto no desktop. */}

        <div className="bg-[#f4f7fb] p-2.5 pb-1 sm:p-5 sm:pb-2 lg:col-span-7 lg:col-start-1 lg:row-span-3 lg:row-start-1 lg:p-6">
          <div className="mb-2 flex items-center justify-between gap-3 text-[11px] text-[#475569] sm:text-xs">
            <span className="font-mono">SOLARIS ENERGIA · BRAND PAGE</span>
            <span aria-live="polite" className="font-semibold">{String(currentStep + 1).padStart(2, '0')} / 10</span>
          </div>

          <div
            ref={frameRef}
            className="relative mx-auto aspect-[5/4] w-full max-w-[520px] overflow-hidden rounded-md border border-[#dde1e6] bg-white shadow-sm sm:aspect-[16/10] lg:max-w-none"
            onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }}
            onTouchEnd={(event) => {
              if (touchStartX.current === null) return;
              const delta = event.changedTouches[0].clientX - touchStartX.current;
              if (Math.abs(delta) > 48) goTo(currentStep + (delta < 0 ? 1 : -1));
              touchStartX.current = null;
            }}
            aria-label={`Imagem real da Brand Page, foco em ${step.title}`}
          >
            <motion.div
              className="absolute left-0 top-0 w-full"
              initial={false}
              animate={{ x: camera.x, y: camera.y, scale: camera.scale }}
              transition={reducedMotion ? { duration: 0 } : { duration: step.duration / 1000, ease: [0.16, 1, 0.3, 1] }}
              style={{
                aspectRatio: `${IMAGE_RATIO}`,
                transformOrigin: 'top left',
                willChange: 'transform',
                transform: 'translateZ(0)',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
              }}
            >
              <Image
                src="/assets/brand-page-premium.webp"
                alt="Captura original da Brand Page Premium Solaris Energia, com anotações numeradas dos recursos"
                width={1055}
                height={1491}
                sizes="(max-width: 767px) 92vw, (max-width: 1280px) 60vw, 720px"
                quality={82}
                loading="lazy"
                className="h-full w-full select-none object-fill"
                draggable={false}
              />
            </motion.div>
            {viewport.width > 0 && (
              <FounderCinematicCursor x={camera.cursorX} y={camera.cursorY} pinX={camera.pinX} pinY={camera.pinY} duration={step.duration} entry={step.entry} reducedMotion={Boolean(reducedMotion)} />
            )}
          </div>
          <p className="sr-only lg:not-sr-only lg:mt-2 lg:text-center lg:text-[11px] lg:text-[#66758a]">Imagem original preservada · navegação sem ações externas</p>
        </div>

        {/* Mobile: controles imediatamente abaixo da imagem, sem texto intermediário. */}
        <div data-testid="founder-tour-controls" className="space-y-2 bg-[#f4f7fb] px-2.5 pb-3 pt-1 sm:px-5 sm:pb-4 lg:col-span-5 lg:col-start-8 lg:row-start-2 lg:space-y-3 lg:border-t lg:border-slate-200 lg:bg-white lg:px-7 lg:pb-3 lg:pt-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <button type="button" onClick={() => goTo(currentStep - 1)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-800 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600" aria-label="Recurso anterior"><ArrowLeft className="h-5 w-5" /></button>
              <button type="button" onClick={playing ? () => { setPlaying(false); trackFounderTourPaused(); } : start} className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg bg-[#0f62fe] px-2 text-xs font-bold sm:px-3 sm:text-sm text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                <span className="sm:hidden">{playing ? 'Pausar tour' : 'Reproduzir tour'}</span>
                <span className="hidden sm:inline">{playing ? 'Pausar demonstração' : 'Reproduzir demonstração'}</span>
              </button>
              <button type="button" onClick={() => goTo(currentStep + 1)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-800 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600" aria-label="Próximo recurso"><ArrowRight className="h-5 w-5" /></button>
            </div>

            <div className="grid grid-cols-10 items-center gap-0.5 sm:flex sm:flex-wrap sm:justify-center sm:gap-2" role="group" aria-label="Escolher etapa do tour">
              {TOUR_STEPS.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`Ir para etapa ${index + 1}: ${item.title}`}
                  aria-current={index === currentStep ? 'step' : undefined}
                  className={`founder-tour-step mx-auto flex aspect-square w-full max-w-[30px] min-w-0 min-h-0 items-center justify-center rounded-full border p-0 text-[11px] font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:aspect-auto sm:h-9 sm:w-9 sm:max-w-none sm:text-xs ${index === currentStep ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}
                >{index + 1}</button>
              ))}
            </div>
        </div>

        <div data-testid="founder-tour-details" className="px-4 pb-2 pt-4 sm:px-6 sm:pt-6 lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:px-7 lg:pb-4 lg:pt-7">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 sm:pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Recurso {String(currentStep + 1).padStart(2, '0')}</span>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">Brand Page Premium</span>
            </div>
            <div aria-live="polite" aria-atomic="true" data-caption-position={step.legend} className="pt-3 lg:min-h-[150px] lg:pt-5">
              <h3 className="text-xl font-bold leading-snug text-[#09172f] sm:text-2xl">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 lg:mt-3">{step.desc}</p>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs leading-relaxed text-emerald-900 lg:mt-5 lg:items-start lg:p-3 lg:text-sm">
              <Check className="h-4 w-4 shrink-0 lg:mt-0.5" aria-hidden="true" />
              <span>Explore o ponto indicado na captura original da página.</span>
            </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-4 pt-1 sm:px-6 lg:col-span-5 lg:col-start-8 lg:row-start-3 lg:px-7 lg:pb-6 lg:pt-2">
            <div className="flex w-full flex-wrap items-center justify-between gap-2">
              <button type="button" onClick={restart} className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"><RotateCcw className="h-4 w-4" /> Reiniciar tour</button>
              {currentStep === TOUR_STEPS.length - 1 && (
                <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" onClick={() => { trackFounderTourBookingClicked(); trackFounderCtaClick('founder_tour_booking', BOOKING_URL); }} className="inline-flex min-h-11 max-w-full items-center rounded-lg bg-amber-400 px-3 text-center text-xs font-extrabold text-[#09172f] hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600">
                  Agendar apresentação do Plano Founder
                </a>
              )}
            </div>
        </div>
      </div>
    </section>
  );
}
