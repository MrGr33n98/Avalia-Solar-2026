'use client';

import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Search, ShieldCheck, Settings, Check, ArrowUpRight, Sparkles } from 'lucide-react';
import { trackFounderCtaClick } from './FounderTelemetry';

const BOOKING_URL = 'https://zbooking.us/6shCH';
const EASING_CUBIC = [0.16, 1, 0.3, 1] as const;

interface ProcessStep {
  number: string;
  title: string;
  subtitle: string;
  desc: string;
  icon: React.ReactNode;
}

const PROCESS_STEPS: ProcessStep[] = [
  {
    number: '01',
    title: 'Localizar ou Cadastrar Empresa',
    subtitle: 'Diretório Nacional de Energia Solar',
    desc: 'Localize sua empresa no diretório oficial da Avalia Solar ou efetue um novo registro caso sua marca ainda não conste na base.',
    icon: <Search className="w-5 h-5 text-[#0f62fe]" />,
  },
  {
    number: '02',
    title: 'Solicitar Administração & Homologação',
    subtitle: 'Comprovação de Titularidade e CNPJ',
    desc: 'Nossa equipe de curadoria valida o CNPJ ativo e a titularidade institucional, liberando as credenciais de gestão e os 2 meses gratuitos.',
    icon: <ShieldCheck className="w-5 h-5 text-[#107c41]" />,
  },
  {
    number: '03',
    title: 'Configurar Brand Page & Catálogo',
    subtitle: 'Vitrine Técnica e Avaliações Reais',
    desc: 'Insira logotipo em alta resolução, vincule os produtos homologados, configure os botões de contato direto e receba depoimentos de clientes.',
    icon: <Settings className="w-5 h-5 text-[#f8ca3a]" />,
  },
];

export default function FounderProcessDraw() {
  const shouldReduceMotion = useReducedMotion();
  const [isInView, setIsInView] = useState(false);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#d0d7de]">
      <div className="max-w-3xl mb-14 text-center mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#edf5ff] border border-[#d0e2ff] text-xs font-mono text-[#0043ce] uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Jornada Real de Ativação · Process Draw
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#09172f] tracking-tight">
          Como funciona a ativação do Plano Founder
        </h2>
        <p className="mt-3 text-sm sm:text-base text-[#475569] leading-relaxed">
          Um processo em 3 etapas simples para colocar sua Brand Page no ar com total respaldo
          técnico e curadoria da nossa equipe.
        </p>
      </div>

      {/* CONTAINER DAS 3 ETAPAS COM LINHA CONECTORA SVG ANIMADA (08 Process Draw Motion) */}
      <div
        className="relative"
        onMouseEnter={() => setIsInView(true)}
      >
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10"
          onViewportEnter={() => setIsInView(true)}
          viewport={{ once: true, amount: 0.3 }}
        >
          {PROCESS_STEPS.map((step, idx) => (
            <motion.div
              key={step.number}
              className="relative rounded-2xl border border-slate-300 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
              transition={{
                duration: 0.6,
                delay: shouldReduceMotion ? 0 : idx * 0.25,
                ease: EASING_CUBIC,
              }}
            >
              <div>
                {/* Cabeçalho do Card */}
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#f1f5f9] border border-slate-200 flex items-center justify-center">
                    {step.icon}
                  </div>
                  <span className="font-mono text-2xl font-black text-slate-300">
                    {step.number}
                  </span>
                </div>

                <span className="font-mono text-[11px] font-bold text-[#0f62fe] uppercase tracking-wider block mb-1">
                  {step.subtitle}
                </span>

                <h3 className="text-lg font-black text-[#09172f] tracking-tight">
                  {step.title}
                </h3>

                <p className="mt-2 text-sm text-[#475569] leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-[#107c41] font-mono font-bold">
                <Check className="w-4 h-4 shrink-0" />
                <span>ETAPA HOMOLOGADA</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Linha Conectora SVG de Fundo (Apenas Desktop) */}
        {!shouldReduceMotion && (
          <div className="hidden md:block absolute top-1/2 left-10 right-10 -translate-y-1/2 h-1 z-0 pointer-events-none">
            <svg className="w-full h-4 overflow-visible" preserveAspectRatio="none">
              <motion.line
                x1="0"
                y1="2"
                x2="100%"
                y2="2"
                stroke="#0f62fe"
                strokeWidth="2"
                strokeDasharray="6 6"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={isInView ? { pathLength: 1, opacity: 0.4 } : { pathLength: 0, opacity: 0 }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
              />
            </svg>
          </div>
        )}
      </div>

      {/* Box de Ação para Iniciar Processo */}
      <div className="mt-12 text-center">
        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackFounderCtaClick('process_draw_agendar', BOOKING_URL)}
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#09172f] hover:bg-[#16294a] text-white font-bold text-sm shadow-md transition-all transform hover:-translate-y-0.5"
        >
          <span>Iniciar Etapa 01 com a Equipe Comercial</span>
          <ArrowUpRight className="w-4 h-4 text-[#f8ca3a]" />
        </a>
      </div>
    </section>
  );
}

