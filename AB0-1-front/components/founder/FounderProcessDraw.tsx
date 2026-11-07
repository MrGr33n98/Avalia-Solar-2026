'use client';

import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { trackFounderCtaClick } from './FounderTelemetry';

const BOOKING_URL = 'https://zbooking.us/6shCH';
const EASING_CUBIC = [0.16, 1, 0.3, 1] as const;

interface ProcessStep {
  number: string;
  title: string;
  subtitle: string;
  desc: string;
}

const PROCESS_STEPS: ProcessStep[] = [
  {
    number: '01',
    title: 'Localizar ou Cadastrar Empresa',
    subtitle: 'Diretório Nacional de Energia Solar',
    desc: 'Localize sua empresa no diretório oficial da Avalia Solar ou efetue um novo registro caso sua marca ainda não conste na base.',
  },
  {
    number: '02',
    title: 'Solicitar Administração & Homologação',
    subtitle: 'Comprovação de Titularidade e CNPJ',
    desc: 'Nossa equipe de curadoria valida o CNPJ ativo e a titularidade institucional, liberando as credenciais de gestão e os 2 meses gratuitos.',
  },
  {
    number: '03',
    title: 'Configurar Brand Page & Catálogo',
    subtitle: 'Vitrine Técnica e Avaliações Reais',
    desc: 'Insira logotipo em alta resolução, vincule os produtos homologados, configure os botões de contato direto e receba depoimentos de clientes.',
  },
];

export default function FounderProcessDraw() {
  const shouldReduceMotion = useReducedMotion();
  const [isInView, setIsInView] = useState(false);

  return (
    <section className="mx-auto max-w-7xl border-t border-[#dde1e6] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mb-7 max-w-3xl sm:mb-10">
        <div className="mb-2 inline-flex items-center rounded-md border border-[#d0e2ff] bg-[#edf5ff] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#0043ce]">
          Jornada de ativação · 3 etapas
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-[#09172f] sm:text-3xl lg:text-4xl">
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
          className="relative z-10 grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-5"
          onViewportEnter={() => setIsInView(true)}
          viewport={{ once: true, amount: 0.3 }}
        >
          {PROCESS_STEPS.map((step, idx) => (
            <motion.div
              key={step.number}
              className="relative flex flex-col justify-between rounded-lg border border-[#dde1e6] bg-white p-4 transition-colors hover:border-[#a6c8ff] sm:p-5"
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: shouldReduceMotion ? 0 : 30 }}
              transition={{
                duration: 0.36,
                delay: shouldReduceMotion ? 0 : idx * 0.12,
                ease: EASING_CUBIC,
              }}
            >
              <div>
                {/* Cabeçalho do Card */}
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xl font-semibold tabular-nums tracking-tight text-[#0f62fe]">
                    {step.number}
                  </span>
                  <span className="h-px w-9 bg-[#d0e2ff]" aria-hidden="true" />
                </div>

                <span className="font-mono text-[11px] font-bold text-[#0f62fe] uppercase tracking-wider block mb-1">
                  {step.subtitle}
                </span>

                <h3 className="text-lg font-bold tracking-tight text-[#09172f]">
                  {step.title}
                </h3>

                <p className="mt-2 text-sm text-[#475569] leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <div className="mt-4 border-t border-[#e9edf2] pt-3 text-[10px] font-semibold tracking-wide text-[#66758a]">
                ETAPA DO PROCESSO
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
      <div className="mt-7 text-left sm:mt-9">
        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackFounderCtaClick('process_draw_agendar', BOOKING_URL)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#09172f] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0043ce]"
        >
          <span>Iniciar Etapa 01 com a Equipe Comercial</span>
          <ArrowUpRight className="w-4 h-4 text-[#f8ca3a]" />
        </a>
      </div>
    </section>
  );
}

