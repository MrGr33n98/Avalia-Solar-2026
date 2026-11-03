'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Calendar, ArrowRight, ArrowUpRight, Check, Laptop, BookOpen } from 'lucide-react';
import { trackFounderCtaClick } from './FounderTelemetry';

const BOOKING_URL = 'https://zbooking.us/6shCH';
const BLOG_URL = '/blog/plano-founder-avalia-solar';

export default function FounderHeroMotion() {
  const shouldReduceMotion = useReducedMotion();

  const handleBookingClick = (location: string) => {
    trackFounderCtaClick(`hero_agendamento_${location}`, BOOKING_URL);
  };

  const handleBlogClick = () => {
    trackFounderCtaClick('hero_conhecer_artigo_blog', BLOG_URL);
  };

  // Variantes para revelação progressiva e suave
  const containerVariants = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.12,
        delayChildren: shouldReduceMotion ? 0 : 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const laptopVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 40,
      rotateX: shouldReduceMotion ? 0 : 18,
      scale: shouldReduceMotion ? 1 : 0.94,
    },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      scale: 1,
      transition: {
        duration: 0.9,
        ease: [0.16, 1, 0.3, 1],
        delay: shouldReduceMotion ? 0 : 0.35,
      },
    },
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#09172f] via-[#0f2c5d] to-[#164387] text-white pt-14 pb-20 border-b border-[#0f346b]">
      {/* Malha de fundo arquitetural IBM Carbon */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
        aria-hidden="true"
      />

      {/* Brilho sutil de topo */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-b from-[#0f62fe]/20 to-transparent blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
          variants={containerVariants}
          initial={shouldReduceMotion ? false : 'hidden'}
          animate="visible"
        >
          {/* Coluna de Conteúdo Editorial (7 colunas) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Badge Selo Founder */}
            <motion.div variants={itemVariants}>
              <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-mono text-[#f8ca3a] uppercase tracking-widest shadow-inner">
                <span className="w-2 h-2 rounded-full bg-[#f8ca3a] animate-pulse" />
                <span>Brand Page Oficial · Programa de Lançamento 2026</span>
              </div>
            </motion.div>

            {/* Headline com Destaque Amarelo Progressivo */}
            <motion.h1
              className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.14] text-white"
              variants={itemVariants}
            >
              Plano Founder Avalia Solar:{' '}
              <span className="relative inline-block text-white">
                <span className="relative z-10">construa sua presença</span>
                {/* Linha de Destaque Amarelo Animada da Esquerda para Direita */}
                <motion.span
                  className="absolute left-0 bottom-1 w-full h-3 bg-[#f8ca3a]/80 -z-0 rounded-sm"
                  initial={shouldReduceMotion ? { scaleX: 1 } : { scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    duration: 0.7,
                    delay: shouldReduceMotion ? 0 : 0.45,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  style={{ transformOrigin: 'left center' }}
                  aria-hidden="true"
                />
              </span>{' '}
              desde o primeiro dia.
            </motion.h1>

            {/* Subtítulo Descritivo */}
            <motion.p
              className="text-base sm:text-lg text-[#d0e2ff] leading-relaxed max-w-2xl font-normal"
              variants={itemVariants}
            >
              Posicione sua marca em um diretório empresarial auditado. Reúna catálogo de produtos,
              avaliações reais de clientes e canais de contato direto — com condição especial de 2 meses
              gratuitos para os primeiros parceiros da plataforma.
            </motion.p>

            {/* Grupo de Ações (CTAs com links bidirecionais e agendamento) */}
            <motion.div
              className="pt-2 flex flex-wrap items-center gap-4"
              variants={itemVariants}
            >
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleBookingClick('principal')}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-[#f8ca3a] text-[#09172f] font-bold text-sm tracking-wide shadow-xl hover:bg-[#fed957] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Calendar className="w-4 h-4 text-[#09172f]" />
                <span>Agendar Apresentação Executiva</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>

              <a
                href="#tour-interativo"
                className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white font-medium text-sm hover:bg-white/20 transition-colors"
              >
                <Laptop className="w-4 h-4 text-[#f8ca3a]" />
                <span>Explorar Tour da Tela</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <Link
                href={BLOG_URL}
                onClick={handleBlogClick}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-4 text-xs font-mono text-[#a6c8ff] hover:text-white transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#f8ca3a]" />
                <span className="underline decoration-white/30 underline-offset-4">Ler artigo detalhado no Blog</span>
              </Link>
            </motion.div>

            {/* Garantias em Formato IBM Carbon */}
            <motion.div
              className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-white/15 text-xs font-mono text-[#a6c8ff]"
              variants={itemVariants}
            >
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#f8ca3a] shrink-0" />
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
              className="relative mx-auto max-w-lg lg:max-w-none"
              variants={laptopVariants}
            >
              {/* Badge de Empresa de Referência */}
              <div className="absolute -top-3 -left-2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white text-[#09172f] text-xs font-bold shadow-2xl border border-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-[#107c41]" />
                <span>Brand Page Homologada Oficial</span>
              </div>

              {/* Moldura de Vidro Fosco */}
              <div className="relative rounded-2xl p-2 bg-gradient-to-b from-white/20 to-white/5 border border-white/20 shadow-2xl backdrop-blur-md">
                <div className="relative overflow-hidden rounded-xl bg-black aspect-[4/3] w-full">
                  <Image
                    src="/assets/founder-laptop.jpg"
                    alt="Notebook exibindo Brand Page corporativa no Avalia Solar"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 520px"
                    className="object-contain"
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-[#8cb4f5] font-mono px-1">
                <span>Visualização desktop widescreen</span>
                <a
                  href="#tour-interativo"
                  className="text-[#f8ca3a] hover:underline flex items-center gap-1 font-semibold"
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
