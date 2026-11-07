'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { Calendar, ArrowRight, ArrowUpRight, Check, BookOpen } from 'lucide-react';
import { trackFounderCtaClick } from './FounderTelemetry';

const BOOKING_URL = 'https://zbooking.us/6shCH';
const BLOG_URL = '/blog/plano-founder-avalia-solar';
const EASING_CUBIC = [0.16, 1, 0.3, 1] as const;

export default function FounderHeroMotion() {
  const shouldReduceMotion = useReducedMotion();

  const handleBookingClick = (location: string) => {
    trackFounderCtaClick(`hero_agendamento_${location}`, BOOKING_URL);
  };

  const handleBlogClick = () => {
    trackFounderCtaClick('hero_conhecer_artigo_blog', BLOG_URL);
  };

  // Variantes para revelação progressiva e suave
  const containerVariants: Variants = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.09,
        delayChildren: shouldReduceMotion ? 0 : 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.42, ease: EASING_CUBIC },
    },
  };

  const laptopVariants: Variants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 24,
      rotateX: shouldReduceMotion ? 0 : 8,
      scale: shouldReduceMotion ? 1 : 0.98,
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      scale: 1,
      transition: {
        duration: 0.65,
        ease: EASING_CUBIC,
        delay: shouldReduceMotion ? 0 : 0.20,
      },
    },
  };

  return (
    <section className="relative overflow-hidden border-b border-[#dde1e6] bg-white pt-9 pb-11 text-[#09172f] sm:pt-14 sm:pb-16">
      {/* Malha de fundo arquitetural IBM Carbon */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #0f62fe 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
        aria-hidden="true"
      />

      {/* Brilho sutil de topo */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-48 w-72 bg-gradient-to-b from-[#0f62fe]/[0.04] to-transparent blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="grid grid-cols-1 items-center gap-8 sm:gap-10 lg:grid-cols-12 lg:gap-12"
          variants={containerVariants}
          initial={shouldReduceMotion ? false : 'hidden'}
          animate="visible"
        >
          {/* Coluna de Conteúdo Editorial (7 colunas) */}
          <div className="space-y-5 lg:col-span-7">
            {/* Badge Selo Founder */}
            <motion.div variants={itemVariants}>
              <div className="inline-flex max-w-full items-center gap-2 rounded-md border border-[#d0e2ff] bg-[#edf5ff] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#0043ce] sm:text-xs">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#f8ca3a] animate-pulse" />
                <span>Brand Page Oficial · Programa de Lançamento 2026</span>
              </div>
            </motion.div>

            {/* Headline com Destaque Amarelo Progressivo */}
            <motion.h1
              className="text-[clamp(30px,8.3vw,43px)] font-bold leading-[1.14] tracking-[-0.04em] text-[#09172f] lg:text-[50px]"
              variants={itemVariants}
            >
              Plano Founder Avalia Solar:{' '}
              <span className="relative inline-block text-[#09172f]">
                <span className="relative z-10">construa sua presença</span>
                {/* Linha de Destaque Amarelo Animada da Esquerda para Direita */}
                <motion.span
                  className="absolute bottom-0 left-0 -z-0 h-2 w-full rounded-[2px] bg-[#f8ca3a]/80"
                  initial={shouldReduceMotion ? { scaleX: 1 } : { scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    duration: 0.52,
                    delay: shouldReduceMotion ? 0 : 0.3,
                    ease: EASING_CUBIC,
                  }}
                  style={{ transformOrigin: 'left center' }}
                  aria-hidden="true"
                />
              </span>{' '}
              desde o primeiro dia.
            </motion.h1>

            {/* Subtítulo Descritivo */}
            <motion.p
              className="max-w-2xl text-[14px] font-normal leading-[1.65] text-[#475569] sm:text-base"
              variants={itemVariants}
            >
              Posicione sua marca em um diretório empresarial auditado. Reúna catálogo de produtos,
              avaliações reais de clientes e canais de contato direto — com condição especial de 2 meses
              gratuitos para os primeiros parceiros da plataforma.
            </motion.p>

            {/* Grupo de Ações (CTAs com links bidirecionais e agendamento) */}
            <motion.div
              className="flex flex-col items-stretch gap-2.5 pt-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3"
              variants={itemVariants}
            >
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleBookingClick('principal')}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#f8ca3a] px-4 py-3 text-sm font-bold text-[#09172f] shadow-sm transition-colors hover:bg-[#fed957] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f62fe]"
              >
                <Calendar className="w-4 h-4 text-[#09172f]" />
                <span>Agendar Apresentação Executiva</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>

              <a
                href="#tour-interativo"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#dde1e6] bg-white px-4 py-3 text-sm font-semibold text-[#09172f] transition-colors hover:bg-[#edf5ff]"
              >
                
                <span>Explorar Tour da Tela</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <Link
                href={BLOG_URL}
                onClick={handleBlogClick}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-[#0043ce] hover:underline sm:justify-start"
              >
                <BookOpen className="h-3.5 w-3.5 text-[#0f62fe]" />
                <span className="underline decoration-[#0f62fe]/40 underline-offset-4">Ler artigo detalhado no Blog</span>
              </Link>
            </motion.div>

            {/* Garantias em Formato IBM Carbon */}
            <motion.div
              className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[#dde1e6] pt-4 text-[10px] font-semibold leading-5 text-[#475569] sm:grid-cols-3 sm:text-xs"
              variants={itemVariants}
            >
              <div className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 shrink-0 text-[#0f62fe]" />
                <span>2 MESES GRÁTIS NO LANÇAMENTO*</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#f8ca3a] shrink-0" />
                <span>ENERGIA SOLAR &amp; MOBILIDADE</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#f8ca3a] shrink-0" />
                <span>ADESÃO COM ESCOPO CLARO</span>
              </div>
            </motion.div>
          </div>

          {/* Coluna Visual: Laptop Teaser com Entrada 3D Suave (5 colunas) */}
          <div className="lg:col-span-5 relative perspective-[1200px]">
            <motion.div
              className="relative mx-auto max-w-[530px] lg:max-w-none"
              variants={laptopVariants}
            >
              {/* Badge de Empresa de Referência */}
              <div className="absolute -top-3 left-2 z-20 flex items-center gap-2 rounded-md border border-[#dde1e6] bg-white px-2.5 py-1.5 text-[10px] font-bold text-[#09172f] shadow-sm sm:text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-[#107c41]" />
                <span>Prévia da Brand Page Avalia Solar</span>
              </div>

              {/* Moldura de Vidro Fosco */}
              <div className="relative rounded-xl border border-[#dde1e6] bg-[#f4f7fb] p-1.5 shadow-[0_18px_48px_rgba(9,23,47,0.1)] sm:p-2">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-[#09172f]">
                  <Image
                    src="/assets/founder-laptop.webp"
                    alt="Notebook exibindo Brand Page corporativa no Avalia Solar"
                    fill
                    priority
                    quality={82}
                    sizes="(max-width: 639px) 92vw, (max-width: 1024px) 72vw, 520px"
                    className="object-contain"
                  />
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between gap-2 px-1 text-[11px] text-[#66758a] sm:text-xs">
                <span>Visualização desktop widescreen</span>
                <a
                  href="#tour-interativo"
                  className="flex items-center gap-1 font-semibold text-[#0043ce] hover:underline"
                >
                  Ver tour interativo <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
