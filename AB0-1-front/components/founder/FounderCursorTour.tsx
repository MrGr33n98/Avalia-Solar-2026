'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  Layers,
  Star,
  PhoneCall,
  EyeOff,
  MessageSquare,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Info,
  MapPin,
} from 'lucide-react';
import {
  trackFounderTourStarted,
  trackFounderTourStep,
  trackFounderTourCompleted,
  trackFounderTourPaused,
  trackFounderTourResumed,
  trackFounderCtaClick,
} from './FounderTelemetry';

const BOOKING_URL = 'https://zbooking.us/6shCH';
const EASING_CUBIC = [0.16, 1, 0.3, 1] as const;

export interface TourStepConfig {
  id: string;
  stepNumber: string;
  icon: React.ReactNode;
  title: string;
  tag: string;
  tagType: 'base' | 'pro' | 'exclusive';
  desc: string;
  benefit: string;
  where: string;
  // Coordenadas relativas à tela interna para foco e cursor [x%, y%]
  cursorPos: { x: number; y: number };
  zoomOrigin: string; // ex: 'top left', 'center right'
  zoomScale: number;
}

const TOUR_STEPS: TourStepConfig[] = [
  {
    id: 'identity',
    stepNumber: '01 / 07',
    icon: <Sparkles className="w-5 h-5 text-amber-500" />,
    title: 'Identidade e Brand Page Empresarial',
    tag: 'Incluso no Lançamento',
    tagType: 'base',
    desc: 'Perfil institucional oficial com logotipo em alta definição, banner corporativo, CNPJ auditado, especialidades técnicas e endereço regional homologado pela Avalia Solar.',
    benefit: 'Gera autoridade instantânea e indexação técnica nos motores de busca.',
    where: 'Topo da Brand Page · Banner oficial e cabeçalho verificado',
    cursorPos: { x: 38, y: 22 },
    zoomOrigin: '35% 20%',
    zoomScale: 1.15,
  },
  {
    id: 'products',
    stepNumber: '02 / 07',
    icon: <Layers className="w-5 h-5 text-blue-500" />,
    title: 'Catálogo de Produtos Fotovoltaicos',
    tag: 'Incluso no Lançamento',
    tagType: 'base',
    desc: 'Vitrine técnica para inversores híbridos, bancos de baterias e módulos solares homologados. Cada produto conta com especificações, datasheet e solicitação de orçamento direto.',
    benefit: 'Compradores encontram os modelos exatos que sua empresa instala e distribui.',
    where: 'Bloco central · Grade de produtos e soluções técnicas',
    cursorPos: { x: 32, y: 52 },
    zoomOrigin: '30% 52%',
    zoomScale: 1.16,
  },
  {
    id: 'reviews',
    stepNumber: '03 / 07',
    icon: <Star className="w-5 h-5 text-amber-400" />,
    title: 'Reputação e Avaliações de Clientes Reais',
    tag: 'Incluso no Lançamento',
    tagType: 'base',
    desc: 'Depoimentos autênticos auditados com pontuações detalhadas por critérios: Qualidade Técnica, Atendimento, Prazo de Entrega e Custos/Transparência.',
    benefit: 'A prova social autêntica elimina a desconfiança e acelera a decisão de compra.',
    where: 'Seção de avaliações · Mural público com nota ponderada e comentários',
    cursorPos: { x: 35, y: 78 },
    zoomOrigin: '32% 75%',
    zoomScale: 1.15,
  },
  {
    id: 'contacts',
    stepNumber: '04 / 07',
    icon: <PhoneCall className="w-5 h-5 text-emerald-500" />,
    title: 'Canais de Contato e Conversão Direta',
    tag: 'Incluso no Lançamento',
    tagType: 'base',
    desc: 'Botões diretos para WhatsApp corporativo, telefone e formulário de orçamento próprio. Zero cobrança de comissão sobre negócios fechados e sem taxas ocultas por lead.',
    benefit: 'O interessado fala diretamente com seu time comercial sem intermediários.',
    where: 'Coluna lateral direita · Painel fixo de contato e solicitação',
    cursorPos: { x: 80, y: 32 },
    zoomOrigin: '80% 30%',
    zoomScale: 1.16,
  },
  {
    id: 'exclusive',
    stepNumber: '05 / 07',
    icon: <EyeOff className="w-5 h-5 text-indigo-500" />,
    title: 'Perfil Protegido sem Anúncios Concorrentes',
    tag: 'Plano Habilitado',
    tagType: 'exclusive',
    desc: 'No plano ativo da sua empresa, o espaço da Brand Page é 100% exclusivo: banners, sugestões e links de empresas concorrentes são totalmente bloqueados na sua página.',
    benefit: 'Retenção absoluta do visitante dentro da sua proposta de valor.',
    where: 'Painel de segurança · Blindagem contra anúncios laterais',
    cursorPos: { x: 80, y: 54 },
    zoomOrigin: '80% 54%',
    zoomScale: 1.15,
  },
  {
    id: 'projects',
    stepNumber: '06 / 07',
    icon: <MessageSquare className="w-5 h-5 text-cyan-500" />,
    title: 'Portfólio de Obras e FAQ Técnica',
    tag: 'Configuração Avançada',
    tagType: 'pro',
    desc: 'Galeria visual de projetos executados (usinas de solo, coberturas solares, carports) acompanhada por módulo de perguntas frequentes para sanar as dúvidas do cliente.',
    benefit: 'Comprova sua capacidade de entrega em projetos reais já conectados.',
    where: 'Painel inferior · FAQ estruturada e cases de engenharia',
    cursorPos: { x: 80, y: 78 },
    zoomOrigin: '80% 75%',
    zoomScale: 1.14,
  },
  {
    id: 'analytics',
    stepNumber: '07 / 07',
    icon: <BarChart3 className="w-5 h-5 text-violet-500" />,
    title: 'Inteligência e Métricas de Demanda',
    tag: 'Dashboard Privado',
    tagType: 'pro',
    desc: 'Painel privado com relatórios de visualizações da página, cliques em WhatsApp, conversão de contatos e origens geográficas de interesse no seu perfil.',
    benefit: 'Dados claros para nortear suas ações comerciais e investimentos em vendas.',
    where: 'Dashboard administrativo da empresa · Acesso restrito via login corporativo',
    cursorPos: { x: 50, y: 50 },
    zoomOrigin: '50% 50%',
    zoomScale: 1.05,
  },
];

export default function FounderCursorTour() {
  const shouldReduceMotion = useReducedMotion();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [manualInteraction, setManualInteraction] = useState(false);
  const [clickEffect, setClickEffect] = useState(false);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const step = TOUR_STEPS[currentStep];

  // Interrompe autoplay com aviso de interação manual
  const pauseTour = useCallback((manual = true) => {
    setIsPlaying(false);
    if (manual) {
      setManualInteraction(true);
      trackFounderTourPaused();
    }
  }, []);

  const resumeTour = useCallback(() => {
    setIsPlaying(true);
    setManualInteraction(false);
    trackFounderTourResumed();
  }, []);

  const goToStep = useCallback(
    (nextIdx: number, fromManual = true) => {
      if (fromManual) {
        pauseTour(true);
      }
      setCurrentStep(nextIdx);
      setClickEffect(true);
      setTimeout(() => setClickEffect(false), 500);

      const targetStep = TOUR_STEPS[nextIdx];
      trackFounderTourStep(nextIdx + 1, targetStep.id, targetStep.title);

      if (nextIdx === TOUR_STEPS.length - 1) {
        trackFounderTourCompleted(TOUR_STEPS.length);
      }
    },
    [pauseTour]
  );

  const handleNext = useCallback(() => {
    goToStep((currentStep + 1) % TOUR_STEPS.length, true);
  }, [currentStep, goToStep]);

  const handlePrev = useCallback(() => {
    goToStep((currentStep - 1 + TOUR_STEPS.length) % TOUR_STEPS.length, true);
  }, [currentStep, goToStep]);

  // Autoplay cíclico a cada 6 segundos caso não haja interação manual
  useEffect(() => {
    if (!isPlaying || shouldReduceMotion) {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
      return;
    }

    autoplayTimerRef.current = setInterval(() => {
      setCurrentStep((prev) => {
        const next = (prev + 1) % TOUR_STEPS.length;
        setClickEffect(true);
        setTimeout(() => setClickEffect(false), 500);
        const target = TOUR_STEPS[next];
        trackFounderTourStep(next + 1, target.id, target.title);
        if (next === TOUR_STEPS.length - 1) {
          trackFounderTourCompleted(TOUR_STEPS.length);
        }
        return next;
      });
    }, 6000);

    return () => {
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    };
  }, [isPlaying, shouldReduceMotion]);

  // Navegação por teclado acessível
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  // Registro inicial do tour
  useEffect(() => {
    trackFounderTourStarted('auto');
  }, []);

  return (
    <section id="tour-interativo" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Cabeçalho da Seção com Estética IBM Carbon */}
      <div className="mb-10 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#edf5ff] border border-[#d0e2ff] text-xs font-mono text-[#0043ce] uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#0043ce]" />
          Tour Interativo Guiado · Perfil Fictício SolarMax Integradora
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#09172f] tracking-tight">
          Veja como a Brand Page opera na tela do computador
        </h2>
        <p className="mt-3 text-sm sm:text-base text-[#475569] leading-relaxed">
          O cursor animado percorre as 7 áreas estratégicas da página empresarial. Você pode
          assumir o controle manual a qualquer momento usando os botões ou as teclas do teclado.
        </p>

        {/* Aviso de Dados Ilustrativos */}
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-50 border border-amber-200 text-xs font-mono text-amber-900">
          <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>Dados ilustrativos da empresa fictícia SolarMax Integradora para fins demonstrativos.</span>
        </div>
      </div>

      {/* CONTAINER DO NOTEBOOK + PAINEL DE CONTROLE (12 Colunas) */}
      <div className="rounded-2xl border border-[#d0d7de] bg-white shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* LADO ESQUERDO: NOTEBOOK VIEWPORT (7 colunas) */}
        <div className="lg:col-span-7 bg-[#0b1934] p-4 sm:p-8 flex flex-col justify-center items-center relative overflow-hidden">
          {/* Malha de fundo sutil */}
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
            aria-hidden="true"
          />

          {/* Barra de Status do Tour & Controle de Play/Pause */}
          <div className="w-full max-w-[680px] mb-3 flex items-center justify-between text-xs font-mono text-[#8a99b5]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={isPlaying ? () => pauseTour(true) : resumeTour}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] transition-colors border border-white/15"
                aria-label={isPlaying ? 'Pausar demonstração automática' : 'Retomar demonstração automática'}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3 h-3 text-[#f8ca3a]" />
                    <span>Pausar Tour</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 text-[#107c41]" />
                    <span>Reproduzir Tour</span>
                  </>
                )}
              </button>

              {manualInteraction && !isPlaying && (
                <span className="text-[11px] text-[#f8ca3a] flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f8ca3a]" />
                  Controle manual ativo
                </span>
              )}
            </div>

            <span className="text-[11px] text-[#8a99b5]">
              PASSO {currentStep + 1} DE {TOUR_STEPS.length}
            </span>
          </div>

          {/* MOLDURA EXTERNA DO NOTEBOOK (1024x768 - Aspect 4/3) */}
          <div
            className="relative w-full max-w-[680px] aspect-[4/3] rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-[#030712] cursor-pointer"
            onClick={() => pauseTour(true)}
          >
            {/* Imagem de Fundo do Notebook Real */}
            <Image
              src="/assets/founder-laptop.jpg"
              alt="Notebook MacBook exibindo a Brand Page da SolarMax Integradora no Avalia Solar"
              fill
              sizes="(max-width: 1024px) 100vw, 680px"
              className="object-contain pointer-events-none select-none"
              priority
            />

            {/* ÁREA DA TELA DO LAPTOP (recorte geométrico exato sobre a imagem 1024x768) */}
            <div
              className="absolute overflow-hidden rounded-[2px] bg-[#f8fafc] text-[#09172f]"
              style={{
                left: '12.3%',
                top: '4.8%',
                width: '75.4%',
                height: '77.0%',
              }}
            >
              {/* CONTAINER COM ZOOM DINÂMICO CONTROLADO (Screen Studio Style) */}
              <motion.div
                className="w-full h-full relative"
                animate={
                  shouldReduceMotion
                    ? { scale: 1, x: 0, y: 0 }
                    : {
                        scale: step.zoomScale,
                      }
                }
                transition={{ duration: 0.7, ease: EASING_CUBIC }}
                style={{ transformOrigin: step.zoomOrigin }}
              >
                {/* CONTEÚDO DA BRAND PAGE (ETAPAS 1 A 6) OU DASHBOARD PRIVADO (ETAPA 7) */}
                {step.id !== 'analytics' ? (
                  <div className="w-full h-full text-[7px] leading-tight flex flex-col bg-[#f4f7fb] overflow-hidden select-none">
                    {/* Barra de Navegador Fictícia */}
                    <div className="bg-[#e2e8f0] border-b border-[#cbd5e1] px-2 py-0.5 flex items-center justify-between text-[6px] font-mono text-[#475569]">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                        <span className="ml-1 text-[#64748b]">avaliasolar.com.br/empresas/solarmax-integradora</span>
                      </div>
                      <span className="text-[#0f62fe] font-semibold">HOMOLOGADO</span>
                    </div>

                    {/* Banner Superior Corporativo da SolarMax */}
                    <div className="relative bg-gradient-to-r from-[#09172f] via-[#0f2c5d] to-[#164387] text-white p-2 flex items-center justify-between border-b border-slate-300">
                      <div className="flex items-center gap-2">
                        {/* Logo SolarMax Integradora */}
                        <div className="w-7 h-7 rounded bg-white text-[#09172f] font-black text-[9px] flex items-center justify-center shadow">
                          SM
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-[8.5px] text-white tracking-tight">SolarMax Integradora</span>
                            <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[5.5px] font-mono font-bold">
                              VERIFICADO
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[#cbd5e1] text-[6px]">
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-1.5 h-1.5 text-[#f8ca3a]" /> Campinas, SP
                            </span>
                            <span>·</span>
                            <span>Desde 2018</span>
                            <span>·</span>
                            <span className="text-[#f8ca3a] font-bold">★ 4.9 (38 avaliações)</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded bg-[#f8ca3a] text-[#09172f] font-bold text-[6px]">
                          Solicitar Proposta
                        </span>
                      </div>
                    </div>

                    {/* Abas da Brand Page */}
                    <div className="bg-white border-b border-slate-200 px-2 py-0.5 flex items-center gap-2 text-[6px] font-medium text-slate-600">
                      <span className="text-[#0f62fe] font-bold border-b-2 border-[#0f62fe] pb-0.5">Visão Geral</span>
                      <span>Catálogo Técnico</span>
                      <span>Avaliações</span>
                      <span>Projetos Realizados</span>
                      <span>Contato</span>
                    </div>

                    {/* Corpo em Duas Colunas da Brand Page */}
                    <div className="p-2 grid grid-cols-12 gap-2 flex-1 overflow-hidden">
                      {/* Coluna Esquerda: Sobre, Produtos e Avaliações (8 colunas) */}
                      <div className="col-span-8 space-y-1.5">
                        {/* Bloco Sobre a Empresa */}
                        <div
                          className={`p-1.5 rounded bg-white border transition-all ${
                            step.id === 'identity'
                              ? 'border-[#f8ca3a] shadow-md ring-2 ring-[#f8ca3a]/50'
                              : 'border-slate-200'
                          }`}
                        >
                          <span className="font-bold text-[7px] text-[#09172f] block">Sobre a SolarMax</span>
                          <p className="text-[5.5px] text-slate-500 mt-0.5 line-clamp-2">
                            Empresa especializada em engenharia fotovoltaica, projetos residenciais e usinas
                            comerciais de alto rendimento no estado de São Paulo.
                          </p>
                        </div>

                        {/* Bloco de Produtos em Grade */}
                        <div
                          className={`p-1.5 rounded bg-white border transition-all ${
                            step.id === 'products'
                              ? 'border-[#f8ca3a] shadow-md ring-2 ring-[#f8ca3a]/50'
                              : 'border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-[7px] text-[#09172f]">Catálogo de Soluções</span>
                            <span className="text-[5.5px] text-[#0f62fe]">4 homologados</span>
                          </div>

                          <div className="grid grid-cols-2 gap-1 text-[5.5px]">
                            <div className="p-1 rounded border border-slate-100 bg-slate-50">
                              <span className="font-bold text-slate-800 block truncate">Inversor Híbrido 8kW</span>
                              <span className="text-slate-500 text-[5px]">Eficiência 98.4%</span>
                            </div>
                            <div className="p-1 rounded border border-slate-100 bg-slate-50">
                              <span className="font-bold text-slate-800 block truncate">Bateria LFP 10kWh</span>
                              <span className="text-slate-500 text-[5px]">Armazenamento</span>
                            </div>
                          </div>
                        </div>

                        {/* Bloco de Avaliações Auditadas */}
                        <div
                          className={`p-1.5 rounded bg-white border transition-all ${
                            step.id === 'reviews'
                              ? 'border-[#f8ca3a] shadow-md ring-2 ring-[#f8ca3a]/50'
                              : 'border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-bold text-[7px] text-[#09172f]">Avaliações de Clientes</span>
                            <span className="text-[#f8ca3a] font-bold text-[6px]">★ 4.9 Geral</span>
                          </div>
                          <div className="p-1 rounded bg-slate-50 border border-slate-100 text-[5.5px]">
                            <div className="flex items-center justify-between font-semibold text-slate-700">
                              <span>Marcos V. · Indústria Têxtil</span>
                              <span className="text-amber-500">★ 5.0</span>
                            </div>
                            <p className="text-slate-500 text-[5px] mt-0.5">
                              Instalação da usina de 75kWp dentro do cronograma e suporte impecável.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Coluna Direita: Contato, Proteção e FAQ (4 colunas) */}
                      <div className="col-span-4 space-y-1.5">
                        {/* Contato Direto */}
                        <div
                          className={`p-1.5 rounded bg-white border transition-all ${
                            step.id === 'contacts'
                              ? 'border-[#f8ca3a] shadow-md ring-2 ring-[#f8ca3a]/50'
                              : 'border-slate-200'
                          }`}
                        >
                          <span className="font-bold text-[7px] text-[#09172f] block mb-1">Contato Direto</span>
                          <div className="space-y-0.5 text-[5.5px]">
                            <div className="p-0.5 rounded bg-emerald-50 text-emerald-800 font-medium">
                              WhatsApp Comercial
                            </div>
                            <div className="p-0.5 rounded bg-slate-100 text-slate-700">Telefone: (19) 3290-****</div>
                          </div>
                        </div>

                        {/* Perfil Protegido */}
                        <div
                          className={`p-1.5 rounded bg-[#09172f] text-white border transition-all ${
                            step.id === 'exclusive'
                              ? 'border-[#f8ca3a] shadow-md ring-2 ring-[#f8ca3a]/50'
                              : 'border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-1 text-[6px] font-bold text-[#f8ca3a]">
                            <ShieldCheck className="w-2 h-2" />
                            <span>PERFIL BLINDADO</span>
                          </div>
                          <p className="text-[5px] text-[#d0e2ff] mt-0.5 leading-tight">
                            Sem anúncios de concorrentes nesta Brand Page.
                          </p>
                        </div>

                        {/* FAQ e Portfólio */}
                        <div
                          className={`p-1.5 rounded bg-white border transition-all ${
                            step.id === 'projects'
                              ? 'border-[#f8ca3a] shadow-md ring-2 ring-[#f8ca3a]/50'
                              : 'border-slate-200'
                          }`}
                        >
                          <span className="font-bold text-[6.5px] text-[#09172f] block">Portfólio &amp; FAQ</span>
                          <span className="text-[5px] text-slate-500 block">12 usinas homologadas</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ETAPA 7: DASHBOARD PRIVADO ANALÍTICO */
                  <div className="w-full h-full bg-[#09172f] text-white p-3 flex flex-col justify-between text-[7px] select-none">
                    <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded bg-[#0f62fe] flex items-center justify-center">
                          <BarChart3 className="w-2.5 h-2.5 text-white" />
                        </div>
                        <div>
                          <span className="font-bold text-[7.5px] block">Dashboard Analítico SolarMax</span>
                          <span className="text-[5.5px] text-[#a6c8ff]">Visão restrita ao administrador</span>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-[#107c41] text-white font-mono text-[5.5px]">
                        DADOS EM TEMPO REAL
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 my-2">
                      <div className="p-1.5 rounded bg-white/5 border border-white/10">
                        <span className="text-[5.5px] text-[#a6c8ff] block">Acessos na Brand Page</span>
                        <span className="text-[9px] font-bold font-mono text-white">1.840</span>
                        <span className="text-[5px] text-emerald-400 block mt-0.5">+24% este mês</span>
                      </div>
                      <div className="p-1.5 rounded bg-white/5 border border-white/10">
                        <span className="text-[5.5px] text-[#a6c8ff] block">Cliques em WhatsApp</span>
                        <span className="text-[9px] font-bold font-mono text-[#f8ca3a]">142</span>
                        <span className="text-[5px] text-emerald-400 block mt-0.5">Conversão direta</span>
                      </div>
                      <div className="p-1.5 rounded bg-white/5 border border-white/10">
                        <span className="text-[5.5px] text-[#a6c8ff] block">Propostas Solicitadas</span>
                        <span className="text-[9px] font-bold font-mono text-white">38</span>
                        <span className="text-[5px] text-[#d0e2ff] block mt-0.5">Sem intermediários</span>
                      </div>
                    </div>

                    <div className="p-1.5 rounded bg-white/5 border border-white/10 flex items-center justify-between text-[6px]">
                      <span className="text-[#d0e2ff]">Origem geográfica principal: Campinas, Ribeirão Preto e Região</span>
                      <span className="text-[#f8ca3a] font-bold font-mono">100% TRANSPARÊNCIA</span>
                    </div>
                  </div>
                )}

                {/* CURSOR DEMONSTRATIVO SVG (07 Cursor Tour Motion) */}
                {!shouldReduceMotion && (
                  <motion.div
                    className="absolute z-30 pointer-events-none"
                    animate={{
                      left: `${step.cursorPos.x}%`,
                      top: `${step.cursorPos.y}%`,
                    }}
                    transition={{
                      duration: 0.8,
                      ease: EASING_CUBIC,
                    }}
                  >
                    {/* SVG do Cursor com estilo macOS/Screen Studio */}
                    <div className="relative">
                      <svg
                        className="w-5 h-5 drop-shadow-md"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M4 3L11.5 21L14.5 13.5L22 10.5L4 3Z"
                          fill="#09172f"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                        />
                      </svg>

                      {/* Efeito de Clique / Ripple ao mudar de etapa */}
                      {clickEffect && (
                        <span
                          className="absolute -top-1 -left-1 w-7 h-7 rounded-full bg-[#f8ca3a]/40 border-2 border-[#f8ca3a] animate-ping pointer-events-none"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between w-full max-w-[680px] text-[11px] font-mono text-[#8a99b5]">
            <span>MOCKUP WIDESCREEN · INTERFACE HOMOLOGADA</span>
            <span>CLIQUE NA TELA PARA PAUSAR</span>
          </div>
        </div>

        {/* LADO DIREITO: PAINEL DE CONTROLE E EXPLICAÇÃO (5 colunas) */}
        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-white border-t lg:border-t-0 lg:border-l border-[#d0d7de]">
          <div>
            {/* Header com Tag da Etapa */}
            <div className="flex items-center justify-between gap-3 border-b border-[#e5e7eb] pb-4">
              <span className="font-mono text-xs font-bold tracking-wider text-[#0f62fe] bg-[#edf5ff] px-2.5 py-1 rounded">
                RECURSO {step.stepNumber}
              </span>
              <span
                className={`text-[11px] font-bold font-mono px-2.5 py-1 rounded-full border ${
                  step.tagType === 'base'
                    ? 'bg-[#e8f8f0] text-[#146a4c] border-[#bbf7d0]'
                    : step.tagType === 'exclusive'
                    ? 'bg-[#f5f3ff] text-[#5b21b6] border-[#ddd6fe]'
                    : 'bg-[#fffbeb] text-[#92400e] border-[#fde68a]'
                }`}
              >
                {step.tag}
              </span>
            </div>

            {/* Ícone, Título e Descrição */}
            <div className="pt-6">
              <div className="w-12 h-12 rounded-xl bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center mb-4">
                {step.icon}
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-[#09172f] tracking-tight leading-snug">
                {step.title}
              </h3>

              <p className="mt-3 text-sm text-[#475569] leading-relaxed">{step.desc}</p>
            </div>

            {/* Benefício Comercial */}
            <div className="mt-5 p-3.5 rounded-lg bg-[#f8fafc] border-l-4 border-[#f8ca3a] border border-[#e2e8f0]">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#107c41] shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs font-bold text-[#09172f] font-mono uppercase tracking-wide">
                    Impacto para a sua empresa:
                  </span>
                  <span className="text-xs text-[#334155] leading-normal">{step.benefit}</span>
                </div>
              </div>
            </div>

            {/* Onde Fica na Interface */}
            <div className="mt-3 text-xs text-[#64748b] font-mono flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#0f62fe] shrink-0" />
              <span>{step.where}</span>
            </div>
          </div>

          {/* CONTROLES DE NAVEGAÇÃO E DOTS */}
          <div className="pt-6 border-t border-[#e5e7eb] mt-6 space-y-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePrev}
                className="w-12 h-12 rounded-lg border border-[#cbd5e1] hover:bg-[#f1f5f9] active:bg-[#e2e8f0] text-[#09172f] flex items-center justify-center font-bold transition-colors"
                aria-label="Recurso anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="flex-1 h-12 rounded-lg bg-[#0f62fe] hover:bg-[#0043ce] active:bg-[#002d9c] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <span>{currentStep === TOUR_STEPS.length - 1 ? 'Reiniciar Demonstração' : 'Avançar para Próximo'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Dots Indicadores Clicáveis */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                {TOUR_STEPS.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => goToStep(idx, true)}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentStep ? 'w-8 bg-[#0f62fe]' : 'w-2 bg-[#cbd5e1] hover:bg-[#94a3b8]'
                    }`}
                    aria-label={`Ir para etapa ${idx + 1}: ${s.title}`}
                  />
                ))}
              </div>

              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackFounderCtaClick('tour_agendamento_link', BOOKING_URL)}
                className="text-xs font-bold text-[#0f62fe] hover:underline flex items-center gap-1 font-mono"
              >
                Agendar Apresentação <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
