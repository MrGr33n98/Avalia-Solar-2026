'use client';

import Image from 'next/image';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, TouchEvent } from 'react';
import styles from './FounderSuccessJourneySection.module.css';

type VisualType = 'category' | 'content' | 'reviews' | 'opportunities' | 'performance' | 'proof' | 'sales';

type JourneyStep = {
  id: string;
  number: string;
  title: string;
  description: string;
  previewLabel: string;
  previewPosition: number;
  visualType: VisualType;
};

const BOOKING_URL = 'https://zbooking.us/6shCH';

const JOURNEY_STEPS: JourneyStep[] = [
  { id: 'categoria', number: '01', title: 'Estratégia de Categoria', description: 'Definimos em quais categorias seus produtos e soluções devem estar presentes para alcançar o público mais relevante.', previewLabel: 'Categorias e catálogo', previewPosition: 25, visualType: 'category' },
  { id: 'seo-conteudo', number: '02', title: 'Estratégia de SEO / Conteúdo', description: 'Trabalhamos palavras-chave, conteúdos com backlinks, descritivos estratégicos e banners para fortalecer a descoberta da sua marca.', previewLabel: 'Conteúdo e materiais técnicos', previewPosition: 12, visualType: 'content' },
  { id: 'reviews', number: '03', title: 'Estratégia de Reviews', description: 'Desenvolvemos estratégias para conquistar avaliações recorrentes, com a meta de uma nova review a cada três meses.', previewLabel: 'Avaliações em destaque', previewPosition: 73, visualType: 'reviews' },
  { id: 'oportunidades', number: '04', title: 'Oportunidades', description: 'As oportunidades comerciais surgem como consequência de um trabalho consistente de posicionamento e reputação no portal.', previewLabel: 'Canal de orçamento', previewPosition: 22, visualType: 'opportunities' },
  { id: 'performance', number: '05', title: 'Apoio em Performance', description: 'Trabalhamos em conjunto com sua equipe para desenvolver estratégias, acompanhar indicadores e evoluir continuamente sua presença.', previewLabel: 'Acompanhamento em conjunto', previewPosition: 48, visualType: 'performance' },
  { id: 'prova-social', number: '06', title: 'Prova Social', description: 'Fortalecemos a autoridade da marca com o quadrante de vendors, divulgação e conquista de selos Avalia Solar.', previewLabel: 'Verificação e reputação', previewPosition: 19, visualType: 'proof' },
  { id: 'sales-enablement', number: '07', title: 'Sales Enablement', description: 'Preparamos vendedores para utilizar avaliações, reputação e insights da Avalia Solar em seus discursos comerciais.', previewLabel: 'Avaliações como apoio comercial', previewPosition: 76, visualType: 'sales' },
];

function JourneySymbol({ type }: { type: VisualType }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className={styles.symbol}>
      {type === 'category' && <g {...common}><rect x="7" y="8" width="14" height="12" rx="3"/><rect x="27" y="8" width="14" height="12" rx="3"/><rect x="7" y="28" width="14" height="12" rx="3"/><path d="M27 30h14M27 36h9M21 14h6M14 20v8" strokeDasharray="2 3"/></g>}
      {type === 'content' && <g {...common}><rect x="8" y="7" width="23" height="32" rx="4"/><path d="M14 15h11M14 21h11M14 27h7"/><circle cx="33" cy="29" r="8"/><path d="m39 35 4 4M29 29h8M33 25v8"/></g>}
      {type === 'reviews' && <g {...common}><path d="m24 6 5.2 10.6 11.7 1.7-8.5 8.3 2 11.7L24 32.8l-10.4 5.5 2-11.7-8.5-8.3 11.7-1.7L24 6Z"/><circle cx="36" cy="36" r="7" fill="#102b50"/><path d="M36 32v4l2.5 1.5"/></g>}
      {type === 'opportunities' && <g {...common}><circle cx="9" cy="12" r="4"/><circle cx="9" cy="36" r="4"/><circle cx="39" cy="24" r="5"/><path d="M13 12c12 0 13 12 21 12M13 36c12 0 13-12 21-12M21 24h9" strokeDasharray="2 3"/></g>}
      {type === 'performance' && <g {...common}><path d="M8 39h33M12 34V23h7v11M23 34V14h7v20M34 34V8h7v26M12 17l9-6 8 2 9-7"/><circle cx="38" cy="6" r="2" fill="currentColor"/></g>}
      {type === 'proof' && <g {...common}><path d="M7 8h16v14H7zM25 8h16v14H25zM7 24h16v16H7zM25 24h16v16H25z"/><path d="m33 26 2.2 4.4 4.8.7-3.5 3.4.8 4.8-4.3-2.3-4.3 2.3.8-4.8-3.5-3.4 4.8-.7L33 26Z" fill="#102b50"/></g>}
      {type === 'sales' && <g {...common}><rect x="7" y="8" width="34" height="26" rx="3"/><path d="M13 15h12M13 20h8M13 27l5-4 4 2 7-7M24 34v6M17 40h14"/><circle cx="34" cy="17" r="4"/><path d="m32.5 17 1 1 2-2"/></g>}
    </svg>
  );
}

export default function FounderSuccessJourneySection() {
  const [activeStep, setActiveStep] = useState(0);
  const stepButtonsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const focusStepRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const step = JOURNEY_STEPS[activeStep];
  const progress = (activeStep / (JOURNEY_STEPS.length - 1)) * 100;

  useEffect(() => {
    if (focusStepRef.current !== activeStep) return;
    stepButtonsRef.current[activeStep]?.focus();
    focusStepRef.current = null;
  }, [activeStep]);

  const selectStep = (index: number) => {
    setActiveStep(Math.max(0, Math.min(JOURNEY_STEPS.length - 1, index)));
  };

  const handleStepKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % JOURNEY_STEPS.length;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + JOURNEY_STEPS.length) % JOURNEY_STEPS.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = JOURNEY_STEPS.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    focusStepRef.current = nextIndex;
    selectStep(nextIndex);
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (touch) touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    const touch = event.changedTouches[0];
    touchStartRef.current = null;
    if (!start || !touch) return;
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) > 52 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
      selectStep(activeStep + (deltaX < 0 ? 1 : -1));
    }
  };

  return (
    <section className={styles.section} aria-labelledby="founder-journey-title">
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>METODOLOGIA FOUNDER</span>
          <h2 id="founder-journey-title">Seu crescimento, passo a passo.</h2>
          <p>Explore as 7 etapas da sua jornada com o Avalia Solar.</p>
        </header>

        <div className={styles.tracker}>
          <div className={styles.progressTrack} aria-hidden="true">
            <span className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <div className={styles.tabs} role="tablist" aria-label="Etapas da metodologia Founder">
            {JOURNEY_STEPS.map((item, index) => (
              <button
                key={item.id}
                ref={(node) => { stepButtonsRef.current[index] = node; }}
                id={`founder-journey-tab-${item.id}`}
                type="button"
                role="tab"
                aria-selected={activeStep === index}
                aria-controls="founder-journey-panel"
                aria-label={`Etapa ${item.number}: ${item.title}`}
                tabIndex={activeStep === index ? 0 : -1}
                className={styles.tab}
                onClick={() => selectStep(index)}
                onKeyDown={(event) => handleStepKeyDown(event, index)}
              >
                <span className={styles.tabNumber}>{item.number}</span>
                <span className={styles.tabTitle}>{item.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div
          id="founder-journey-panel"
          className={styles.panel}
          role="tabpanel"
          aria-labelledby={`founder-journey-tab-${step.id}`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className={styles.copy} key={step.id} aria-live="polite" aria-atomic="true">
            <div className={styles.stepMeta}>
              <span>ETAPA {step.number} / 07</span>
              <JourneySymbol type={step.visualType} />
            </div>
            <h3>Sua jornada Founder</h3>
            <h4>{step.title}</h4>
            <p>{step.description}</p>
            {activeStep === 3 && (
              <p className={styles.guardrail}>As oportunidades são consequência do posicionamento e da reputação. Não há venda de leads ou garantia de contatos.</p>
            )}
            {activeStep === 4 && (
              <p className={styles.guardrail}>Acompanhamento construído em conjunto com sua equipe, sem métricas ou resultados presumidos.</p>
            )}
            {activeStep === JOURNEY_STEPS.length - 1 && (
              <a className={styles.cta} href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                Conhecer o Plano Founder <ArrowUpRight aria-hidden="true" size={17} />
              </a>
            )}
          </div>

          <figure className={styles.preview}>
            <div className={styles.previewHeader}>
              <div><span className={styles.previewEyebrow}>PRÉVIA DA PLATAFORMA</span><strong>Brand Page Avalia Solar</strong></div>
              <span className={styles.previewCount}>{step.number} / 07</span>
            </div>
            <div className={styles.imageFrame}>
              <Image
                src="/assets/brand-page-premium.webp"
                alt="Captura da Brand Page Premium da Solaris Energia, com catálogo, avaliações e canais de contato."
                fill
                sizes="(max-width: 800px) 100vw, 58vw"
                quality={88}
                priority
                unoptimized
                className={styles.previewImage}
                style={{ objectPosition: `50% ${step.previewPosition}%` }}
                draggable={false}
              />
              <span className={styles.focusLabel}><i aria-hidden="true" />{step.previewLabel}</span>
            </div>
            <figcaption>
              {activeStep === 3
                ? 'O canal de orçamento facilita o contato direto; oportunidades dependem da estratégia e do mercado.'
                : activeStep === 4
                  ? 'A presença é acompanhada em conjunto. Esta prévia não representa indicadores de desempenho.'
                  : 'Captura da Brand Page existente com foco visual no recurso relacionado a esta etapa.'}
            </figcaption>
          </figure>
        </div>

        <nav className={styles.navigation} aria-label="Navegação da jornada Founder">
          <button type="button" className={styles.navButton} onClick={() => selectStep(activeStep - 1)} disabled={activeStep === 0}>
            <ArrowLeft aria-hidden="true" size={17} /> Anterior
          </button>
          <span className={styles.stepCount} aria-live="polite">{activeStep + 1} de {JOURNEY_STEPS.length}</span>
          {activeStep < JOURNEY_STEPS.length - 1 ? (
            <button type="button" className={`${styles.navButton} ${styles.nextButton}`} onClick={() => selectStep(activeStep + 1)}>
              Próximo passo <ArrowRight aria-hidden="true" size={17} />
            </button>
          ) : (
            <a className={`${styles.navButton} ${styles.nextButton}`} href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
              Falar com a equipe <ArrowUpRight aria-hidden="true" size={17} />
            </a>
          )}
        </nav>
        <p className={styles.swipeHint}>No celular, deslize a prévia para avançar ou voltar.</p>
      </div>
    </section>
  );
}
