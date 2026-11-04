'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar,
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Linkedin,
  BookOpen,
} from 'lucide-react';

import FounderHeroMotion from '@/components/founder/FounderHeroMotion';
import FounderCursorTour from '@/components/founder/FounderCursorTour';
import FounderConversionTour from '@/components/founder/FounderConversionTour';
import FounderBeforeAfter from '@/components/founder/FounderBeforeAfter';
import FounderProcessDraw from '@/components/founder/FounderProcessDraw';
import FounderSuccessJourneySection from '@/components/founder/FounderSuccessJourneySection';
import { trackFounderPageView, trackFounderCtaClick } from '@/components/founder/FounderTelemetry';

const BOOKING_URL = 'https://zbooking.us/6shCH';
const LINKEDIN_URL = 'https://www.linkedin.com/in/felipe-morais-8bb61a7b/';
const BLOG_URL = '/blog/plano-founder-avalia-solar';
const CONTACT_EMAIL = 'growth@avaliasolar.com.br';

const FAQS = [
  {
    q: 'O que é exatamente o Plano Founder da Avalia Solar?',
    a: 'O Plano Founder é um programa comercial exclusivo de lançamento voltado aos primeiros parceiros pioneiros da Avalia Solar. Ele combina o benefício de dois meses gratuitos com a estruturação de uma Brand Page profissional, presença no diretório empresarial e acesso a recursos de reputação.',
  },
  {
    q: 'O que está incluído nos 2 meses gratuitos de lançamento?',
    a: 'Nos dois meses iniciais, a empresa tem acesso sem custo de mensalidade aos recursos previstos no seu pacote de homologação, como perfil empresarial verificado, catálogo de produtos e serviços, canais de contato direto e recebimento de avaliações de clientes.',
  },
  {
    q: 'O Founder inclui a retirada de anúncios de concorrentes?',
    a: 'Sim, a arquitetura dos planos pagos contempla a proteção do perfil com a ocultação de anúncios e links de empresas concorrentes na página da sua marca. A regra entra em vigor mediante a habilitação do plano contratado.',
  },
  {
    q: 'O programa garante volume de vendas ou orçamentos?',
    a: 'Não. A Avalia Solar não vende contatos nem promete metas financeiras ou volumes artificiais de orçamentos. O objetivo é fornecer a infraestrutura de credibilidade, posicionamento e prova social para que compradores qualificados encontrem e escolham sua empresa.',
  },
  {
    q: 'Minha empresa terá prioridade no ranking orgânico de avaliações?',
    a: 'Não. O ranking de reputação do portal segue metodologia técnica e isonômica com base em avaliações autênticas de consumidores reais. Recursos de patrocínio ou destaque publicitário, quando contratados, são devidamente sinalizados como patrocinados.',
  },
  {
    q: 'Posso solicitar avaliações dos meus clientes atuais?',
    a: 'Sim, e recomendamos fortemente. Você pode disponibilizar o link direto do seu perfil verificado para que clientes reais relatem sua experiência de forma espontânea. Avaliações com notas detalhadas aumentam expressivamente o TrustScore da empresa.',
  },
  {
    q: 'A página da minha empresa será indexada pelo Google?',
    a: 'Nossa plataforma é construída sobre arquitetura Next.js com SEO, schema.org e dados estruturados modernos para acelerar a indexação. A presença de catálogo detalhado e avaliações contribui diretamente para a descoberta nos buscadores.',
  },
  {
    q: 'Posso cadastrar filiais ou unidades regionais?',
    a: 'Sim. Durante a apresentação do programa, nossa equipe avalia a estrutura da sua empresa (matriz e filiais) e configura o modelo ideal de perfil para atender suas praças.',
  },
  {
    q: 'Ser "Founder" concede participação societária na Avalia Solar?',
    a: 'Não. "Founder" é a denominação estritamente comercial do programa de entrada para os primeiros membros da plataforma. Não confere cotas, direitos societários ou vínculos corporativos.',
  },
  {
    q: 'Como funciona a renovação após os 2 meses gratuitos?',
    a: 'Antes da conclusão dos 60 dias de gratuidade, apresentamos o balanço de métricas da sua página. A continuidade no plano pago ocorre apenas mediante sua confirmação expressa e escolha do pacote comercial mais adequado.',
  },
  {
    q: 'Quais documentos ou dados preciso enviar para ativação?',
    a: 'Basta agendar a reunião de alinhamento. Solicitaremos o CNPJ ativo da empresa, logotipo em alta resolução, fotos dos produtos ou catálogo em PDF e os contatos comerciais que devem constar na página.',
  },
  {
    q: 'Como realizo o agendamento da minha apresentação?',
    a: 'Você pode escolher o dia e horário que melhor se adaptem à sua agenda diretamente pelo link oficial de agendamento: https://zbooking.us/6shCH. A sessão dura cerca de 20 minutos.',
  },
];

export default function FounderPageClient() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    trackFounderPageView();
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  const handleBookingClick = (location: string) => {
    trackFounderCtaClick(`founder_${location}_booking`, BOOKING_URL);
  };

  const handleBlogClick = (location: string) => {
    trackFounderCtaClick(`founder_${location}_blog`, BLOG_URL);
  };

  return (
    <div className="bg-[#f4f7fb] text-[#161616] antialiased selection:bg-[#0f62fe] selection:text-white overflow-x-hidden">
      {/* BARRA SUPERIOR TÉCNICA IBM CARBON */}
      <div className="border-b border-[#d0d7de] bg-[#09172f] text-white py-2 px-4 text-xs font-mono">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#f8ca3a] animate-pulse" />
            <span className="tracking-wider text-[#d0e2ff] font-semibold">
              AVALIA SOLAR · PROGRAMA EXCLUSIVO FOUNDER 2026
            </span>
          </div>
          <div className="flex items-center gap-4 text-[#8a99b5]">
            <span>HOMOLOGAÇÃO B2B</span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline text-white font-medium">CONDIÇÃO DE 60 DIAS SEM MENSALIDADE</span>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleBookingClick('topbar')}
              className="text-[#f8ca3a] hover:underline flex items-center gap-1 font-bold"
            >
              Agendar Apresentação <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* REQUISITO 2: HERO REVEAL MOTION PACK */}
      <FounderHeroMotion />

      <FounderSuccessJourneySection />

      {/* REQUISITO 3: INTERACTIVE BRAND PAGE TOUR (SOLARMAX INTEGRADORA) */}
      <FounderCursorTour />

      {/* REQUISITO 5: BEFORE / AFTER INTERATIVO ARRASTÁVEL */}
      <FounderBeforeAfter />

      {/* TOUR DOS PONTOS DE CONVERSÃO */}
      <FounderConversionTour />

      {/* REQUISITO 6: PROCESS DRAW (3 ETAPAS DA JORNADA REAL) */}
      <FounderProcessDraw />

      {/* SEÇÃO: CONVERSE COM O FUNDADOR FELIPE HENRIQUE MORAIS */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#d0d7de]">
        <div className="max-w-4xl mx-auto rounded-3xl border-2 border-[#09172f] bg-white p-6 sm:p-10 shadow-2xl flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Foto Oficial do Fundador */}
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden shrink-0 border-4 border-[#f8ca3a] shadow-xl bg-slate-100">
            <Image
              src="/images/felipe-morais-fundador.jpg"
              alt="Felipe Henrique Morais - Fundador Avalia Solar"
              fill
              sizes="160px"
              className="object-cover object-top"
              priority
            />
          </div>

          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="flex flex-wrap items-center justify-center md:justify-between gap-3">
              <div>
                <span className="text-xs font-mono font-bold tracking-wider uppercase text-[#0f62fe] bg-[#edf5ff] px-2.5 py-0.5 rounded">
                  LIDERANÇA &amp; INOVAÇÃO
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-[#09172f] mt-1">
                  Felipe Henrique Morais
                </h3>
                <p className="text-sm font-bold text-[#0f62fe]">Fundador</p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackFounderCtaClick('founder_card_linkedin', LINKEDIN_URL)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#cbd5e1] hover:border-[#0077b5] text-xs font-bold text-[#334155] hover:text-[#0077b5] hover:bg-[#0077b5]/5 transition-all"
                >
                  <Linkedin className="w-3.5 h-3.5 text-[#0077b5]" />
                  <span>LinkedIn</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </div>

            <p className="text-sm sm:text-base text-[#475569] leading-relaxed">
              &ldquo;Construímos o Avalia Solar com o propósito de transformar a reputação e o acesso comercial no
              setor de energia solar no Brasil. O Plano Founder é a nossa forma de abrir as portas e trabalhar
              lado a lado com as empresas que compartilham da nossa visão de qualidade e transparência.&rdquo;
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleBookingClick('founder_card')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#f8ca3a] hover:bg-[#fed957] text-[#09172f] font-bold text-xs tracking-wide shadow-md transition-all transform hover:-translate-y-0.5"
              >
                <Calendar className="w-4 h-4 text-[#09172f]" />
                <span>Agendar Conversa com o Fundador (zbooking.us/6shCH)</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>

              <Link
                href={BLOG_URL}
                onClick={() => handleBlogClick('founder_card')}
                className="inline-flex items-center gap-1.5 px-4 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#0f62fe]" />
                <span>Ler Artigo Completo no Blog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO: FAQ (PERGUNTAS FREQUENTES) ESTILO IBM CARBON ACCORDION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-[#d0d7de]">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#edf5ff] border border-[#d0e2ff] text-xs font-mono text-[#0043ce] uppercase tracking-wider mb-2">
            Perguntas Frequentes
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#09172f] tracking-tight">
            Esclareça todas as dúvidas sobre o programa
          </h2>
          <p className="mt-2 text-sm text-[#475569]">
            Compromisso ético e transparência jurídica para você tomar sua decisão com segurança.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={faq.q}
                className="rounded-xl border border-[#d0d7de] bg-white overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[#09172f] hover:bg-[#f8fafc] transition-colors"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#0f62fe] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-sm text-[#475569] leading-relaxed border-t border-[#f1f5f9]">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* CALLOUT FINAL DE AGENDAMENTO (CARBON NAVY BLUE CTA) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#09172f] via-[#0f2c5d] to-[#164387] text-white p-8 sm:p-12 lg:p-16 shadow-2xl border border-white/20">
          <div className="relative z-10 max-w-3xl">
            <span className="text-xs font-mono uppercase tracking-widest text-[#f8ca3a] font-bold">
              OPORTUNIDADE DE LANÇAMENTO EXCLUSIVA
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white mt-2 mb-4 leading-tight">
              Construa a autoridade digital da sua empresa de energia solar desde agora.
            </h2>
            <p className="text-sm sm:text-base text-[#d0e2ff] leading-relaxed mb-8 max-w-2xl">
              Agende agora uma conversa de 20 minutos com nosso time comercial. Conheça as condições, reserve sua
              Brand Page e aproveite os dois meses gratuitos de homologação.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleBookingClick('callout_final')}
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-[#f8ca3a] text-[#09172f] font-black text-sm tracking-wide shadow-xl hover:bg-[#fed957] transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Calendar className="w-4 h-4 text-[#09172f]" />
                <span>Agendar Apresentação em zbooking.us/6shCH</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>

              <Link
                href={BLOG_URL}
                onClick={() => handleBlogClick('callout_final')}
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-sm hover:bg-white/20 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-[#f8ca3a]" />
                <span>Ver Artigo do Plano Founder no Blog</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href={`mailto:${CONTACT_EMAIL}?subject=Interesse%20no%20Plano%20Founder`}
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-[#a6c8ff] hover:text-white font-medium text-xs font-mono transition-colors"
              >
                <span>Falar via E-mail ({CONTACT_EMAIL})</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* NOTA DE RODAPÉ JURÍDICA E DISCLAIMER */}
      <footer className="py-8 px-4 text-center text-xs text-[#64748b] border-t border-[#d0d7de] max-w-7xl mx-auto font-mono">
        <p className="max-w-4xl mx-auto leading-relaxed">
          *Oferta de 2 meses gratuitos válida conforme condições de adesão, elegibilidade e disponibilidade
          técnica durante o período de lançamento. A Avalia Solar não garante volume de vendas, orçamentos ou
          posicionamento orgânico fixo. Confirme o escopo detalhado na proposta comercial.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[#0f62fe]">
          <Link href="/terms" className="hover:underline">
            Termos de Uso
          </Link>
          <span>·</span>
          <Link href="/privacy" className="hover:underline">
            Política de Privacidade
          </Link>
          <span>·</span>
          <Link href={BLOG_URL} className="hover:underline font-semibold">
            Artigo do Plano Founder
          </Link>
          <span>·</span>
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleBookingClick('footer')}
            className="hover:underline font-bold"
          >
            Agendamento Oficial (zbooking.us/6shCH)
          </a>
        </div>
      </footer>
    </div>
  );
}
