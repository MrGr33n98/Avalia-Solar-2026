'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './FounderSuccessJourneySection.module.css';

type VisualType = 'category' | 'content' | 'reviews' | 'opportunities' | 'performance' | 'proof' | 'sales';

type JourneyStep = {
  id: string;
  number: string;
  title: string;
  description: string;
  visualType: VisualType;
};

const JOURNEY_STEPS: JourneyStep[] = [
  { id: 'categoria', number: '01', title: 'Estratégia de Categoria', description: 'Definimos em quais categorias seus produtos e soluções devem estar presentes para alcançar o público mais relevante.', visualType: 'category' },
  { id: 'seo-conteudo', number: '02', title: 'Estratégia de SEO / Conteúdo', description: 'Trabalhamos palavras-chave, conteúdos com backlinks, descritivos estratégicos e banners para fortalecer a descoberta da sua marca.', visualType: 'content' },
  { id: 'reviews', number: '03', title: 'Estratégia de Reviews', description: 'Desenvolvemos estratégias para conquistar avaliações recorrentes, com a meta de uma nova review a cada três meses.', visualType: 'reviews' },
  { id: 'oportunidades', number: '04', title: 'Oportunidades', description: 'As oportunidades comerciais surgem como consequência de um trabalho consistente de posicionamento e reputação no portal.', visualType: 'opportunities' },
  { id: 'performance', number: '05', title: 'Apoio em Performance', description: 'Trabalhamos em conjunto com sua equipe para desenvolver estratégias, acompanhar indicadores e evoluir continuamente sua presença.', visualType: 'performance' },
  { id: 'prova-social', number: '06', title: 'Prova Social', description: 'Fortalecemos a autoridade da marca com o quadrante de vendors, divulgação e conquista de selos Avalia Solar.', visualType: 'proof' },
  { id: 'sales-enablement', number: '07', title: 'Sales Enablement', description: 'Preparamos vendedores para utilizar avaliações, reputação e insights da Avalia Solar em seus discursos comerciais.', visualType: 'sales' },
];

const MILESTONE_FRACTIONS = [0.05, 0.2, 0.35, 0.5, 0.65, 0.8, 0.95] as const;
const JOURNEY_MOTION = { pathDuration: 3000, cycleDuration: 7000, milestoneSpring: 420, checkDuration: 300, cardReveal: 450, completionDelay: 200 } as const;

function JourneySymbol({ type }: { type: VisualType }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className={styles.symbol}>
      {type === 'category' && <g {...common}><rect x="7" y="8" width="14" height="12" rx="3"/><rect x="27" y="8" width="14" height="12" rx="3"/><rect x="7" y="28" width="14" height="12" rx="3"/><path d="M27 30h14M27 36h9"/><path d="M21 14h6M14 20v8" strokeDasharray="2 3"/></g>}
      {type === 'content' && <g {...common}><rect x="8" y="7" width="23" height="32" rx="4"/><path d="M14 15h11M14 21h11M14 27h7"/><circle cx="33" cy="29" r="8"/><path d="m39 35 4 4M29 29h8M33 25v8"/></g>}
      {type === 'reviews' && <g {...common}><path d="m24 6 5.2 10.6 11.7 1.7-8.5 8.3 2 11.7L24 32.8l-10.4 5.5 2-11.7-8.5-8.3 11.7-1.7L24 6Z"/><circle cx="36" cy="36" r="7" fill="#102b50"/><path d="M36 32v4l2.5 1.5"/></g>}
      {type === 'opportunities' && <g {...common}><circle cx="9" cy="12" r="4"/><circle cx="9" cy="36" r="4"/><circle cx="39" cy="24" r="5"/><path d="M13 12c12 0 13 12 21 12M13 36c12 0 13-12 21-12"/><path d="M21 24h9" strokeDasharray="2 3"/></g>}
      {type === 'performance' && <g {...common}><path d="M8 39h33M12 34V23h7v11M23 34V14h7v20M34 34V8h7v26"/><path d="m12 17 9-6 8 2 9-7"/><circle cx="38" cy="6" r="2" fill="currentColor"/></g>}
      {type === 'proof' && <g {...common}><path d="M7 8h16v14H7zM25 8h16v14H25zM7 24h16v16H7zM25 24h16v16H25z"/><path d="m33 26 2.2 4.4 4.8.7-3.5 3.4.8 4.8-4.3-2.3-4.3 2.3.8-4.8-3.5-3.4 4.8-.7L33 26Z" fill="#102b50"/></g>}
      {type === 'sales' && <g {...common}><rect x="7" y="8" width="34" height="26" rx="3"/><path d="M13 15h12M13 20h8M13 27l5-4 4 2 7-7"/><path d="M24 34v6M17 40h14"/><circle cx="34" cy="17" r="4"/><path d="m32.5 17 1 1 2-2"/></g>}
    </svg>
  );
}

export default function FounderSuccessJourneySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const trackRef = useRef<SVGPathElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);
  const anchorsRef = useRef<Array<HTMLSpanElement | null>>([]);
  const cardsRef = useRef<Array<HTMLLIElement | null>>([]);
  const rafRef = useRef<number | null>(null);
  const activeStepRef = useRef(-1);
  const completionRef = useRef(false);
  const geometryRef = useRef<{ length: number; points: Array<{ x: number; y: number }> }>({ length: 0, points: [] });
  const [geometryReady, setGeometryReady] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [completed, setCompleted] = useState(false);

  const measurePath = useCallback(() => {
    const stage = stageRef.current;
    const path = pathRef.current;
    const track = trackRef.current;
    if (!stage || !path || !track) return;
    const bounds = stage.getBoundingClientRect();
    const points = anchorsRef.current.flatMap((anchor) => {
      if (!anchor) return [];
      const rect = anchor.getBoundingClientRect();
      return [{ x: rect.left + rect.width / 2 - bounds.left, y: rect.top + rect.height / 2 - bounds.top }];
    });
    if (points.length !== JOURNEY_STEPS.length) return;
    const d = points.reduce((value, point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      const previous = points[index - 1];
      const middleY = (previous.y + point.y) / 2;
      return `${value} C ${previous.x} ${middleY}, ${point.x} ${middleY}, ${point.x} ${point.y}`;
    }, '');
    track.setAttribute('d', d);
    path.setAttribute('d', d);
    svgRef.current?.setAttribute('viewBox', `0 0 ${bounds.width} ${bounds.height}`);
    const length = path.getTotalLength();
    geometryRef.current = { length, points: MILESTONE_FRACTIONS.map((fraction) => {
      const point = path.getPointAtLength(length * fraction);
      return { x: point.x, y: point.y };
    }) };
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
    stage.style.setProperty('--stage-width', `${bounds.width}px`);
    stage.style.setProperty('--stage-height', `${bounds.height}px`);
    setGeometryReady(true);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const wideLayout = window.matchMedia('(min-width: 1440px)');
    const visibleCards = new Set<number>();
    let inView = false;
    let interacting = false;
    let pageVisible = document.visibilityState === 'visible';
    let cycleStart: number | null = null;
    let pausedAt: number | null = null;

    const layoutObserver = new ResizeObserver(measurePath);
    layoutObserver.observe(stage);
    cardsRef.current.forEach((card) => card && layoutObserver.observe(card));
    measurePath();

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const index = Number((entry.target as HTMLElement).dataset.stepIndex);
        if (entry.isIntersecting) {
          visibleCards.add(index);
          entry.target.classList.add(styles.revealed);
          const furthest = Math.max(activeStepRef.current, index);
          if (furthest !== activeStepRef.current) {
            activeStepRef.current = furthest;
            setActiveStep(furthest);
          }
        }
      });
      if (wideLayout.matches) return;
      const furthest = Math.max(-1, ...visibleCards);
      const path = pathRef.current;
      const { length } = geometryRef.current;
      if (path && length) {
        const progress = MILESTONE_FRACTIONS[furthest] ?? 0;
        path.style.strokeDashoffset = `${length * (1 - progress)}`;
        if (furthest >= 0) {
          const point = path.getPointAtLength(length * progress);
          glowRef.current?.setAttribute('cx', String(point.x));
          glowRef.current?.setAttribute('cy', String(point.y));
        }
      }
      if (visibleCards.size === JOURNEY_STEPS.length && !completionRef.current) {
        completionRef.current = true;
        setCompleted(true);
      }
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

    cardsRef.current.forEach((card, index) => {
      if (!card) return;
      card.dataset.stepIndex = String(index);
      if (!wideLayout.matches && !reducedMotion.matches) {
        card.classList.remove(styles.revealed);
        revealObserver.observe(card);
      } else {
        card.classList.add(styles.revealed);
        visibleCards.add(index);
      }
    });
    if (reducedMotion.matches) {
      activeStepRef.current = JOURNEY_STEPS.length - 1;
      completionRef.current = true;
      setActiveStep(JOURNEY_STEPS.length - 1);
      setCompleted(true);
      if (pathRef.current) pathRef.current.style.strokeDashoffset = '0';
    }

    const visibilityChanged = () => {
      pageVisible = document.visibilityState === 'visible';
      if (pageVisible && inView && !reducedMotion.matches && wideLayout.matches && !interacting && rafRef.current === null) {
        rafRef.current = requestAnimationFrame(drawFrame);
      }
    };

    const drawFrame = (now: number) => {
      rafRef.current = null;
      if (reducedMotion.matches || !wideLayout.matches || !inView || !pageVisible || interacting) {
        if (!interacting) cycleStart = null;
        return;
      }
      if (cycleStart === null) cycleStart = now;
      const elapsed = now - cycleStart;
      const drawProgress = Math.min(elapsed / JOURNEY_MOTION.pathDuration, 1);
      const path = pathRef.current;
      const { length } = geometryRef.current;
      if (path && length) {
        const eased = drawProgress;
        path.style.strokeDashoffset = `${length * (1 - eased)}`;
        const point = path.getPointAtLength(length * eased);
        glowRef.current?.setAttribute('cx', String(point.x));
        glowRef.current?.setAttribute('cy', String(point.y));
        const reached = MILESTONE_FRACTIONS.reduce((last, fraction, index) => eased >= fraction ? index : last, -1);
        if (activeStepRef.current !== reached) {
          activeStepRef.current = reached;
          setActiveStep(reached);
        }
        cardsRef.current.forEach((card, index) => card?.classList.toggle(styles.revealed, index <= reached));
        const isComplete = elapsed >= JOURNEY_MOTION.pathDuration + JOURNEY_MOTION.completionDelay;
        if (completionRef.current !== isComplete) {
          completionRef.current = isComplete;
          setCompleted(isComplete);
        }
      }
      if (elapsed >= JOURNEY_MOTION.cycleDuration) {
        cycleStart = now;
        activeStepRef.current = -1;
        completionRef.current = false;
        setActiveStep(-1);
        setCompleted(false);
        cardsRef.current.forEach((card) => card?.classList.remove(styles.revealed));
        if (path) path.style.strokeDashoffset = `${length}`;
      }
      rafRef.current = requestAnimationFrame(drawFrame);
    };
    const syncAnimation = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (!reducedMotion.matches && wideLayout.matches && inView && pageVisible && !interacting) rafRef.current = requestAnimationFrame(drawFrame);
    };
    const onInteractionStart = () => { interacting = true; pausedAt = performance.now(); syncAnimation(); };
    const onInteractionEnd = () => {
      interacting = false;
      if (pausedAt !== null && cycleStart !== null) cycleStart += performance.now() - pausedAt;
      pausedAt = null;
      syncAnimation();
    };
    const onLayoutChange = () => {
      measurePath();
      visibleCards.clear();
      cardsRef.current.forEach((card, index) => {
        if (!card) return;
        if (wideLayout.matches || reducedMotion.matches) {
          revealObserver.unobserve(card);
          card.classList.add(styles.revealed);
          visibleCards.add(index);
        } else {
          card.classList.remove(styles.revealed);
          revealObserver.observe(card);
        }
      });
      syncAnimation();
    };
    section.addEventListener('mouseenter', onInteractionStart);
    section.addEventListener('mouseleave', onInteractionEnd);
    section.addEventListener('focusin', onInteractionStart);
    section.addEventListener('focusout', onInteractionEnd);
    wideLayout.addEventListener('change', onLayoutChange);
    reducedMotion.addEventListener('change', onLayoutChange);
    const inViewObserver = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; syncAnimation(); });
    inViewObserver.observe(section);
    syncAnimation();
    setHydrated(true);
    document.addEventListener('visibilitychange', visibilityChanged);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      layoutObserver.disconnect();
      revealObserver.disconnect();
      inViewObserver.disconnect();
      document.removeEventListener('visibilitychange', visibilityChanged);
      section.removeEventListener('mouseenter', onInteractionStart);
      section.removeEventListener('mouseleave', onInteractionEnd);
      section.removeEventListener('focusin', onInteractionStart);
      section.removeEventListener('focusout', onInteractionEnd);
      wideLayout.removeEventListener('change', onLayoutChange);
      reducedMotion.removeEventListener('change', onLayoutChange);
    };
  }, [measurePath]);

  return (
    <section ref={sectionRef} className={`${styles.section} ${hydrated ? styles.enhanced : ''}`} aria-labelledby="founder-journey-title">
      <div className={styles.container}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>METODOLOGIA FOUNDER</span>
          <h2 id="founder-journey-title">Jornada de Sucesso em 7 Passos</h2>
          <p>Conheça a metodologia que conecta posicionamento, visibilidade, reputação e inteligência comercial para fortalecer sua presença no mercado.</p>
          <span className={styles.collaboration}>Uma estratégia construída em conjunto com a Avalia Solar.</span>
        </header>
        <div className={styles.stage} ref={stageRef}>
          <svg ref={svgRef} className={styles.pathSvg} data-ready={geometryReady} viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <path ref={trackRef} className={styles.track} data-testid="journey-track" d="" />
            <path ref={pathRef} className={styles.progress} data-testid="journey-progress" d="" />
            {geometryRef.current.points.map((point, index) => (
              <g key={JOURNEY_STEPS[index].id} transform={`translate(${point.x} ${point.y})`} className={index <= activeStep ? styles.milestoneActive : styles.milestone}>
                <circle className={styles.nodeHalo} r="19" />
                <circle className={styles.node} r="12" />
                <text className={styles.nodeNumber} y="0.5">{JOURNEY_STEPS[index].number}</text>
                <path className={styles.check} d="m-4 0 3 3 6-7" />
              </g>
            ))}
            <circle ref={glowRef} className={styles.glowDot} r="5" cx="0" cy="0" />
          </svg>
          <ol className={styles.steps}>
            {JOURNEY_STEPS.map((step, index) => (
              <li className={styles.step} key={step.id} ref={(node) => { cardsRef.current[index] = node; }}>
                <span className={styles.anchor} ref={(node) => { anchorsRef.current[index] = node; }} aria-hidden="true"><span>{step.number}</span></span>
                <article className={styles.card}>
                  <div className={styles.cardTop}><span className={styles.cardNumber}>{step.number}</span><JourneySymbol type={step.visualType} /></div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              </li>
            ))}
          </ol>
        </div>
        <div className={`${styles.completion} ${completed ? styles.completionVisible : ''}`} aria-hidden={!completed}>
          <span className={styles.completionDot} />Sua estratégia está em movimento
        </div>
      </div>
    </section>
  );
}
