'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CalendarDays, Pause, Play, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  trackFounderConversionBookingClicked,
  trackFounderConversionCompleted,
  trackFounderConversionPaused,
  trackFounderConversionStarted,
  trackFounderConversionStep,
  trackFounderConversionViewed,
} from './FounderTelemetry';

type Hotspot = { x: number; y: number; caption: string };
type ConversionTourStep = {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  width: number;
  height: number;
  hotspots: Hotspot[];
  zoomScale: number;
  durationMs: number;
};

const STEPS: ConversionTourStep[] = [
  {
    id: 'busca',
    title: 'Sua empresa aparece na pesquisa',
    description:
      'Na busca do Avalia Solar, o visitante pode encontrar sua empresa e iniciar uma solicitação de orçamento diretamente na listagem, quando esse recurso está habilitado.',
    imageSrc: '/assets/avalia-solar-btn-01.webp',
    width: 861,
    height: 634,
    hotspots: [{ x: 0.65, y: 0.5, caption: 'Ponto de contato na busca' }],
    zoomScale: 1.25,
    durationMs: 7000,
  },
  {
    id: 'comparador-rapido',
    title: 'O orçamento também está no comparador',
    description:
      'Enquanto compara empresas e critérios técnicos, o visitante encontra caminhos diretos para solicitar orçamento.',
    imageSrc: '/assets/avalia-solar-btn-02.webp',
    width: 898,
    height: 634,
    hotspots: [
      { x: 0.38, y: 0.71, caption: 'Solicitação para a primeira empresa' },
      { x: 0.57, y: 0.71, caption: 'Solicitação para a segunda empresa' },
    ],
    zoomScale: 1.3,
    durationMs: 9000,
  },
  {
    id: 'recomendacao',
    title: 'Contato no momento da recomendação',
    description:
      'A comparação completa permite apresentar um caminho de contato próximo à recomendação contextual da plataforma.',
    imageSrc: '/assets/avalia-solar-btn-03.webp',
    width: 830,
    height: 632,
    hotspots: [{ x: 0.51, y: 0.115, caption: 'Contato próximo à recomendação' }],
    zoomScale: 1.35,
    durationMs: 7000,
  },
  {
    id: 'comparacao-completa',
    title: 'Sua empresa continua acessível durante a comparação',
    description:
      'Mesmo ao analisar diferentes critérios, o visitante pode identificar os caminhos de solicitação de orçamento disponíveis para cada empresa.',
    imageSrc: '/assets/avalia-solar-btn-03.webp',
    width: 830,
    height: 632,
    hotspots: [
      { x: 0.27, y: 0.95, caption: 'Solicitação para a empresa da primeira coluna' },
      { x: 0.47, y: 0.95, caption: 'Solicitação para a empresa da segunda coluna' },
    ],
    zoomScale: 1.35,
    durationMs: 9000,
  },
  {
    id: 'resumo',
    title: 'Vários pontos de contato. Uma presença empresarial organizada.',
    description:
      'Conheça os pontos de contato apresentados ao longo da busca e das comparações no Avalia Solar.',
    imageSrc: '',
    width: 0,
    height: 0,
    hotspots: [],
    zoomScale: 1,
    durationMs: 10000,
  },
];

const BOOKING_URL = 'https://zbooking.us/6shCH';
const THUMBNAILS = [
  { src: STEPS[0].imageSrc, title: 'Busca de empresas' },
  { src: STEPS[1].imageSrc, title: 'Comparador rápido' },
  { src: STEPS[2].imageSrc, title: 'Comparação completa' },
];

export default function FounderConversionTour() {
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewedOnce = useRef(false);
  const startedOnce = useRef(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [hotspotIndex, setHotspotIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [inView, setInView] = useState(false);
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const step = STEPS[stepIndex];
  const activeHotspot = step.hotspots[hotspotIndex];

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const stopPlayback = useCallback(() => {
    clearTimer();
    setPlaying(false);
  }, [clearTimer]);

  const markViewed = useCallback(() => {
    if (viewedOnce.current) return;
    viewedOnce.current = true;
    trackFounderConversionViewed();
  }, []);

  const showStep = useCallback((index: number, mode: 'manual' | 'autoplay') => {
    const nextIndex = Math.max(0, Math.min(STEPS.length - 1, index));
    setStepIndex(nextIndex);
    setHotspotIndex(0);
    trackFounderConversionStep(STEPS[nextIndex].id, nextIndex + 1, STEPS[nextIndex].title, mode);
    if (nextIndex === STEPS.length - 1) {
      setPlaying(false);
      trackFounderConversionCompleted(STEPS.length);
    }
  }, []);

  const startPlayback = useCallback(
    (mode: 'auto' | 'manual') => {
      if (mode === 'manual') markViewed();
      if (stepIndex === STEPS.length - 1) {
        setStepIndex(0);
        setHotspotIndex(0);
        trackFounderConversionStep(
          STEPS[0].id,
          1,
          STEPS[0].title,
          mode === 'auto' ? 'autoplay' : 'manual'
        );
      }
      setPlaying(true);
      if (mode === 'manual' || !startedOnce.current) {
        trackFounderConversionStarted(mode);
        startedOnce.current = true;
      }
    },
    [markViewed, stepIndex]
  );

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting && !viewedOnce.current) {
          markViewed();
          if (!reducedMotion) startPlayback('auto');
        }
        if (!entry.isIntersecting) stopPlayback();
      },
      { threshold: 0.22 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [markViewed, reducedMotion, startPlayback, stopPlayback]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !step.imageSrc) return;
    const observer = new ResizeObserver(([entry]) => {
      setScreenSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    const screen = section.querySelector<HTMLElement>('[data-tour-screen]');
    if (!screen) return;
    observer.observe(screen);
    return () => observer.disconnect();
  }, [step.imageSrc]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) stopPlayback();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [stopPlayback]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        markViewed();
        stopPlayback();
        showStep(stepIndex + (event.key === 'ArrowRight' ? 1 : -1), 'manual');
      } else if (event.key === ' ' && event.target === section) {
        event.preventDefault();
        if (playing) {
          stopPlayback();
          trackFounderConversionPaused();
        } else startPlayback('manual');
      }
    };
    section.addEventListener('keydown', onKeyDown);
    return () => section.removeEventListener('keydown', onKeyDown);
  }, [markViewed, playing, showStep, startPlayback, stepIndex, stopPlayback]);

  useEffect(() => {
    clearTimer();
    if (!playing || !inView || document.hidden) return;
    const delay = step.hotspots.length
      ? reducedMotion
        ? Math.max(step.durationMs, 8000)
        : step.durationMs / step.hotspots.length
      : step.durationMs;
    timerRef.current = setTimeout(() => {
      if (hotspotIndex < step.hotspots.length - 1) {
        setHotspotIndex((current) => current + 1);
      } else if (stepIndex < STEPS.length - 1) {
        showStep(stepIndex + 1, 'autoplay');
      } else {
        stopPlayback();
      }
    }, delay);
    return clearTimer;
  }, [
    clearTimer,
    hotspotIndex,
    inView,
    playing,
    reducedMotion,
    showStep,
    step,
    stepIndex,
    stopPlayback,
  ]);

  const manualStep = (next: number) => {
    markViewed();
    stopPlayback();
    showStep(next, 'manual');
  };

  const fitted =
    step.imageSrc && screenSize.width && screenSize.height
      ? (() => {
          const scale = Math.min(screenSize.width / step.width, screenSize.height / step.height);
          const width = step.width * scale;
          const height = step.height * scale;
          return {
            left: (screenSize.width - width) / 2,
            top: (screenSize.height - height) / 2,
            width,
            height,
          };
        })()
      : null;
  const focusX = fitted && activeHotspot ? fitted.left + activeHotspot.x * fitted.width : 0;
  const focusY = fitted && activeHotspot ? fitted.top + activeHotspot.y * fitted.height : 0;
  const cameraX = screenSize.width ? (screenSize.width / 2 - focusX) * (step.zoomScale - 1) : 0;
  const cameraY = screenSize.height ? (screenSize.height / 2 - focusY) * (step.zoomScale - 1) : 0;
  const animateCamera = playing && inView && !reducedMotion && Boolean(activeHotspot);

  return (
    <section
      ref={sectionRef}
      id="founder-conversion-tour"
      tabIndex={0}
      aria-label="Tour dos pontos de conversão do Avalia Solar"
      className="border-t border-[#d0d7de] bg-white px-4 py-10 outline-none sm:px-6 sm:py-14 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <header className="mx-auto mb-9 max-w-3xl text-center sm:mb-12">
          <p className="mb-3 inline-flex rounded-full border border-[#d0e2ff] bg-[#edf5ff] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#0043ce]">
            Jornada de conversão · Avalia Solar
          </p>
          <h2 className="text-2xl font-black leading-tight tracking-tight text-[#09172f] sm:text-3xl lg:text-4xl">
            Sua empresa pode ser encontrada em diferentes momentos da decisão.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Da busca inicial à comparação de fornecedores, conheça os espaços onde um visitante pode
            solicitar um orçamento diretamente à sua empresa.
          </p>
        </header>

        <div className="grid items-center gap-7 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)] lg:gap-10">
          <div className="min-w-0">
            {step.imageSrc ? (
              <div className="relative rounded-[22px] border border-slate-300 bg-[#09172f] p-2 shadow-[0_24px_70px_rgba(9,23,47,.20)] sm:rounded-[28px] sm:p-3">
                <div
                  data-tour-screen
                  className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 sm:aspect-[16/10]"
                  aria-label={`Captura demonstrativa: ${step.title}`}
                >
                  <div
                    className="absolute inset-0 will-change-transform"
                    style={{
                      transform: `translate3d(${animateCamera ? cameraX : 0}px, ${animateCamera ? cameraY : 0}px, 0) scale(${animateCamera ? step.zoomScale : 1})`,
                      transformOrigin: `${focusX}px ${focusY}px`,
                      transition: reducedMotion
                        ? 'none'
                        : 'transform 1200ms cubic-bezier(.22,.8,.24,1)',
                    }}
                  >
                    <Image
                      src={step.imageSrc}
                      alt={`Captura real da plataforma Avalia Solar: ${step.title}`}
                      fill
                      quality={82}
                      sizes="(max-width: 1023px) 100vw, 65vw"
                      className="object-contain"
                    />
                    {activeHotspot && fitted && (
                      <motion.div
                        key={`focus-${step.id}-${hotspotIndex}`}
                        className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
                        style={{ left: focusX, top: focusY }}
                        initial={reducedMotion ? false : { scale: 0.84, opacity: 0.55 }}
                        animate={
                          reducedMotion
                            ? { scale: 1, opacity: 1 }
                            : { scale: [0.84, 1.08, 1], opacity: [0.55, 1, 0.9] }
                        }
                        transition={
                          reducedMotion ? { duration: 0 } : { duration: 0.8, ease: 'easeOut' }
                        }
                        aria-hidden="true"
                      >
                        <span className="block h-12 w-12 rounded-xl border-[3px] border-[#f8ca3a] shadow-[0_0_0_5px_rgba(248,202,58,.25)] sm:h-14 sm:w-14" />
                        <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f8ca3a] shadow-[0_0_0_5px_rgba(248,202,58,.28)]" />
                      </motion.div>
                    )}
                  </div>
                  {activeHotspot && (
                    <div className="pointer-events-none absolute bottom-2 left-2 z-20 max-w-[calc(100%-1rem)] rounded-lg border border-[#f8ca3a] bg-[#fff8dc]/95 px-3 py-2 text-xs font-bold text-[#09172f] shadow-md sm:bottom-4 sm:left-4 sm:text-sm">
                      {activeHotspot.caption}
                    </div>
                  )}
                  {activeHotspot && fitted && (
                    <motion.div
                      key={`${step.id}-${hotspotIndex}`}
                      aria-hidden="true"
                      initial={{
                        left: Math.max(12, focusX * 0.18),
                        top: Math.max(12, focusY * 0.18),
                        scale: 0.8,
                        opacity: 0.7,
                      }}
                      animate={{ left: focusX, top: focusY, scale: 1, opacity: 1 }}
                      transition={
                        reducedMotion
                          ? { duration: 0 }
                          : {
                              left: { duration: 1.05, ease: [0.22, 0.8, 0.24, 1] },
                              top: { duration: 1.05, ease: [0.22, 0.8, 0.24, 1] },
                              scale: { duration: 0.35, delay: 0.9 },
                            }
                      }
                      className="pointer-events-none absolute z-30 -translate-x-1/4 -translate-y-1/4 drop-shadow-md"
                    >
                      <svg
                        width="25"
                        height="31"
                        viewBox="0 0 25 31"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M2 2L22.5 19.2L13.6 20.1L9.5 28.5L2 2Z"
                          fill="#09172F"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="absolute -right-2 -top-2 h-3 w-3 rounded-full bg-[#f8ca3a] ring-2 ring-white" />
                    </motion.div>
                  )}
                </div>
                <div
                  className="mx-auto mt-2 h-1.5 w-1/4 rounded-b-full bg-slate-500/70"
                  aria-hidden="true"
                />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3" aria-label="Resumo visual da jornada">
                {THUMBNAILS.map(({ src, title }) => (
                  <figure
                    key={src}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="relative aspect-[4/3] bg-slate-100">
                      <Image
                        src={src}
                        alt={`Captura demonstrativa: ${title}`}
                        fill
                        quality={80}
                        sizes="(max-width: 639px) 90vw, 30vw"
                        className="object-contain"
                      />
                    </div>
                    <figcaption className="px-3 py-2 text-center text-xs font-bold text-[#09172f]">
                      {title}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-bold tabular-nums text-slate-600" aria-live="polite">
                {String(stepIndex + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
              </p>
              <div
                className="flex flex-wrap items-center gap-2"
                aria-label="Selecionar etapa do tour"
              >
                {STEPS.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => manualStep(index)}
                    aria-label={`Ir para etapa ${index + 1}: ${item.title}`}
                    aria-current={stepIndex === index ? 'step' : undefined}
                    className={`h-3 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f62fe] ${stepIndex === index ? 'w-8 bg-[#0f62fe]' : 'w-3 bg-slate-300 hover:bg-slate-400'}`}
                  />
                ))}
              </div>
            </div>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={STEPS.length}
              aria-valuenow={stepIndex + 1}
              aria-label="Progresso do tour"
            >
              <div
                className="h-full rounded-full bg-[#0f62fe] transition-[width] duration-500"
                style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#0f62fe]">
              Etapa {String(stepIndex + 1).padStart(2, '0')}
            </p>
            <h3 className="mt-2 text-xl font-black leading-snug text-[#09172f] sm:text-2xl">
              {step.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              {step.description}
            </p>
            {stepIndex === 4 && (
              <div className="mt-5 grid gap-2 text-sm font-semibold text-[#09172f] sm:grid-cols-1">
                {THUMBNAILS.map(({ title }) => (
                  <span key={title} className="rounded-lg bg-[#f4f7fb] px-3 py-2">
                    {title}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-3">
              {stepIndex === 4 ? (
                <a
                  href={BOOKING_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={trackFounderConversionBookingClicked}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#f8ca3a] px-5 py-3 text-sm font-extrabold text-[#09172f] shadow-sm transition hover:bg-[#fed957] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f62fe]"
                >
                  <CalendarDays className="h-4 w-4" /> Agendar demonstração do Plano Founder
                </a>
              ) : null}
              {stepIndex === 4 && (
                <a
                  href="#tour-interativo"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-[#09172f] hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f62fe]"
                >
                  Conhecer a Brand Page
                </a>
              )}
            </div>
          </div>
        </div>

        <nav
          className="mt-7 flex flex-wrap items-center justify-center gap-3"
          aria-label="Controles do tour de conversão"
        >
          <button
            type="button"
            onClick={() => manualStep(stepIndex - 1)}
            disabled={stepIndex === 0}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-bold text-[#09172f] disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0f62fe]"
          >
            <ArrowLeft className="h-4 w-4" /> Anterior
          </button>
          <button
            type="button"
            onClick={() => {
              if (playing) {
                stopPlayback();
                trackFounderConversionPaused();
              } else startPlayback('manual');
            }}
            className="inline-flex min-h-12 min-w-36 items-center justify-center gap-2 rounded-xl bg-[#09172f] px-4 text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f62fe]"
          >
            {playing ? (
              <>
                <Pause className="h-4 w-4" /> Pausar
              </>
            ) : (
              <>
                <Play className="h-4 w-4" /> Reproduzir
              </>
            )}
          </button>
          {stepIndex === STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                stopPlayback();
                setStepIndex(0);
                setHotspotIndex(0);
                trackFounderConversionStarted('manual');
                trackFounderConversionStep(STEPS[0].id, 1, STEPS[0].title, 'manual');
              }}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-bold text-[#09172f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0f62fe]"
            >
              <RotateCcw className="h-4 w-4" /> Reiniciar tour
            </button>
          ) : (
            <button
              type="button"
              onClick={() => manualStep(stepIndex + 1)}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-bold text-[#09172f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0f62fe]"
            >
              Próximo <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </nav>
        <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">
          Demonstração visual. Os botões nas capturas não enviam solicitações. A disponibilidade dos
          recursos depende das funcionalidades habilitadas para cada empresa.
        </p>
      </div>
    </section>
  );
}
